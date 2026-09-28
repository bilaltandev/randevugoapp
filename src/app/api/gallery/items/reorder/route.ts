import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const business = user.business;
    const { itemIds } = await req.json();

    if (!Array.isArray(itemIds)) {
      return NextResponse.json({ error: "itemIds listesi zorunludur." }, { status: 400 });
    }

    // Update each item's sortOrder ensuring ownership
    await Promise.all(
      itemIds.map((id, index) =>
        prisma.galleryItem.updateMany({
          where: {
            id,
            businessId: business.id,
          },
          data: {
            sortOrder: index,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/gallery/items/reorder error:", error);
    return NextResponse.json({ error: "Sıralama güncellenemedi." }, { status: 500 });
  }
}
