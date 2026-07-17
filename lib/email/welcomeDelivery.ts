import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { WELCOME_EMAIL_KIND } from "./welcomeEmail";

const TABLE_NAME = "welcome_email_deliveries";
const UNIQUE_VIOLATION = "23505";
const MAX_ERROR_LENGTH = 1_000;
const RESERVATION_LEASE_MS = 10 * 60 * 1_000;

type DeliveryStatus =
  | "reserved"
  | "submitting"
  | "submitted"
  | "failed"
  | "unknown";

type DeliveryRow = {
  status: DeliveryStatus;
  attempt_count: number;
  lease_expires_at: string | null;
};

export type WelcomeEmailReservation =
  | { status: "acquired"; attemptToken: string }
  | { status: "pending" }
  | { status: "indeterminate" }
  | { status: "duplicate" };

function persistenceError(action: string, error: { message: string }): Error {
  return new Error(`Unable to ${action} welcome email delivery: ${error.message}`);
}

export function createWelcomeEmailDeliveryStore(supabase: SupabaseClient) {
  return {
    async reserve(
      clerkUserId: string,
      recipient: string,
    ): Promise<WelcomeEmailReservation> {
      const attemptToken = randomUUID();
      const leaseExpiresAt = new Date(
        Date.now() + RESERVATION_LEASE_MS,
      ).toISOString();
      const { error: insertError } = await supabase.from(TABLE_NAME).insert({
        clerk_user_id: clerkUserId,
        email_kind: WELCOME_EMAIL_KIND,
        recipient,
        status: "reserved",
        attempt_count: 1,
        reservation_token: attemptToken,
        lease_expires_at: leaseExpiresAt,
      });

      if (!insertError) {
        return { status: "acquired", attemptToken };
      }

      if (insertError.code !== UNIQUE_VIOLATION) {
        throw persistenceError("reserve", insertError);
      }

      const { data, error: readError } = await supabase
        .from(TABLE_NAME)
        .select("status, attempt_count, lease_expires_at")
        .eq("clerk_user_id", clerkUserId)
        .eq("email_kind", WELCOME_EMAIL_KIND)
        .maybeSingle<DeliveryRow>();

      if (readError) {
        throw persistenceError("read", readError);
      }

      if (!data) {
        return { status: "pending" };
      }

      if (data.status === "submitting") {
        return { status: "indeterminate" };
      }

      if (data.status !== "failed" && data.status !== "reserved") {
        return { status: "duplicate" };
      }

      const now = new Date();

      if (
        data.status === "reserved" &&
        data.lease_expires_at &&
        new Date(data.lease_expires_at).getTime() > now.getTime()
      ) {
        return { status: "pending" };
      }

      if (data.status === "reserved" && !data.lease_expires_at) {
        throw new Error("Reserved welcome email delivery has no lease");
      }

      let claim = supabase
        .from(TABLE_NAME)
        .update({
          recipient,
          status: "reserved",
          attempt_count: data.attempt_count + 1,
          reservation_token: attemptToken,
          last_error: null,
          submitted_at: null,
          lease_expires_at: new Date(
            now.getTime() + RESERVATION_LEASE_MS,
          ).toISOString(),
        })
        .eq("clerk_user_id", clerkUserId)
        .eq("email_kind", WELCOME_EMAIL_KIND);

      claim =
        data.status === "failed"
          ? claim.eq("status", "failed")
          : claim
              .eq("status", "reserved")
              .lte("lease_expires_at", now.toISOString());

      const { data: claimed, error: claimError } = await claim
        .select("clerk_user_id")
        .maybeSingle();

      if (claimError) {
        throw persistenceError("claim", claimError);
      }

      return claimed
        ? { status: "acquired", attemptToken }
        : { status: "pending" };
    },

    async markSubmitting(
      clerkUserId: string,
      attemptToken: string,
    ): Promise<void> {
      await updateOwnedDelivery(
        supabase,
        clerkUserId,
        attemptToken,
        ["reserved"],
        {
          status: "submitting",
          lease_expires_at: null,
        },
      );
    },

    async markSubmitted(
      clerkUserId: string,
      attemptToken: string,
    ): Promise<void> {
      await updateOwnedDelivery(
        supabase,
        clerkUserId,
        attemptToken,
        ["submitting"],
        {
          status: "submitted",
          submitted_at: new Date().toISOString(),
          last_error: null,
          lease_expires_at: null,
        },
      );
    },

    async markFailed(
      clerkUserId: string,
      attemptToken: string,
      message: string,
    ): Promise<void> {
      await updateOwnedDelivery(
        supabase,
        clerkUserId,
        attemptToken,
        ["reserved", "submitting"],
        {
          status: "failed",
          submitted_at: null,
          last_error: message.slice(0, MAX_ERROR_LENGTH),
          lease_expires_at: null,
        },
      );
    },

    async markUnknown(
      clerkUserId: string,
      attemptToken: string,
      message: string,
    ): Promise<void> {
      await updateOwnedDelivery(
        supabase,
        clerkUserId,
        attemptToken,
        ["submitting"],
        {
          status: "unknown",
          submitted_at: null,
          last_error: message.slice(0, MAX_ERROR_LENGTH),
          lease_expires_at: null,
        },
      );
    },
  };
}

async function updateOwnedDelivery(
  supabase: SupabaseClient,
  clerkUserId: string,
  attemptToken: string,
  expectedStatuses: Array<"reserved" | "submitting">,
  values: Record<string, unknown>,
): Promise<void> {
  let update = supabase
    .from(TABLE_NAME)
    .update(values)
    .eq("clerk_user_id", clerkUserId)
    .eq("email_kind", WELCOME_EMAIL_KIND)
    .eq("reservation_token", attemptToken);

  update =
    expectedStatuses.length === 1
      ? update.eq("status", expectedStatuses[0])
      : update.in("status", expectedStatuses);

  const { data, error } = await update
    .select("clerk_user_id")
    .maybeSingle();

  if (error) {
    throw persistenceError("update", error);
  }

  if (!data) {
    throw new Error("Welcome email attempt no longer owns the reservation");
  }
}
