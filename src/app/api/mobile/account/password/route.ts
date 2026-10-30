import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { authenticateMobileAccessToken, getBearerToken } from "@/lib/mobileAuth";
import { WEAK_PASSWORD, isStrongPassword } from "@/lib/passwordPolicy";

// Mobile app only (Bearer): change the signed-in owner's password.
// Every other session ends: other phones are revoked here, web sessions end through their password stamp.
// This phone stays signed in.

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req.headers);
    const auth = token ? await authenticateMobileAccessToken(token) : null;
    if (!auth) return NextResponse.json({ error: "Oturum bulunamadı.", code: "UNAUTHORIZED" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json().catch(() => ({}));
    if (!isStrongPassword(newPassword)) {
      return NextResponse.json({ error: WEAK_PASSWORD, code: "WEAK_PASSWORD" }, { status: 400 });
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: auth.user.id } });
    if (typeof currentPassword !== "string" || !(await verifyPassword(currentPassword, user.password))) {
      return NextResponse.json({ error: "Mevcut şifre hatalı.", code: "WRONG_PASSWORD" }, { status: 400 });
    }
    if (await verifyPassword(newPassword, user.password)) {
      return NextResponse.json({ error: "Yeni şifre mevcut şifreyle aynı olamaz.", code: "SAME_PASSWORD" }, { status: 400 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(newPassword) } });
    const { count } = await prisma.mobileSession.updateMany({
      where: { userId: user.id, revokedAt: null, id: { not: auth.sessionId } },
      data: { revokedAt: new Date(), revokedReason: "PASSWORD_CHANGED" },
    });

    return NextResponse.json({ success: true, signedOutDevices: count });
  } catch (error) {
    console.error("Mobile password change error:", error);
    return NextResponse.json({ error: "Şifre değiştirilirken bir hata oluştu." }, { status: 500 });
  }
}
