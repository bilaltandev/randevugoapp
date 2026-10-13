import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        businesses: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Geçersiz e-posta veya şifre." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Geçersiz e-posta veya şifre." },
        { status: 401 }
      );
    }

    // Checked after the password so this message never reveals that an account exists.
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Hesabınız pasif durumda. Lütfen yöneticinizle iletişime geçin." },
        { status: 403 }
      );
    }

    // Team members work in the mobile app; the web panel is for owners (and staff roles) only.
    if (user.role === "TEAM_MEMBER") {
      return NextResponse.json(
        { error: "Ekip üyesi hesapları yalnızca mobil uygulamada kullanılabilir.", code: "MOBILE_ONLY" },
        { status: 403 }
      );
    }

    const activeBusiness = user.businesses[0] || null;

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: activeBusiness?.id,
      businessSlug: activeBusiness?.slug,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        business: activeBusiness,
      },
    });
  } catch (error: unknown) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Giriş yapılırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
