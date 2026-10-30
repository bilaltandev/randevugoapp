import { NextResponse, after } from "next/server";
import { RATE_LIMITS, getClientIp, hitRateLimit, rateLimitKey } from "@/lib/rateLimit";
import { MailNotConfiguredError } from "@/lib/mailer";
import { sendPasswordReset, siteOrigin } from "@/lib/passwordReset";

// Public: POST { email }. Answers the same whether or not the account exists, and does the lookup and the
// sending after the response, so neither the answer nor its timing reveals who has an account.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OK = { success: true };

export async function POST(req: Request) {
  const ipLimit = await hitRateLimit(rateLimitKey("password-reset", "ip", getClientIp(req.headers)), RATE_LIMITS.passwordResetIp);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin.", code: "INVALID_EMAIL" }, { status: 400 });
  }

  const emailLimit = await hitRateLimit(rateLimitKey("password-reset", "email", email), RATE_LIMITS.passwordResetEmail);
  if (emailLimit.allowed) {
    const origin = siteOrigin(req);
    after(() =>
      sendPasswordReset(email, origin)
        .then((sent) => console.info("[password-reset] finished", { sent }))
        .catch((error) => {
          const { code, responseCode } = error as { code?: string; responseCode?: number };
          console.error("[password-reset] send failed", { mailConfigured: !(error instanceof MailNotConfiguredError), code, responseCode });
        })
    );
  }
  return NextResponse.json(OK);
}
