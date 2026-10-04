import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/restaurant/tables/batch-positions
// Update positions of multiple tables simultaneously
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const { positions } = body; // Array of { id: string, positionX: number, positionY: number }

    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
    }

    // Update each table ensuring it belongs to current business
    await prisma.$transaction(
      positions.map((pos) =>
        prisma.restaurantTable.updateMany({
          where: {
            id: pos.id,
            businessId: user.business.id,
          },
          data: {
            positionX: Number(pos.positionX),
            positionY: Number(pos.positionY),
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Batch update table positions error:", error);
    return NextResponse.json({ error: "Masa konumları kaydedilirken hata oluştu." }, { status: 500 });
  }
}
