import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/restaurant/areas
// Lists areas for authenticated business or by ?businessId=
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessIdParam = searchParams.get("businessId");

    let businessId = businessIdParam;
    if (!businessId) {
      const user = await getCurrentUser();
      if (!user || !user.business) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
      }
      businessId = user.business.id;
    }

    const areas = await prisma.restaurantArea.findMany({
      where: { businessId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { tables: true },
        },
      },
    });

    return NextResponse.json({ areas });
  } catch (error) {
    console.error("GET restaurant areas error:", error);
    return NextResponse.json({ error: "Alanlar alınırken hata oluştu." }, { status: 500 });
  }
}

// POST /api/restaurant/areas
// Create a new area for authenticated business
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Alan adı gereklidir." }, { status: 400 });
    }

    const count = await prisma.restaurantArea.count({
      where: { businessId: user.business.id },
    });

    const area = await prisma.restaurantArea.create({
      data: {
        businessId: user.business.id,
        name: name.trim(),
        sortOrder: count + 1,
      },
    });

    return NextResponse.json({ success: true, area });
  } catch (error) {
    console.error("POST restaurant area error:", error);
    return NextResponse.json({ error: "Alan eklenirken hata oluştu." }, { status: 500 });
  }
}

// PATCH /api/restaurant/areas
// Rename or reorder an area
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "Alan ID gereklidir." }, { status: 400 });
    }

    const existing = await prisma.restaurantArea.findFirst({
      where: { id, businessId: user.business.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Alan bulunamadı." }, { status: 404 });
    }

    const updated = await prisma.restaurantArea.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(typeof sortOrder === "number" ? { sortOrder } : {}),
      },
    });

    return NextResponse.json({ success: true, area: updated });
  } catch (error) {
    console.error("PATCH restaurant area error:", error);
    return NextResponse.json({ error: "Alan güncellenirken hata oluştu." }, { status: 500 });
  }
}

// DELETE /api/restaurant/areas
// Delete an area
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Alan ID gereklidir." }, { status: 400 });
    }

    const existing = await prisma.restaurantArea.findFirst({
      where: { id, businessId: user.business.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Alan bulunamadı." }, { status: 404 });
    }

    // Set areaId null on tables belonging to this area
    await prisma.restaurantTable.updateMany({
      where: { areaId: id },
      data: { areaId: null },
    });

    await prisma.restaurantArea.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE restaurant area error:", error);
    return NextResponse.json({ error: "Alan silinirken hata oluştu." }, { status: 500 });
  }
}
