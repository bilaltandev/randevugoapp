import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword, verifyPassword, setSessionCookie } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { WEAK_PASSWORD, isStrongPassword } from "@/lib/passwordPolicy";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAuthorizedAdmin(role?: string | null): boolean {
  const normalized = role?.trim().toUpperCase();
  return normalized === "SUPER_ADMIN" || normalized === "ADMIN" || normalized === "SUPERADMIN";
}

async function getAdmin() {
  const current = await getCurrentUser();
  if (!current || !isAuthorizedAdmin(current.role)) return null;
  return prisma.user.findUnique({ where: { id: current.id } });
}

// Update name / email / phone
export async function PATCH(req: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Bu işlem için yönetici yetkisi gerekir." }, { status: 403 });
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";

    if (!name) {
      return NextResponse.json({ error: "Ad soyad zorunludur." }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
    }

    const emailChanged = email !== admin.email;
    if (emailChanged) {
      if (!currentPassword || !(await verifyPassword(currentPassword, admin.password))) {
        return NextResponse.json(
          { error: "E-posta değiştirmek için mevcut şifrenizi doğru girin." },
          { status: 400 }
        );
      }
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken && taken.id !== admin.id) {
        return NextResponse.json({ error: "Bu e-posta adresi başka bir hesapta kullanılıyor." }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: { name, email, phone: phone || null },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    // The session payload carries the email, so refresh it after a change.
    if (emailChanged) {
      await setSessionCookie({ userId: updated.id, email: updated.email, role: updated.role });
    }

    const changes: string[] = [];
    if (admin.name !== updated.name) changes.push("ad");
    if (emailChanged) changes.push("e-posta");
    if ((admin.phone || null) !== (updated.phone || null)) changes.push("telefon");

    if (changes.length > 0) {
      await createAuditLog({
        adminEmail: updated.email,
        adminName: updated.name,
        action: "ADMIN_PROFILE_UPDATE",
        target: "Yönetici Profili",
        targetId: updated.id,
        oldValue: emailChanged ? admin.email : null,
        newValue: emailChanged ? updated.email : null,
        details: `Güncellenen alanlar: ${changes.join(", ")}`,
      });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: unknown) {
    console.error("Admin profile update error:", error);
    return NextResponse.json({ error: "Profil güncellenirken bir hata oluştu." }, { status: 500 });
  }
}

// Change password
export async function POST(req: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Bu işlem için yönetici yetkisi gerekir." }, { status: 403 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !(await verifyPassword(currentPassword, admin.password))) {
      return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 400 });
    }
    if (!isStrongPassword(newPassword)) {
      return NextResponse.json({ error: WEAK_PASSWORD }, { status: 400 });
    }
    if (await verifyPassword(newPassword, admin.password)) {
      return NextResponse.json({ error: "Yeni şifre mevcut şifreyle aynı olamaz." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: admin.id },
      data: { password: await hashPassword(newPassword) },
    });
    // The change ends every other session of this account; keep the one that made it signed in.
    await setSessionCookie({ userId: admin.id, email: admin.email, role: admin.role });

    await createAuditLog({
      adminEmail: admin.email,
      adminName: admin.name,
      action: "ADMIN_PASSWORD_CHANGE",
      target: "Yönetici Profili",
      targetId: admin.id,
      details: "Yönetici şifresi değiştirildi.",
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Admin password change error:", error);
    return NextResponse.json({ error: "Şifre değiştirilirken bir hata oluştu." }, { status: 500 });
  }
}
