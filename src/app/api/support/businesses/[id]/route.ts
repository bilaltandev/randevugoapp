import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revokeAllMobileSessions } from "@/lib/mobileAuth";
import {
  generateTemporaryPassword,
  getSupportAgent,
  SUPPORT_MAX_TRIAL_EXTENSION_DAYS,
} from "@/lib/support";

const DAY_MS = 24 * 60 * 60 * 1000;

// Limited support actions on a business: extend trial, reset owner password
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const agent = await getSupportAgent();
    if (!agent) {
      return NextResponse.json({ error: "Bu işlem için yetkili girişi gerekir." }, { status: 403 });
    }

    const { id: businessId } = await params;
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { subscription: true, user: { select: { id: true, email: true, role: true } } },
    });
    if (!business) {
      return NextResponse.json({ error: "İşletme bulunamadı." }, { status: 404 });
    }

    const body = await req.json();

    if (body.action === "EXTEND_TRIAL") {
      const days = Number(body.days);
      if (!Number.isInteger(days) || days < 1 || days > SUPPORT_MAX_TRIAL_EXTENSION_DAYS) {
        return NextResponse.json(
          { error: `Deneme süresi 1 ile ${SUPPORT_MAX_TRIAL_EXTENSION_DAYS} gün arasında uzatılabilir.` },
          { status: 400 }
        );
      }
      // Paid subscriptions are a super admin matter.
      if (business.subscription?.status === "active") {
        return NextResponse.json(
          { error: "Aktif aboneliği olan işletmenin deneme süresi uzatılamaz." },
          { status: 400 }
        );
      }

      const currentEndDate = business.subscription?.trialEndDate
        ? new Date(business.subscription.trialEndDate)
        : new Date();
      const baseDate = currentEndDate > new Date() ? currentEndDate : new Date();
      const newTrialEndDate = new Date(baseDate.getTime() + days * DAY_MS);

      const subscription = await prisma.subscription.upsert({
        where: { businessId },
        create: { businessId, status: "trial", trialStartDate: new Date(), trialEndDate: newTrialEndDate },
        update: { status: "trial", trialEndDate: newTrialEndDate },
      });

      const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";
      await createAuditLog({
        adminEmail: agent.email,
        adminName: `${agent.name} (Yetkili)`,
        action: "SUPPORT_TRIAL_EXTENDED",
        target: business.name,
        targetId: businessId,
        oldValue: currentEndDate.toISOString().split("T")[0],
        newValue: newTrialEndDate.toISOString().split("T")[0],
        details: `Yetkili tarafından deneme süresi ${days} gün uzatıldı.${note ? ` Not: ${note}` : ""}`,
      });

      return NextResponse.json({ success: true, subscription });
    }

    if (body.action === "RESET_OWNER_PASSWORD") {
      if (business.user.role !== "BUSINESS_OWNER") {
        return NextResponse.json({ error: "Bu hesabın şifresi yetkili tarafından sıfırlanamaz." }, { status: 403 });
      }

      const temporaryPassword = generateTemporaryPassword();
      await prisma.user.update({
        where: { id: business.user.id },
        data: { password: await hashPassword(temporaryPassword) },
      });
      // Sign the owner out everywhere: web sessions end with the password change (see lib/auth),
      // mobile sessions are revoked here so no device keeps working with the old password.
      const revokedDevices = await revokeAllMobileSessions(business.user.id, "PASSWORD_CHANGED");

      await createAuditLog({
        adminEmail: agent.email,
        adminName: `${agent.name} (Yetkili)`,
        action: "SUPPORT_PASSWORD_RESET",
        target: business.name,
        targetId: businessId,
        details: `İşletme sahibinin (${business.user.email}) şifresi yetkili tarafından sıfırlandı. Tüm oturumlar kapatıldı (${revokedDevices} mobil cihaz).`,
      });

      // Returned once so the agent can pass it to the owner; only the hash is stored.
      return NextResponse.json({ success: true, temporaryPassword });
    }

    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (error: unknown) {
    console.error("Support business action error:", error);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
