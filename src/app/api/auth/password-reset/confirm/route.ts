import { NextResponse } from "next/server";
import { RATE_LIMITS, getClientIp, hitRateLimit, rateLimitKey } from "@/lib/rateLimit";
import { MIN_PASSWORD_LENGTH, resetPassword } from "@/lib/passwordReset";

// Public: POST { token, newPassword } from the link in the reset e-mail.

export async function POST(req: Request) {
  const limit = await hitRateLimit(rateLimitKey("password-reset-confirm", "ip", getClientIp(req.headers)), RATE_LIMITS.passwordResetIp);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > 200) {
    return NextResponse.json({ error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`, code: "WEAK_PASSWORD" }, { status: 400 });
  }

  try {
    if (!token || !(await resetPassword(token, newPassword))) {
      return NextResponse.json(
        { error: "Bu bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir sıfırlama bağlantısı isteyin.", code: "RESET_INVALID" },
        { status: 410 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[password-reset] confirm failed", { name: (error as Error)?.name });
    return NextResponse.json({ error: "Şifre değiştirilirken bir hata oluştu." }, { status: 500 });
  }
}
