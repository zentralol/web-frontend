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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Zentra</title>
</head>

<body style="margin:0; padding:0; background-color:#f1efe9; font-family:Arial, Helvetica, sans-serif;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; font-size:1px; line-height:1px; width:0; height:0; visibility:hidden; mso-hide:all;">
    Your Zentra account is ready. Set up your preferences to get started.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background-color:#f1efe9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px; background-color:#121314; border-radius:18px; overflow:hidden; box-shadow:0 16px 40px rgba(18,19,20,0.16);">
          <tr>
            <td style="height:4px; background-color:#ffdca1; font-size:0; line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:30px 38px 24px; border-bottom:1px solid #2b2c2e;">
              <a href="https://zentra.lol" style="text-decoration:none;"><span style="color:#ffdca1; font-size:24px; font-weight:400; letter-spacing:5px; line-height:1;">zentra</span></a>
            </td>
          </tr>
          <tr>
            <td style="padding:38px;">
              <div style="display:inline-block; padding:7px 11px; border:1px solid rgba(255,220,161,0.35); border-radius:999px; color:#ffdca1; font-size:11px; font-weight:700; letter-spacing:1.5px;">&#10003; ACCOUNT READY</div>
              <h1 style="margin:24px 0 14px; color:#ffffff; font-size:30px; font-weight:500; line-height:1.25; letter-spacing:-0.5px;">Welcome, ${safeFirstName}.</h1>
              <p style="margin:0; color:#b8b8b8; font-size:16px; line-height:1.7;">Your Zentra account is ready. Tell us how you like to explore so we can personalize Manhattan recommendations, routes, and crowd-aware plans for you.</p>
              <p style="margin:16px 0 0; color:#b8b8b8; font-size:16px; line-height:1.7;">It only takes a couple of minutes, and you can update your preferences at any time.</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
                <tr>
                  <td height="28" style="height:28px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td bgcolor="#ffdca1" style="border-radius:999px;">
                          <a href="${safeOnboardingUrl}" style="display:inline-block; padding:14px 24px; color:#121314; font-size:15px; font-weight:700; line-height:1.2; text-decoration:none;">Set up your preferences</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0; color:#929292; font-size:12px; line-height:1.6;">If the button does not work, open:<br><a href="${safeOnboardingUrl}" style="color:#ffdca1; text-decoration:none; word-break:break-all;">${safeOnboardingUrl}</a></p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
                <tr>
                  <td height="28" style="height:28px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:18px 20px; background-color:#1c1d1f; border:1px solid #303134; border-radius:12px;">
                    <p style="margin:0 0 5px; color:#ffffff; font-size:14px; font-weight:600;">Make Zentra yours</p>
                    <p style="margin:0; color:#929292; font-size:14px; line-height:1.6;">Choose your pace, interests, budget, mobility, and dietary preferences so every recommendation feels more personal.</p>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0; color:#ffffff; font-size:15px; line-height:1.6;">We&rsquo;re glad you&rsquo;re here.</p>
              <p style="margin:8px 0 0; color:#ffdca1; font-size:15px; line-height:1.6;">&mdash; The Zentra team</p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 38px; background-color:#0d0e0f; border-top:1px solid #242527;">
              <p style="margin:0 0 6px; color:#929292; font-size:12px; line-height:1.6;">
                <a href="https://zentra.lol" style="color:#ffdca1; text-decoration:none;">zentra.lol</a>
              </p>
              <p style="margin:0; color:#929292; font-size:12px; line-height:1.6;">This is an automatic account email from Zentra.</p>
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
