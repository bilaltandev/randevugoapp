import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { subscriptionLock } from "@/lib/subscriptionAccess";
import { TeamInviteError, createInviteCode, invitePath } from "@/lib/teamInvites";
import { MailNotConfiguredError, escapeHtml, sendMail } from "@/lib/mailer";
import { RATE_LIMITS, hitRateLimit, rateLimitKey } from "@/lib/rateLimit";

// Business owner, TEAM plan: POST { email } → e-mails a single-use invite (code + link to the sign-up page).
// Whoever signs up through it joins the team; their staff record is created on joining.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(email) || email.length > 200) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin.", code: "INVALID_EMAIL" }, { status: 400 });
    }

    const limit = await hitRateLimit(rateLimitKey("team-invite-email", "business", user.business.id), RATE_LIMITS.teamInviteEmail);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Çok fazla davet gönderdiniz. Lütfen biraz sonra tekrar deneyin.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const { code, expiresAt } = await createInviteCode(user.business.id);
    const origin = process.env.APP_URL?.trim().replace(/\/$/, "") || new URL(req.url).origin;
    const link = `${origin}${invitePath(code)}`;
    const businessName = user.business.name;
    const days = Math.round((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

    await sendMail({
      to: email,
      subject: `${businessName} sizi CalendlyGo ekibine davet etti`,
      text:
        `${user.name}, sizi ${businessName} ekibine davet etti.\n\n` +
        `Katılmak için bu bağlantıdan hesabınızı oluşturun: ${link}\n` +
        `Ya da CalendlyGo uygulamasında kayıt olurken "Hazır ekibe katıl" seçeneğine bu kodu yazın: ${code}\n\n` +
        `Davet ${days} gün geçerlidir ve tek kullanımlıktır.`,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;color:#0D1117">
  <h2 style="margin:0 0 12px">${escapeHtml(businessName)} ekibine davetlisiniz</h2>
  <p style="margin:0 0 16px;color:#454E5C">${escapeHtml(user.name)}, sizi CalendlyGo'da ekibine ekledi. Size alınan randevular kendi hesabınıza düşecek.</p>
  <p style="margin:0 0 20px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#0A7B5C;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Ekibe katıl</a></p>
  <p style="margin:0 0 6px;color:#454E5C">Ya da uygulamada kayıt olurken <b>Hazır ekibe katıl</b> seçeneğine bu kodu yazın:</p>
  <p style="margin:0 0 20px;font-size:20px;font-weight:700;letter-spacing:2px">${escapeHtml(code)}</p>
  <p style="margin:0;font-size:12px;color:#687180">Davet ${days} gün geçerlidir ve tek kullanımlıktır. Bu daveti beklemiyorsanız e-postayı yok sayabilirsiniz.</p>
</div>`,
    });

    return NextResponse.json({ success: true, expiresAt });
  } catch (error) {
    if (error instanceof TeamInviteError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (error instanceof MailNotConfiguredError) {
      return NextResponse.json(
        { error: "E-posta gönderimi henüz ayarlanmadı. Şimdilik davet kodu veya bağlantı paylaşın.", code: "MAIL_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    console.error("[team-invite-email] failed", { name: (error as Error)?.name });
    return NextResponse.json({ error: "Davet e-postası gönderilemedi." }, { status: 500 });
  }
}
