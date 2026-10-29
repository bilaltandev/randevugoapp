import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateMobileAccessToken, getBearerToken } from "@/lib/mobileAuth";
import { isExpoPushToken } from "@/lib/pushNotifications";

// Mobile app only (Bearer): this device's Expo push token, stored on the signed-in session, so new
// bookings can be announced on the phone. Signing out revokes the session, which stops the alerts.

async function authenticate(req: Request) {
  const token = getBearerToken(req.headers);
  return token ? authenticateMobileAccessToken(token) : null;
}

// PUT { token } registers (or replaces) the token; one device's token moves to its newest session.
export async function PUT(req: Request) {
  try {
    const auth = await authenticate(req);
    if (!auth) return NextResponse.json({ error: "Oturum bulunamadı.", code: "UNAUTHORIZED" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!isExpoPushToken(token)) {
      return NextResponse.json({ error: "Geçersiz bildirim anahtarı.", code: "INVALID_REQUEST" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.mobileSession.updateMany({ where: { pushToken: token, id: { not: auth.sessionId } }, data: { pushToken: null } }),
      prisma.mobileSession.update({ where: { id: auth.sessionId }, data: { pushToken: token } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT mobile push token error:", error);
    return NextResponse.json({ error: "Bildirim ayarı kaydedilemedi." }, { status: 500 });
  }
}

// DELETE turns the alerts off for this device (e.g. the user denied notifications).
export async function DELETE(req: Request) {
  try {
    const auth = await authenticate(req);
    if (!auth) return NextResponse.json({ error: "Oturum bulunamadı.", code: "UNAUTHORIZED" }, { status: 401 });
    await prisma.mobileSession.update({ where: { id: auth.sessionId }, data: { pushToken: null } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE mobile push token error:", error);
    return NextResponse.json({ error: "Bildirim ayarı kaydedilemedi." }, { status: 500 });
  }
}
