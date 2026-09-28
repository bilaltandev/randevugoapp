import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    let page = await prisma.page.findUnique({
      where: { businessId: user.business.id },
    });

    if (!page) {
      const defaultBlocks = [
        {
          id: "hero-1",
          type: "Hero",
          title: user.business.name,
          subtitle: "Online randevunuzu saniyeler içinde oluşturun.",
          badge: "Online Rezervasyon Açık",
          ctaText: "Hemen Randevu Al",
        },
        {
          id: "about-1",
          type: "About",
          title: "Hakkımızda",
          content: `${user.business.name} kaliteli ve güvenilir hizmet sunar.`,
        },
        {
          id: "services-1",
          type: "Services",
          title: "Hizmetlerimiz",
          subtitle: "Tüm hizmet ve fiyat listemiz.",
          showPrice: true,
          showDuration: true,
        },
        {
          id: "staff-1",
          type: "Staff",
          title: "Ekibimiz",
          subtitle: "Deneyimli uzmanlarımız.",
        },
        {
          id: "booking-1",
          type: "Booking",
          title: "Online Rezervasyon",
          subtitle: "Tarih ve saat seçerek randevunuzu oluşturun.",
        },
        {
          id: "reviews-1",
          type: "Reviews",
          title: "Müşteri Değerlendirmeleri",
        },
        {
          id: "location-1",
          type: "Location",
          title: "İletişim & Konum",
          address: user.business.address,
          phone: user.business.phone,
        },
      ];

      page = await prisma.page.create({
        data: {
          businessId: user.business.id,
          blocksJson: JSON.stringify(defaultBlocks),
          themeColor: "indigo",
          themeId: user.business.themeId || "premium-dark",
          font: "Inter",
          isPublished: true,
        },
      });
    }

    return NextResponse.json({ page, business: user.business });
  } catch (error) {
    console.error("GET page error:", error);
    return NextResponse.json({ error: "Sayfa bilgisi alınamadı." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const {
      blocksJson,
      themeColor,
      font,
      isPublished,
      seoTitle,
      seoDescription,
      themeId,
      themeOverrides,
      sectionOrder,
      hiddenSections,
      resetOverrides,
      coverImage,
      businessName,
      businessDescription,
    } = body;

    // Update Business model fields if provided
    const businessDataToUpdate: any = {};
    if (themeId) businessDataToUpdate.themeId = themeId;
    if (coverImage) businessDataToUpdate.coverImage = coverImage;
    if (businessName) businessDataToUpdate.name = businessName;
    if (businessDescription !== undefined) businessDataToUpdate.description = businessDescription;

    if (Object.keys(businessDataToUpdate).length > 0) {
      await prisma.business.update({
        where: { id: user.business.id },
        data: businessDataToUpdate,
      });
    }

    // Format fields for page model
    const formattedBlocks =
      blocksJson !== undefined
        ? typeof blocksJson === "string"
          ? blocksJson
          : JSON.stringify(blocksJson)
        : undefined;

    const formattedOverrides = resetOverrides
      ? null
      : themeOverrides !== undefined
      ? typeof themeOverrides === "string"
        ? themeOverrides
        : JSON.stringify(themeOverrides)
      : undefined;

    const formattedSectionOrder =
      sectionOrder !== undefined
        ? typeof sectionOrder === "string"
          ? sectionOrder
          : JSON.stringify(sectionOrder)
        : undefined;

    const formattedHiddenSections =
      hiddenSections !== undefined
        ? typeof hiddenSections === "string"
          ? hiddenSections
          : JSON.stringify(hiddenSections)
        : undefined;

    const updated = await prisma.page.upsert({
      where: { businessId: user.business.id },
      create: {
        businessId: user.business.id,
        blocksJson: formattedBlocks || "[]",
        themeColor: themeColor || "indigo",
        themeId: themeId || user.business.themeId || "premium-dark",
        themeOverrides: formattedOverrides || null,
        sectionOrder: formattedSectionOrder || null,
        hiddenSections: formattedHiddenSections || null,
        font: font || "Inter",
        isPublished: isPublished ?? true,
        seoTitle: seoTitle || `${user.business.name} - Online Randevu`,
        seoDescription: seoDescription || null,
      },
      update: {
        ...(formattedBlocks !== undefined ? { blocksJson: formattedBlocks } : {}),
        ...(themeColor ? { themeColor } : {}),
        ...(themeId ? { themeId } : {}),
        ...(formattedOverrides !== undefined ? { themeOverrides: formattedOverrides } : {}),
        ...(formattedSectionOrder !== undefined ? { sectionOrder: formattedSectionOrder } : {}),
        ...(formattedHiddenSections !== undefined ? { hiddenSections: formattedHiddenSections } : {}),
        ...(font ? { font } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
        ...(seoTitle !== undefined ? { seoTitle } : {}),
        ...(seoDescription !== undefined ? { seoDescription } : {}),
      },
    });

    return NextResponse.json({ success: true, page: updated });
  } catch (error) {
    console.error("POST page error:", error);
    return NextResponse.json({ error: "Sayfa kaydedilirken hata oluştu." }, { status: 500 });
  }
}
