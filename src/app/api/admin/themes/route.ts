import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { THEME_REGISTRY } from "@/lib/themes/registry";

// Ensure themes exist in ThemeCatalog
async function syncDefaultThemes() {
  const existing = await prisma.themeCatalog.findMany();
  if (existing.length === 0) {
    for (const [key, t] of Object.entries(THEME_REGISTRY)) {
      await prisma.themeCatalog.create({
        data: {
          id: t.id,
          name: t.name,
          description: t.description,
          supportedCategories: JSON.stringify(t.supportedCategories),
          isActive: true,
          isPremium: t.isPremium || false,
          isBeta: t.isBeta || false,
          orderIndex: t.orderIndex || 0,
        },
      });
    }
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim. Sadece yönetici görüntüleyebilir." }, { status: 403 });
    }

    await syncDefaultThemes();

    const themes = await prisma.themeCatalog.findMany({
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ themes });
  } catch (error) {
    console.error("GET admin themes error:", error);
    return NextResponse.json({ error: "Temalar yüklenemedi." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const body = await req.json();
    const { id, isActive, orderIndex, isBeta, isPremium, supportedCategories } = body;

    if (!id) {
      return NextResponse.json({ error: "Tema ID zorunludur." }, { status: 400 });
    }

    const updated = await prisma.themeCatalog.update({
      where: { id },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(orderIndex !== undefined ? { orderIndex: Number(orderIndex) } : {}),
        ...(isBeta !== undefined ? { isBeta } : {}),
        ...(isPremium !== undefined ? { isPremium } : {}),
        ...(supportedCategories !== undefined
          ? {
              supportedCategories:
                typeof supportedCategories === "string"
                  ? supportedCategories
                  : JSON.stringify(supportedCategories),
            }
          : {}),
      },
    });

    return NextResponse.json({ success: true, theme: updated });
  } catch (error) {
    console.error("PATCH admin theme error:", error);
    return NextResponse.json({ error: "Tema güncellenirken hata oluştu." }, { status: 500 });
  }
}
