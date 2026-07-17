const MXROUTE_SMTP_API_URL = "https://smtpapi.mxroute.com/";
const DEFAULT_TIMEOUT_MS = 10_000;

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

type MxrouteEmail = {
  to: string;
  subject: string;
  html: string;
};

type MxrouteApiResponse = {
  success: boolean;
  message: string;
};

export class MxrouteSubmissionError extends Error {
  constructor(
    message: string,
    readonly outcome: "rejected" | "unknown",
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "MxrouteSubmissionError";
  }
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new MxrouteSubmissionError(
      `Missing required email configuration: ${name}`,
      "rejected",
      true,
    );
  }

  return value;
}

function getMxrouteConfiguration() {
  const username = requiredEnvironmentVariable("MXROUTE_USERNAME");
  const from = requiredEnvironmentVariable("MXROUTE_FROM");

  if (username.toLowerCase() !== from.toLowerCase()) {
    throw new MxrouteSubmissionError(
      "MXROUTE_FROM must match MXROUTE_USERNAME",
      "rejected",
      true,
    );
  }

  return {
    server: requiredEnvironmentVariable("MXROUTE_SERVER"),
    username,
    password: requiredEnvironmentVariable("MXROUTE_PASSWORD"),
    from,
  };
}

export function validateMxrouteConfiguration(): void {
  getMxrouteConfiguration();
}

function isMxrouteApiResponse(value: unknown): value is MxrouteApiResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.success === "boolean" &&
    typeof candidate.message === "string"
  );
}

function isExplicitlyRetryable(message: string): boolean {
  return /rate.?limit|temporar|try again|busy|unavailable/i.test(message);
}

function safeProviderMessage(message: string): string {
  return message.replace(/[\r\n]+/g, " ").slice(0, 500);
}

export async function submitMxrouteEmail(
  email: MxrouteEmail,
  options: {
    fetchImpl?: FetchLike;
    timeoutMs?: number;
  } = {},
): Promise<void> {
  const configuration = getMxrouteConfiguration();
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetchImpl(MXROUTE_SMTP_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...configuration,
        to: email.to,
        subject: email.subject,
        body: email.html,
      }),
      signal: controller.signal,
    });

    let result: unknown;
    try {
      result = await response.json();
    } catch {
      if (!response.ok) {
        throw new MxrouteSubmissionError(
          `MXroute returned HTTP ${response.status}`,
          response.status >= 500 ? "unknown" : "rejected",
          response.status === 429,
        );
      }

      throw new MxrouteSubmissionError(
        "MXroute returned an unreadable response",
        "unknown",
        false,
      );
    }

    if (!response.ok) {
      const providerMessage = isMxrouteApiResponse(result)
        ? safeProviderMessage(result.message)
        : `HTTP ${response.status}`;

      if (response.status === 429) {
        throw new MxrouteSubmissionError(
          providerMessage,
          "rejected",
          true,
        );
      }

      throw new MxrouteSubmissionError(
        providerMessage,
        response.status >= 500 ? "unknown" : "rejected",
        false,
      );
    }

    if (!isMxrouteApiResponse(result)) {
      throw new MxrouteSubmissionError(
        "MXroute returned an unexpected response",
        "unknown",
        false,
      );
    }

    if (!result.success) {
      const providerMessage = safeProviderMessage(result.message);
      throw new MxrouteSubmissionError(
        providerMessage,
        "rejected",
        isExplicitlyRetryable(providerMessage),
      );
    }
  } catch (error) {
    if (error instanceof MxrouteSubmissionError) {
      throw error;
    }

    throw new MxrouteSubmissionError(
      "MXroute submission outcome is unknown",
      "unknown",
      false,
    );
  } finally {
    clearTimeout(timeout);
  }
}
