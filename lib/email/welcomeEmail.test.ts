import { describe, expect, it } from "vitest";
import { buildOnboardingUrl, renderWelcomeEmail } from "./welcomeEmail";

describe("buildOnboardingUrl", () => {
  it("builds an absolute onboarding URL from the application origin", () => {
    expect(buildOnboardingUrl("https://zentra.example")).toBe(
      "https://zentra.example/onboarding",
    );
  });

  it("rejects invalid and non-http application URLs", () => {
    expect(() => buildOnboardingUrl("not-a-url")).toThrow(
      "APP_BASE_URL must be a valid absolute URL",
    );
    expect(() => buildOnboardingUrl("javascript:alert(1)")).toThrow(
      "APP_BASE_URL must use http or https",
    );
  });
});

describe("renderWelcomeEmail", () => {
  it("escapes user-controlled names and links", () => {
    const email = renderWelcomeEmail({
      firstName: '<img src=x onerror="alert(1)">',
      onboardingUrl: "https://zentra.example/onboarding?a=1&b=2",
    });

    expect(email.subject).toBe("Welcome to Zentra");
    expect(email.html).not.toContain('<img src=x onerror="alert(1)">');
    expect(email.html).toContain(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
    expect(email.html).toContain(
      "https://zentra.example/onboarding?a=1&amp;b=2",
    );
  });

  it("uses a neutral greeting when Clerk has no first name", () => {
    const email = renderWelcomeEmail({
      firstName: null,
      onboardingUrl: "https://zentra.example/onboarding",
    });

    expect(email.html).toContain("Welcome, there.");
  });
});
