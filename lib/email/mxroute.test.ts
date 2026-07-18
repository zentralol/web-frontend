import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MxrouteSubmissionError,
  submitMxrouteEmail,
  type FetchLike,
} from "./mxroute";

const ORIGINAL_ENV = { ...process.env };

function setValidEnvironment() {
  process.env.MXROUTE_SERVER = "mail.example.mxrouting.net";
  process.env.MXROUTE_USERNAME = "welcome@example.com";
  process.env.MXROUTE_PASSWORD = "super-secret-password";
  process.env.MXROUTE_FROM = "welcome@example.com";
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("submitMxrouteEmail", () => {
  beforeEach(() => {
    setValidEnvironment();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("submits the documented MXroute SMTP API payload", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () =>
      jsonResponse({ success: true, message: "Email sent successfully." }),
    );

    await submitMxrouteEmail(
      {
        to: "new-user@example.net",
        subject: "Welcome to Zentra",
        html: "<p>Welcome</p>",
      },
      { fetchImpl },
    );

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://smtpapi.mxroute.com/");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      server: "mail.example.mxrouting.net",
      username: "welcome@example.com",
      password: "super-secret-password",
      from: "welcome@example.com",
      to: "new-user@example.net",
      subject: "Welcome to Zentra",
      body: "<p>Welcome</p>",
    });
  });

  it("fails before making a request when configuration is missing", async () => {
    delete process.env.MXROUTE_PASSWORD;
    const fetchImpl = vi.fn<FetchLike>();

    await expect(
      submitMxrouteEmail(
        {
          to: "new-user@example.net",
          subject: "Welcome",
          html: "<p>Welcome</p>",
        },
        { fetchImpl },
      ),
    ).rejects.toMatchObject({
      outcome: "rejected",
      retryable: true,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requires the authenticated mailbox to match the From address", async () => {
    process.env.MXROUTE_FROM = "alias@example.com";

    await expect(
      submitMxrouteEmail({
        to: "new-user@example.net",
        subject: "Welcome",
        html: "<p>Welcome</p>",
      }),
    ).rejects.toThrow("MXROUTE_FROM must match MXROUTE_USERNAME");
  });

  it("classifies an explicit rate-limit rejection as safely retryable", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () =>
      jsonResponse({ success: false, message: "Rate limit exceeded" }),
    );

    const submission = submitMxrouteEmail(
      {
        to: "new-user@example.net",
        subject: "Welcome",
        html: "<p>Welcome</p>",
      },
      { fetchImpl },
    );

    await expect(submission).rejects.toMatchObject({
      outcome: "rejected",
      retryable: true,
    });

    const nonJsonRateLimit = vi.fn<FetchLike>(async () =>
      new Response("Too many requests", { status: 429 }),
    );

    await expect(
      submitMxrouteEmail(
        {
          to: "new-user@example.net",
          subject: "Welcome",
          html: "<p>Welcome</p>",
        },
        { fetchImpl: nonJsonRateLimit },
      ),
    ).rejects.toMatchObject({ outcome: "rejected", retryable: true });
  });

  it("marks server and network failures as having an unknown outcome", async () => {
    const serverFailure = vi.fn<FetchLike>(async () =>
      jsonResponse({ success: false, message: "Unavailable" }, 503),
    );

    await expect(
      submitMxrouteEmail(
        {
          to: "new-user@example.net",
          subject: "Welcome",
          html: "<p>Welcome</p>",
        },
        { fetchImpl: serverFailure },
      ),
    ).rejects.toMatchObject({ outcome: "unknown", retryable: false });

    const networkFailure = vi.fn<FetchLike>(async () => {
      throw new TypeError("connection reset with super-secret-password");
    });

    let error: unknown;
    try {
      await submitMxrouteEmail(
        {
          to: "new-user@example.net",
          subject: "Welcome",
          html: "<p>Welcome</p>",
        },
        { fetchImpl: networkFailure },
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(MxrouteSubmissionError);
    expect((error as Error).message).not.toContain("super-secret-password");
    expect(error).toMatchObject({ outcome: "unknown", retryable: false });
  });
});
