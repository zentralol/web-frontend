import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MxrouteSubmissionError, submitMxrouteEmail } from "@/lib/email/mxroute";
import type { WelcomeEmailReservation } from "@/lib/email/welcomeDelivery";
import { handleClerkWebhook } from "./route";

const ORIGINAL_APP_BASE_URL = process.env.APP_BASE_URL;
const ATTEMPT_TOKEN = "11111111-1111-4111-8111-111111111111";

function userCreatedEvent(
  options: {
    verification?: "verified" | "unverified" | null;
    primaryEmail?: boolean;
  } = {},
): WebhookEvent {
  const { verification = "verified", primaryEmail = true } = options;

  return {
    type: "user.created",
    data: {
      id: "user_123",
      first_name: "Kai",
      primary_email_address_id: primaryEmail ? "email_123" : null,
      email_addresses: [
        {
          id: "email_123",
          email_address: "kai@example.com",
          verification:
            verification === null ? null : { status: verification },
        },
      ],
    },
  } as unknown as WebhookEvent;
}

function createHarness(event: WebhookEvent = userCreatedEvent()) {
  const store = {
    reserve: vi.fn(
      async (): Promise<WelcomeEmailReservation> => ({
        status: "acquired",
        attemptToken: ATTEMPT_TOKEN,
      }),
    ),
    markSubmitting: vi.fn(async () => undefined),
    markSubmitted: vi.fn(async () => undefined),
    markFailed: vi.fn(async () => undefined),
    markUnknown: vi.fn(async () => undefined),
  };
  const submitEmail = vi.fn<typeof submitMxrouteEmail>(async () => undefined);
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const dependencies = {
    verify: vi.fn(async () => event),
    createDeliveryStore: vi.fn(() => store),
    validateEmailConfiguration: vi.fn(),
    submitEmail,
    logger,
  };

  return { store, submitEmail, logger, dependencies };
}

async function responseBody(response: Response) {
  return response.json() as Promise<{ status: string }>;
}

describe("Clerk welcome email webhook", () => {
  beforeEach(() => {
    process.env.APP_BASE_URL = "https://zentra.example";
  });

  afterEach(() => {
    if (ORIGINAL_APP_BASE_URL === undefined) {
      delete process.env.APP_BASE_URL;
    } else {
      process.env.APP_BASE_URL = ORIGINAL_APP_BASE_URL;
    }
    vi.restoreAllMocks();
  });

  it("rejects requests that fail Clerk signature verification", async () => {
    const harness = createHarness();
    harness.dependencies.verify.mockRejectedValue(new Error("bad signature"));

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk", {
        method: "POST",
      }),
      harness.dependencies,
    );

    expect(response.status).toBe(400);
    await expect(responseBody(response)).resolves.toEqual({
      status: "invalid_signature",
    });
    expect(harness.dependencies.createDeliveryStore).not.toHaveBeenCalled();
  });

  it("ignores webhook events other than user.created", async () => {
    const harness = createHarness({
      type: "session.created",
      data: { id: "session_123" },
    } as unknown as WebhookEvent);

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    await expect(responseBody(response)).resolves.toEqual({ status: "ignored" });
    expect(harness.dependencies.createDeliveryStore).not.toHaveBeenCalled();
  });

  it("does not send when the primary email is missing", async () => {
    const harness = createHarness(userCreatedEvent({ primaryEmail: false }));
    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    await expect(responseBody(response)).resolves.toEqual({
      status: "skipped_no_primary_email",
    });
    expect(harness.submitEmail).not.toHaveBeenCalled();
    expect(harness.logger.info).toHaveBeenCalledWith(
      "welcome_email_skipped_no_primary_email",
      {
        clerkUserId: "user_123",
        emailAddressCount: 1,
        primaryEmailAddressIdPresent: false,
      },
    );
  });

  it("sends to the primary email without requiring Clerk verification", async () => {
    for (const verification of ["unverified", null] as const) {
      const harness = createHarness(userCreatedEvent({ verification }));
      const response = await handleClerkWebhook(
        new Request("https://zentra.example/api/webhooks/clerk"),
        harness.dependencies,
      );

      await expect(responseBody(response)).resolves.toEqual({
        status: "submitted",
      });
      expect(harness.store.reserve).toHaveBeenCalledWith(
        "user_123",
        "kai@example.com",
      );
      expect(harness.submitEmail).toHaveBeenCalledOnce();
    }
  });

  it("submits one welcome email and records the accepted state", async () => {
    const harness = createHarness();

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    expect(response.status).toBe(200);
    await expect(responseBody(response)).resolves.toEqual({ status: "submitted" });
    expect(harness.store.reserve).toHaveBeenCalledWith(
      "user_123",
      "kai@example.com",
    );
    expect(harness.dependencies.validateEmailConfiguration).toHaveBeenCalledOnce();
    expect(harness.submitEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "kai@example.com",
        subject: "Welcome to Zentra",
        html: expect.stringContaining("https://zentra.example/onboarding"),
      }),
    );
    expect(harness.store.markSubmitting).toHaveBeenCalledWith(
      "user_123",
      ATTEMPT_TOKEN,
    );
    expect(harness.store.markSubmitted).toHaveBeenCalledWith(
      "user_123",
      ATTEMPT_TOKEN,
    );
  });

  it("asks Clerk to retry after an application configuration failure", async () => {
    const harness = createHarness();
    harness.dependencies.validateEmailConfiguration.mockImplementation(() => {
      throw new Error("Missing MXROUTE_PASSWORD");
    });

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    expect(response.status).toBe(503);
    await expect(responseBody(response)).resolves.toEqual({
      status: "configuration_failed",
    });
    expect(harness.store.markFailed).toHaveBeenCalledOnce();
    expect(harness.store.markSubmitting).not.toHaveBeenCalled();
    expect(harness.submitEmail).not.toHaveBeenCalled();
  });

  it("does not submit again when the delivery already exists", async () => {
    const harness = createHarness();
    harness.store.reserve.mockResolvedValue({ status: "duplicate" });

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    await expect(responseBody(response)).resolves.toEqual({ status: "duplicate" });
    expect(harness.submitEmail).not.toHaveBeenCalled();
  });

  it("keeps Clerk retries active while another reservation owns the lease", async () => {
    const harness = createHarness();
    harness.store.reserve.mockResolvedValue({ status: "pending" });

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    expect(response.status).toBe(503);
    await expect(responseBody(response)).resolves.toEqual({
      status: "reservation_pending",
    });
    expect(harness.submitEmail).not.toHaveBeenCalled();
  });

  it("keeps an interrupted submission open for reconciliation", async () => {
    const harness = createHarness();
    harness.store.reserve.mockResolvedValue({ status: "indeterminate" });

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    expect(response.status).toBe(503);
    await expect(responseBody(response)).resolves.toEqual({
      status: "submission_indeterminate",
    });
    expect(harness.submitEmail).not.toHaveBeenCalled();
  });

  it("does not send when it loses ownership before external I/O", async () => {
    const harness = createHarness();
    harness.store.markSubmitting.mockRejectedValue(
      new Error("reservation reclaimed"),
    );

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    expect(response.status).toBe(503);
    await expect(responseBody(response)).resolves.toEqual({
      status: "submission_state_failed",
    });
    expect(harness.submitEmail).not.toHaveBeenCalled();
  });

  it("returns 503 only for explicit retryable MXroute rejections", async () => {
    const harness = createHarness();
    harness.submitEmail.mockRejectedValue(
      new MxrouteSubmissionError("Rate limit exceeded", "rejected", true),
    );

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    expect(response.status).toBe(503);
    await expect(responseBody(response)).resolves.toEqual({
      status: "submission_retryable",
    });
    expect(harness.store.markFailed).toHaveBeenCalledWith(
      "user_123",
      ATTEMPT_TOKEN,
      "Rate limit exceeded",
    );
  });

  it("reports a retryable rejection whose failed state could not be recorded", async () => {
    const harness = createHarness();
    harness.submitEmail.mockRejectedValue(
      new MxrouteSubmissionError("Rate limit exceeded", "rejected", true),
    );
    harness.store.markFailed.mockRejectedValue(
      new Error("database unavailable"),
    );

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    expect(response.status).toBe(503);
    await expect(responseBody(response)).resolves.toEqual({
      status: "submission_retry_state_pending",
    });
    expect(harness.logger.error).toHaveBeenCalledWith(
      "welcome_email_failure_status_update_failed",
      expect.objectContaining({ clerkUserId: "user_123" }),
    );
  });

  it("records ambiguous failures without asking Clerk to resend", async () => {
    const harness = createHarness();
    harness.submitEmail.mockRejectedValue(
      new MxrouteSubmissionError("Outcome unknown", "unknown", false),
    );

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    expect(response.status).toBe(200);
    await expect(responseBody(response)).resolves.toEqual({
      status: "submission_unknown",
    });
    expect(harness.store.markUnknown).toHaveBeenCalledWith(
      "user_123",
      ATTEMPT_TOKEN,
      "Outcome unknown",
    );
    expect(harness.store.markFailed).not.toHaveBeenCalled();
  });

  it("asks Clerk to retry when the delivery reservation is unavailable", async () => {
    const harness = createHarness();
    harness.store.reserve.mockRejectedValue(new Error("database unavailable"));

    const response = await handleClerkWebhook(
      new Request("https://zentra.example/api/webhooks/clerk"),
      harness.dependencies,
    );

    expect(response.status).toBe(503);
    await expect(responseBody(response)).resolves.toEqual({
      status: "reservation_failed",
    });
    expect(harness.submitEmail).not.toHaveBeenCalled();
  });
});
