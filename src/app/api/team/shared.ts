import { NextResponse } from "next/server";
import { RATE_LIMITS, getClientIp, hitRateLimit, rateLimitKey } from "@/lib/rateLimit";
import { TeamInviteError, acceptInvite, type AcceptInput } from "@/lib/teamInvites";
import { PRIVACY_NOTICE_REQUIRED, privacyNoticeAccepted } from "@/lib/privacyNotice";
import { WEAK_PASSWORD, isStrongPassword } from "@/lib/passwordPolicy";
import { isPhoneNumber } from "@/lib/uniquenessKeys";
import { PHONE_REQUIRED } from "@/lib/uniqueness";

// Shared by the public invite endpoints (/api/team/invites/[token] and /api/team/join). Not a route.

export const NO_STORE = { "Cache-Control": "no-store" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Per-IP cap on invite lookups and joins; null when the request may go on. */
export async function inviteRateLimited(req: Request) {
  const limit = await hitRateLimit(rateLimitKey("teaminvite", "ip", getClientIp(req.headers)), RATE_LIMITS.teamInviteIp);
  if (limit.allowed) return null;
  return NextResponse.json(
    { error: "Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.", code: "RATE_LIMITED" },
    { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfterSeconds) } }
  );
}

const bad = (error: string) => NextResponse.json({ error, code: "INVALID_REQUEST" }, { status: 400, headers: NO_STORE });

/** Validates the sign-up fields, then joins the team through the invite. Always answers with a response. */
export async function joinTeamResponse(tokenOrCode: string, body: Record<string, unknown>) {
  const input: AcceptInput = {
    name: typeof body.name === "string" ? body.name.trim() : "",
    email: typeof body.email === "string" ? body.email.trim().toLowerCase() : "",
    password: typeof body.password === "string" ? body.password : "",
    phone: typeof body.phone === "string" ? body.phone.trim() : "",
    specialty: typeof body.specialty === "string" ? body.specialty.trim() : "",
  };
  if (!input.name || input.name.length > 80) return bad("Ad soyad 1–80 karakter olmalıdır.");
  if (!EMAIL_RE.test(input.email) || input.email.length > 254) return bad("Geçerli bir e-posta adresi girin.");
  if (!isStrongPassword(input.password)) return bad(WEAK_PASSWORD);
  if ((input.phone ?? "").length > 30) return bad("Telefon numarası çok uzun.");
  if (!isPhoneNumber(input.phone)) return bad(PHONE_REQUIRED);
  if ((input.specialty ?? "").length > 80) return bad("Uzmanlık alanı çok uzun.");
  if (!privacyNoticeAccepted(body)) return bad(PRIVACY_NOTICE_REQUIRED);

  try {
    const result = await acceptInvite(tokenOrCode, input);
    return NextResponse.json({ success: true, businessName: result.businessName, email: result.user.email }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof TeamInviteError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status, headers: NO_STORE });
    }
    console.error("[team-invite] join failed", { name: (error as Error)?.name, code: (error as { code?: string })?.code });
    return NextResponse.json({ error: "Ekibe katılınamadı." }, { status: 500 });
  }
}
