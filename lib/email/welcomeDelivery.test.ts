import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createWelcomeEmailDeliveryStore } from "./welcomeDelivery";

type DatabaseError = {
  code?: string;
  message: string;
};

class FakeInsertQuery {
  inserted: unknown;

  constructor(private readonly error: DatabaseError | null) {}

  async insert(values: unknown) {
    this.inserted = values;
    return { error: this.error };
  }
}

class FakeTerminalQuery<T> {
  selected: string | undefined;
  updated: Record<string, unknown> | undefined;
  readonly filters: Array<[string, unknown]> = [];

  constructor(
    private readonly response: {
      data: T | null;
      error: DatabaseError | null;
    },
  ) {}

  select(columns: string) {
    this.selected = columns;
    return this;
  }

  update(values: Record<string, unknown>) {
    this.updated = values;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push([column, values]);
    return this;
  }

  async maybeSingle() {
    return this.response;
  }
}

function createFakeClient(...queries: unknown[]) {
  const tables: string[] = [];
  let queryIndex = 0;
  const client = {
    from(table: string) {
      tables.push(table);
      const query = queries[queryIndex];
      queryIndex += 1;

      if (!query) {
        throw new Error("Unexpected Supabase query");
      }

      return query;
    },
  } as unknown as SupabaseClient;

  return { client, tables };
}

describe("createWelcomeEmailDeliveryStore", () => {
  it("reserves a new Clerk user exactly once", async () => {
    const insertQuery = new FakeInsertQuery(null);
    const { client, tables } = createFakeClient(insertQuery);
    const store = createWelcomeEmailDeliveryStore(client);

    const reservation = await store.reserve("user_123", "kai@example.com");

    expect(reservation).toEqual({
      status: "acquired",
      attemptToken: expect.any(String),
    });

    expect(tables).toEqual(["welcome_email_deliveries"]);
    expect(insertQuery.inserted).toMatchObject({
      clerk_user_id: "user_123",
      email_kind: "welcome",
      recipient: "kai@example.com",
      status: "reserved",
      attempt_count: 1,
      reservation_token:
        reservation.status === "acquired"
          ? reservation.attemptToken
          : undefined,
      lease_expires_at: expect.any(String),
    });
  });

  it("treats only a unique violation as a duplicate delivery", async () => {
    const unavailableInsert = new FakeInsertQuery({
      code: "08006",
      message: "connection failed",
    });
    const unavailableStore = createWelcomeEmailDeliveryStore(
      createFakeClient(unavailableInsert).client,
    );

    await expect(
      unavailableStore.reserve("user_123", "kai@example.com"),
    ).rejects.toThrow("Unable to reserve welcome email delivery");

    const duplicateInsert = new FakeInsertQuery({
      code: "23505",
      message: "unique violation",
    });
    const existingDelivery = new FakeTerminalQuery({
      data: {
        status: "submitted",
        attempt_count: 1,
        reservation_token: "attempt-existing",
        lease_expires_at: null,
      },
      error: null,
    });
    const duplicateStore = createWelcomeEmailDeliveryStore(
      createFakeClient(duplicateInsert, existingDelivery).client,
    );

    await expect(
      duplicateStore.reserve("user_123", "kai@example.com"),
    ).resolves.toEqual({ status: "duplicate" });
  });

  it("atomically reclaims a previously failed delivery", async () => {
    const duplicateInsert = new FakeInsertQuery({
      code: "23505",
      message: "unique violation",
    });
    const failedDelivery = new FakeTerminalQuery({
      data: {
        status: "failed",
        attempt_count: 2,
        reservation_token: "attempt-failed",
        lease_expires_at: null,
      },
      error: null,
    });
    const successfulClaim = new FakeTerminalQuery({
      data: { clerk_user_id: "user_123" },
      error: null,
    });
    const store = createWelcomeEmailDeliveryStore(
      createFakeClient(
        duplicateInsert,
        failedDelivery,
        successfulClaim,
      ).client,
    );

    const reservation = await store.reserve(
      "user_123",
      "new-address@example.com",
    );

    expect(reservation).toEqual({
      status: "acquired",
      attemptToken: expect.any(String),
    });

    expect(successfulClaim.updated).toEqual({
      recipient: "new-address@example.com",
      status: "reserved",
      attempt_count: 3,
      reservation_token:
        reservation.status === "acquired"
          ? reservation.attemptToken
          : undefined,
      last_error: null,
      submitted_at: null,
      lease_expires_at: expect.any(String),
    });
    expect(successfulClaim.filters).toContainEqual(["status", "failed"]);
  });

  it("keeps a live external submission indeterminate", async () => {
    const duplicateInsert = new FakeInsertQuery({
      code: "23505",
      message: "unique violation",
    });
    const interruptedSubmission = new FakeTerminalQuery({
      data: {
        status: "submitting",
        attempt_count: 1,
        reservation_token: "attempt-live",
        lease_expires_at: "2999-01-01T00:00:00.000Z",
      },
      error: null,
    });
    const store = createWelcomeEmailDeliveryStore(
      createFakeClient(duplicateInsert, interruptedSubmission).client,
    );

    await expect(
      store.reserve("user_123", "kai@example.com"),
    ).resolves.toEqual({ status: "indeterminate" });
  });

  it("reclaims an external submission after its lease expires", async () => {
    const duplicateInsert = new FakeInsertQuery({
      code: "23505",
      message: "unique violation",
    });
    const staleSubmission = new FakeTerminalQuery({
      data: {
        status: "submitting",
        attempt_count: 1,
        reservation_token: "attempt-stale",
        lease_expires_at: "2000-01-01T00:00:00.000Z",
      },
      error: null,
    });
    const reclaimedSubmission = new FakeTerminalQuery({
      data: { clerk_user_id: "user_123" },
      error: null,
    });
    const store = createWelcomeEmailDeliveryStore(
      createFakeClient(
        duplicateInsert,
        staleSubmission,
        reclaimedSubmission,
      ).client,
    );

    const reclaimed = await store.reserve("user_123", "kai@example.com");

    expect(reclaimed).toEqual({
      status: "acquired",
      attemptToken: expect.any(String),
    });
    expect(reclaimedSubmission.filters).toContainEqual([
      "reservation_token",
      "attempt-stale",
    ]);
    expect(reclaimedSubmission.filters).toContainEqual([
      "status",
      "submitting",
    ]);
    expect(reclaimedSubmission.filters).toContainEqual([
      "lease_expires_at",
      expect.any(String),
    ]);
  });

  it("keeps retrying when a failed delivery was claimed concurrently", async () => {
    const duplicateInsert = new FakeInsertQuery({
      code: "23505",
      message: "unique violation",
    });
    const failedDelivery = new FakeTerminalQuery({
      data: {
        status: "failed",
        attempt_count: 1,
        reservation_token: "attempt-failed",
        lease_expires_at: null,
      },
      error: null,
    });
    const lostClaim = new FakeTerminalQuery({ data: null, error: null });
    const store = createWelcomeEmailDeliveryStore(
      createFakeClient(duplicateInsert, failedDelivery, lostClaim).client,
    );

    await expect(
      store.reserve("user_123", "kai@example.com"),
    ).resolves.toEqual({ status: "pending" });
  });

  it("keeps a live reservation pending and reclaims it after its lease expires", async () => {
    const liveInsert = new FakeInsertQuery({
      code: "23505",
      message: "unique violation",
    });
    const liveReservation = new FakeTerminalQuery({
      data: {
        status: "reserved",
        attempt_count: 1,
        reservation_token: "attempt-live",
        lease_expires_at: "2999-01-01T00:00:00.000Z",
      },
      error: null,
    });
    const liveStore = createWelcomeEmailDeliveryStore(
      createFakeClient(liveInsert, liveReservation).client,
    );

    await expect(
      liveStore.reserve("user_123", "kai@example.com"),
    ).resolves.toEqual({ status: "pending" });

    const staleInsert = new FakeInsertQuery({
      code: "23505",
      message: "unique violation",
    });
    const staleReservation = new FakeTerminalQuery({
      data: {
        status: "reserved",
        attempt_count: 1,
        reservation_token: "attempt-stale",
        lease_expires_at: "2000-01-01T00:00:00.000Z",
      },
      error: null,
    });
    const reclaimedReservation = new FakeTerminalQuery({
      data: { clerk_user_id: "user_123" },
      error: null,
    });
    const staleStore = createWelcomeEmailDeliveryStore(
      createFakeClient(
        staleInsert,
        staleReservation,
        reclaimedReservation,
      ).client,
    );

    const reclaimed = await staleStore.reserve(
      "user_123",
      "kai@example.com",
    );
    expect(reclaimed).toEqual({
      status: "acquired",
      attemptToken: expect.any(String),
    });
    expect(reclaimedReservation.filters).toContainEqual([
      "status",
      "reserved",
    ]);
    expect(reclaimedReservation.filters).toContainEqual([
      "lease_expires_at",
      expect.any(String),
    ]);
  });

  it("fences state transitions with the owning attempt token", async () => {
    const beginSubmission = new FakeTerminalQuery({
      data: { clerk_user_id: "user_123" },
      error: null,
    });
    const completeSubmission = new FakeTerminalQuery({
      data: { clerk_user_id: "user_123" },
      error: null,
    });
    const store = createWelcomeEmailDeliveryStore(
      createFakeClient(beginSubmission, completeSubmission).client,
    );

    await store.markSubmitting("user_123", "attempt-current");
    await store.markSubmitted("user_123", "attempt-current");

    expect(beginSubmission.updated).toEqual({
      status: "submitting",
      lease_expires_at: expect.any(String),
    });
    expect(beginSubmission.filters).toContainEqual([
      "reservation_token",
      "attempt-current",
    ]);
    expect(beginSubmission.filters).toContainEqual(["status", "reserved"]);

    expect(completeSubmission.updated).toMatchObject({
      status: "submitted",
      last_error: null,
      lease_expires_at: null,
    });
    expect(completeSubmission.updated?.submitted_at).toEqual(expect.any(String));
    expect(completeSubmission.filters).toContainEqual([
      "reservation_token",
      "attempt-current",
    ]);
    expect(completeSubmission.filters).toContainEqual([
      "status",
      "submitting",
    ]);
  });

  it("rejects terminal updates from an attempt that no longer owns the row", async () => {
    const updateQuery = new FakeTerminalQuery({ data: null, error: null });
    const store = createWelcomeEmailDeliveryStore(
      createFakeClient(updateQuery).client,
    );

    await expect(
      store.markUnknown("user_123", "attempt-stale", "timeout"),
    ).rejects.toThrow("Welcome email attempt no longer owns the reservation");
    expect(updateQuery.filters).toContainEqual([
      "reservation_token",
      "attempt-stale",
    ]);
  });
});
