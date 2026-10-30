import crypto from "crypto";
import prisma from "./prisma";
import { hashPassword } from "./auth";
import { escapeHtml, sendMail } from "./mailer";

/**
 * "Forgot password": a single-use link sent by e-mail. Only the SHA-256 hash of a token is stored, a newer
 * link replaces the older one, and using one ends every session (phones are revoked here, web sessions end
 * through their password stamp). Never log tokens or hashes.
 *
 * Admin and support accounts are left out: they are reset by a super admin, so a mailbox alone can't take
 * over a staff account.
 */

export const RESET_TTL_MS = 60 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 8;
const SELF_SERVICE_ROLES = ["BUSINESS_OWNER", "TEAM_MEMBER"];

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

/** Page where the new password is set; clients prefix their own origin. */
export function resetPath(token: string): string {
  return `/sifre-yenile/${encodeURIComponent(token)}`;
}

/** The fixed site address, never the request's Host header: that link goes into an e-mail. */
export function siteOrigin(req: Request): string {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return process.env.VERCEL ? "https://www.calendlygo.com" : new URL(req.url).origin;
}

/** E-mails a reset link when `email` belongs to an eligible account; otherwise does nothing. */
export async function sendPasswordReset(email: string, origin: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, role: true, isActive: true } });
  if (!user || !user.isActive || !SELF_SERVICE_ROLES.includes(user.role)) return;

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });

  const link = `${origin}${resetPath(token)}`;
  await sendMail({
    to: user.email,
    subject: "CalendlyGo şifre sıfırlama",
    text:
      `Merhaba ${user.name},\n\n` +
      `Şifrenizi sıfırlamak için bu bağlantıyı açın: ${link}\n\n` +
      `Bağlantı 1 saat geçerlidir ve tek kullanımlıktır. Bu isteği siz yapmadıysanız e-postayı yok sayabilirsiniz; şifreniz değişmez.`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;color:#0D1117">
  <h2 style="margin:0 0 12px">Şifrenizi sıfırlayın</h2>
  <p style="margin:0 0 16px;color:#454E5C">Merhaba ${escapeHtml(user.name)}, CalendlyGo hesabınız için şifre sıfırlama isteği aldık.</p>
  <p style="margin:0 0 20px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#0A7B5C;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Yeni şifre belirle</a></p>
  <p style="margin:0;font-size:12px;color:#687180">Bağlantı 1 saat geçerlidir ve tek kullanımlıktır. Bu isteği siz yapmadıysanız e-postayı yok sayabilirsiniz; şifreniz değişmez.</p>
</div>`,
  });
}

/** Sets the new password. False when the link is unknown, expired or already used. */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true } });
  if (!row) return false;

  const password = await hashPassword(newPassword);
  return prisma.$transaction(async (tx) => {
    // Compare-and-swap: of two simultaneous uses, only one gets through.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) return false;

    await tx.user.update({ where: { id: row.userId }, data: { password } });
    await tx.mobileSession.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "PASSWORD_CHANGED" },
    });
    return true;
  });
}
