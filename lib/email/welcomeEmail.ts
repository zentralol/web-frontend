export const WELCOME_EMAIL_KIND = "welcome";

type WelcomeEmailInput = {
  firstName: string | null;
  onboardingUrl: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return entities[character];
  });
}

function normalizeFirstName(firstName: string | null): string {
  const normalized = firstName?.trim().slice(0, 80);
  return normalized ? escapeHtml(normalized) : "there";
}

export function buildOnboardingUrl(appBaseUrl: string): string {
  let baseUrl: URL;

  try {
    baseUrl = new URL(appBaseUrl);
  } catch {
    throw new Error("APP_BASE_URL must be a valid absolute URL");
  }

  if (baseUrl.protocol !== "https:" && baseUrl.protocol !== "http:") {
    throw new Error("APP_BASE_URL must use http or https");
  }

  return new URL("/onboarding", baseUrl).toString();
}

export function renderWelcomeEmail({
  firstName,
  onboardingUrl,
}: WelcomeEmailInput): { subject: string; html: string } {
  const safeFirstName = normalizeFirstName(firstName);
  const safeOnboardingUrl = escapeHtml(onboardingUrl);

  return {
    subject: "Welcome to Zentra",
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Welcome to Zentra</title>
  </head>
  <body style="margin:0;background:#0b0f14;color:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Zentra account is ready.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0f14;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#121821;border:1px solid #263140;border-radius:20px;padding:40px;">
            <tr>
              <td>
                <p style="margin:0 0 24px;color:#58d6c7;font-size:14px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Zentra</p>
                <h1 style="margin:0 0 16px;font-size:32px;line-height:1.2;">Welcome, ${safeFirstName}.</h1>
                <p style="margin:0 0 16px;color:#c7d0dc;font-size:16px;line-height:1.65;">Your account is ready. Tell us how you like to explore so Zentra can personalize Manhattan recommendations, routes, and crowd-aware plans for you.</p>
                <p style="margin:0 0 32px;color:#c7d0dc;font-size:16px;line-height:1.65;">It only takes a couple of minutes, and you can change your preferences at any time.</p>
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="border-radius:999px;background:#58d6c7;">
                      <a href="${safeOnboardingUrl}" style="display:inline-block;padding:14px 24px;color:#07110f;font-size:16px;font-weight:700;text-decoration:none;">Set up your preferences</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:32px 0 0;color:#7f8b99;font-size:13px;line-height:1.6;">If the button does not work, open:<br /><a href="${safeOnboardingUrl}" style="color:#91e5dc;word-break:break-all;">${safeOnboardingUrl}</a></p>
                <p style="margin:32px 0 0;border-top:1px solid #263140;padding-top:24px;color:#7f8b99;font-size:12px;line-height:1.6;">You received this service email because a Zentra account was created with this address.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}
