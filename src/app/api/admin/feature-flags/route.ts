import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    let galleryFlag = await prisma.featureFlag.findUnique({
      where: { key: "gallerySystem" },
    });

    if (!galleryFlag) {
      galleryFlag = await prisma.featureFlag.create({
        data: {
          key: "gallerySystem",
          isEnabled: true,
          enabledSectors: null, // null means all sectors
          disabledBusinessIds: null,
          enabledBusinessIds: null,
          description: "İşletme sayfalarında görsel portföy ve sonsuz galeri vitrini.",
        },
      });
    }

    return NextResponse.json({
      flags: [galleryFlag],
    });
  } catch (error) {
    console.error("GET /api/admin/feature-flags error:", error);
    return NextResponse.json({ error: "Feature flags alınamadı." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const { key, isEnabled, enabledSectors, disabledBusinessIds, enabledBusinessIds } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "Flag key zorunludur." }, { status: 400 });
    }

    const updated = await prisma.featureFlag.upsert({
      where: { key },
      create: {
        key,
        isEnabled: isEnabled ?? true,
        enabledSectors: enabledSectors ? JSON.stringify(enabledSectors) : null,
        disabledBusinessIds: disabledBusinessIds ? JSON.stringify(disabledBusinessIds) : null,
        enabledBusinessIds: enabledBusinessIds ? JSON.stringify(enabledBusinessIds) : null,
        description: "Görsel galeri ve portföy modülü.",
      },
      update: {
        ...(isEnabled !== undefined ? { isEnabled } : {}),
        ...(enabledSectors !== undefined
          ? { enabledSectors: enabledSectors ? JSON.stringify(enabledSectors) : null }
          : {}),
        ...(disabledBusinessIds !== undefined
          ? { disabledBusinessIds: disabledBusinessIds ? JSON.stringify(disabledBusinessIds) : null }
          : {}),
        ...(enabledBusinessIds !== undefined
          ? { enabledBusinessIds: enabledBusinessIds ? JSON.stringify(enabledBusinessIds) : null }
          : {}),
      },
    });

    return NextResponse.json({ success: true, flag: updated });
  } catch (error) {
    console.error("POST /api/admin/feature-flags error:", error);
    return NextResponse.json({ error: "Feature flag güncellenemedi." }, { status: 500 });
  }
}
