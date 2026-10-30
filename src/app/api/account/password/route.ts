import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword, setSessionCookie, verifyPassword } from "@/lib/auth";
import { revokeAllMobileSessions } from "@/lib/mobileAuth";
import { WEAK_PASSWORD, isStrongPassword } from "@/lib/passwordPolicy";

// Web panel: change the signed-in owner's password. Every other session ends: phones are revoked here,
// other browsers through their password stamp. This browser stays signed in.

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "Oturum bulunamadı.", code: "UNAUTHORIZED" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json().catch(() => ({}));
    if (!isStrongPassword(newPassword)) {
      return NextResponse.json({ error: WEAK_PASSWORD, code: "WEAK_PASSWORD" }, { status: 400 });
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
    if (typeof currentPassword !== "string" || !(await verifyPassword(currentPassword, user.password))) {
      return NextResponse.json({ error: "Mevcut şifre hatalı.", code: "WRONG_PASSWORD" }, { status: 400 });
    }
    if (await verifyPassword(newPassword, user.password)) {
      return NextResponse.json({ error: "Yeni şifre mevcut şifreyle aynı olamaz.", code: "SAME_PASSWORD" }, { status: 400 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(newPassword) } });
    await revokeAllMobileSessions(user.id, "PASSWORD_CHANGED");
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: session.business?.id,
      businessSlug: session.business?.slug,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account password change error:", (error as Error)?.name);
    return NextResponse.json({ error: "Şifre değiştirilirken bir hata oluştu." }, { status: 500 });
  }
}
