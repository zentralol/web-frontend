import { describe, expect, it } from "vitest";
import { renderWelcomeEmail } from "./welcomeEmail";

describe("renderWelcomeEmail", () => {
  it("escapes user-controlled names", () => {
    const email = renderWelcomeEmail({
      firstName: '<img src=x onerror="alert(1)">',
    });

    expect(email.subject).toBe("Welcome to Zentra");
    expect(email.html).not.toContain('<img src=x onerror="alert(1)">');
    expect(email.html).toContain(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });

  it("uses a neutral greeting when Clerk has no first name", () => {
    const email = renderWelcomeEmail({
      firstName: null,
    });

    expect(email.html).toContain("Welcome, there.");
  });

  it("keeps the welcome copy focused on the support contact", () => {
    const email = renderWelcomeEmail({
      firstName: "Kai",
    });

    expect(email.html).toContain('href="mailto:hi@zentra.lol"');
    expect(email.html).toContain("hi@zentra.lol");
    expect(email.html.toLowerCase()).not.toContain("preference");
    expect(email.html).not.toContain("/onboarding");
  });

  it("uses the branded email-safe card layout", () => {
    const email = renderWelcomeEmail({
      firstName: "Kai",
    });

    expect(email.html).toContain("background-color:#f1efe9");
    expect(email.html).toContain("max-width:600px");
    expect(email.html).toContain("background-color:#ffdca1");
    expect(email.html).toContain("&#10003; ACCOUNT READY");
    expect(email.html).toContain("Questions or need help?");
    expect(email.html).toContain("background-color:#0d0e0f");
    expect(email.html).toContain('role="presentation" width="600"');
    expect(email.html).toContain('href="mailto:hi@zentra.lol"');
    expect(email.html).toContain("mso-hide:all");
  });
});
