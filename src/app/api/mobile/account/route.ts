import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { authenticateMobileAccessToken, getBearerToken } from "@/lib/mobileAuth";
import { PHONE_TAKEN, isPhoneTaken, phoneChanged } from "@/lib/uniqueness";

// Mobile app only (Bearer): the signed-in owner's own profile ("Profil" screen).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function authenticate(req: Request) {
  const token = getBearerToken(req.headers);
  return token ? authenticateMobileAccessToken(token) : null;
}

export async function GET(req: Request) {
  try {
    const auth = await authenticate(req);
    if (!auth) return NextResponse.json({ error: "Oturum bulunamadı.", code: "UNAUTHORIZED" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET mobile account error:", error);
    return NextResponse.json({ error: "Profil bilgileri alınamadı." }, { status: 500 });
  }
}

// Name and phone change freely; the e-mail (the login name) needs the current password.
export async function PATCH(req: Request) {
  try {
    const auth = await authenticate(req);
    if (!auth) return NextResponse.json({ error: "Oturum bulunamadı.", code: "UNAUTHORIZED" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!name || name.length > 80) {
      return NextResponse.json({ error: "Ad soyad 1–80 karakter olmalıdır.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    if (phone.length > 30) {
      return NextResponse.json({ error: "Telefon numarası çok uzun.", code: "INVALID_REQUEST" }, { status: 400 });
    }

    const current = await prisma.user.findUniqueOrThrow({ where: { id: auth.user.id } });
    if (email !== current.email) {
      const ok = typeof body.currentPassword === "string" && (await verifyPassword(body.currentPassword, current.password));
      if (!ok) {
        return NextResponse.json({ error: "E-posta değiştirmek için mevcut şifrenizi doğru girin.", code: "WRONG_PASSWORD" }, { status: 400 });
      }
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken && taken.id !== current.id) {
        return NextResponse.json({ error: "Bu e-posta adresi başka bir hesapta kullanılıyor.", code: "EMAIL_TAKEN" }, { status: 409 });
      }
    }
    if (phoneChanged(current.phone, phone) && (await isPhoneTaken(phone, current.id))) {
      return NextResponse.json({ error: PHONE_TAKEN, code: "PHONE_TAKEN" }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: current.id },
      data: { name, email, phone: phone || null },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("PATCH mobile account error:", error);
    return NextResponse.json({ error: "Profil güncellenirken bir hata oluştu." }, { status: 500 });
  }
}
