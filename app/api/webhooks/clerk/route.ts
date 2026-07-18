import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import {
  MxrouteSubmissionError,
  submitMxrouteEmail,
  validateMxrouteConfiguration,
} from "@/lib/email/mxroute";
import {
  buildOnboardingUrl,
  renderWelcomeEmail,
} from "@/lib/email/welcomeEmail";
import { createWelcomeEmailDeliveryStore } from "@/lib/email/welcomeDelivery";

export const runtime = "nodejs";

type DeliveryStore = ReturnType<typeof createWelcomeEmailDeliveryStore>;

type ClerkWebhookDependencies = {
  verify: (request: Request) => Promise<WebhookEvent>;
  createDeliveryStore: () => DeliveryStore;
  validateEmailConfiguration: () => void;
  submitEmail: typeof submitMxrouteEmail;
  logger: Pick<Console, "info" | "warn" | "error">;
};

const defaultDependencies: ClerkWebhookDependencies = {
  verify: (request) =>
    verifyWebhook(
      request as unknown as Parameters<typeof verifyWebhook>[0],
    ),
  createDeliveryStore: () =>
    createWelcomeEmailDeliveryStore(createServiceRoleSupabaseClient()),
  validateEmailConfiguration: validateMxrouteConfiguration,
  submitEmail: submitMxrouteEmail,
  logger: console,
};

function jsonResponse(status: string, httpStatus = 200): Response {
  return Response.json({ status }, { status: httpStatus });
}

export async function handleClerkWebhook(
  request: Request,
  dependencies: ClerkWebhookDependencies = defaultDependencies,
): Promise<Response> {
  let event: WebhookEvent;

  try {
    event = await dependencies.verify(request);
  } catch {
    dependencies.logger.warn("clerk_webhook_verification_failed");
    return jsonResponse("invalid_signature", 400);
  }

  if (event.type !== "user.created") {
    return jsonResponse("ignored");
  }

  const primaryEmail = event.data.email_addresses.find(
    (email) => email.id === event.data.primary_email_address_id,
  );

  if (!primaryEmail || primaryEmail.verification?.status !== "verified") {
    dependencies.logger.info("welcome_email_skipped_no_verified_email", {
      clerkUserId: event.data.id,
    });
    return jsonResponse("skipped_no_verified_email");
  }

  let store: DeliveryStore;
  let reservation: Awaited<ReturnType<DeliveryStore["reserve"]>>;

  try {
    store = dependencies.createDeliveryStore();
    reservation = await store.reserve(
      event.data.id,
      primaryEmail.email_address,
    );
  } catch (error) {
    dependencies.logger.error("welcome_email_reservation_failed", {
      clerkUserId: event.data.id,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return jsonResponse("reservation_failed", 503);
  }

  if (reservation.status === "duplicate") {
    return jsonResponse("duplicate");
  }

  if (reservation.status === "pending") {
    return jsonResponse("reservation_pending", 503);
  }

  if (reservation.status === "indeterminate") {
    return jsonResponse("submission_indeterminate", 503);
  }

  const { attemptToken } = reservation;

  let email: ReturnType<typeof renderWelcomeEmail>;

  try {
    const onboardingUrl = buildOnboardingUrl(
      process.env.APP_BASE_URL ?? "",
    );
    email = renderWelcomeEmail({
      firstName: event.data.first_name,
      onboardingUrl,
    });
    dependencies.validateEmailConfiguration();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "invalid_email_config";
    await markFailureSafely(
      store,
      event.data.id,
      attemptToken,
      message,
      dependencies.logger,
    );
    dependencies.logger.error("welcome_email_configuration_failed", {
      clerkUserId: event.data.id,
      error: message,
    });
    return jsonResponse("configuration_failed", 503);
  }

  try {
    await store.markSubmitting(event.data.id, attemptToken);
  } catch (error) {
    dependencies.logger.error("welcome_email_submission_state_failed", {
      clerkUserId: event.data.id,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return jsonResponse("submission_state_failed", 503);
  }

  try {
    await dependencies.submitEmail({
      to: primaryEmail.email_address,
      subject: email.subject,
      html: email.html,
    });
  } catch (error) {
    const submissionError =
      error instanceof MxrouteSubmissionError
        ? error
        : new MxrouteSubmissionError(
            "MXroute submission outcome is unknown",
            "unknown",
            false,
          );

    if (submissionError.outcome === "unknown") {
      await markUnknownSafely(
        store,
        event.data.id,
        attemptToken,
        submissionError.message,
        dependencies.logger,
      );
      dependencies.logger.error("welcome_email_submission_unknown", {
        clerkUserId: event.data.id,
      });
      return jsonResponse("submission_unknown");
    }

    const failureRecorded = await markFailureSafely(
      store,
      event.data.id,
      attemptToken,
      submissionError.message,
      dependencies.logger,
    );
    dependencies.logger.error("welcome_email_submission_rejected", {
      clerkUserId: event.data.id,
      retryable: submissionError.retryable,
    });

    if (!failureRecorded) {
      return jsonResponse("submission_retry_state_pending", 503);
    }

    return submissionError.retryable
      ? jsonResponse("submission_retryable", 503)
      : jsonResponse("submission_rejected");
  }

  try {
    await store.markSubmitted(event.data.id, attemptToken);
  } catch (error) {
    dependencies.logger.error("welcome_email_status_update_failed", {
      clerkUserId: event.data.id,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return jsonResponse("submitted_status_unknown");
  }

  dependencies.logger.info("welcome_email_submitted", {
    clerkUserId: event.data.id,
  });
  return jsonResponse("submitted");
}

async function markFailureSafely(
  store: DeliveryStore,
  clerkUserId: string,
  attemptToken: string,
  message: string,
  logger: ClerkWebhookDependencies["logger"],
): Promise<boolean> {
  try {
    await store.markFailed(clerkUserId, attemptToken, message);
    return true;
  } catch (error) {
    logger.error("welcome_email_failure_status_update_failed", {
      clerkUserId,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return false;
  }
}

async function markUnknownSafely(
  store: DeliveryStore,
  clerkUserId: string,
  attemptToken: string,
  message: string,
  logger: ClerkWebhookDependencies["logger"],
): Promise<void> {
  try {
    await store.markUnknown(clerkUserId, attemptToken, message);
  } catch (error) {
    logger.error("welcome_email_unknown_status_update_failed", {
      clerkUserId,
      error: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

export async function POST(request: Request): Promise<Response> {
  return handleClerkWebhook(request);
}
