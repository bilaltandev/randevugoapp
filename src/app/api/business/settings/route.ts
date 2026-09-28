import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: user.business.id },
      include: {
        workingHours: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    return NextResponse.json({ business });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Ayarlar alınırken hata oluştu." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      phone,
      address,
      city,
      whatsappNumber,
      logo,
      coverImage,
      sector,
      workingHours,
    } = body;

    const updatedBusiness = await prisma.business.update({
      where: { id: user.business.id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(phone ? { phone } : {}),
        ...(address ? { address } : {}),
        ...(city ? { city } : {}),
        ...(whatsappNumber !== undefined ? { whatsappNumber } : {}),
        ...(logo !== undefined ? { logo } : {}),
        ...(coverImage !== undefined ? { coverImage } : {}),
        ...(sector ? { sector } : {}),
      },
    });

    // Update working hours if provided
    if (Array.isArray(workingHours)) {
      for (const wh of workingHours) {
        if (wh.id) {
          await prisma.workingHour.update({
            where: { id: wh.id },
            data: {
              isOpen: wh.isOpen,
              openTime: wh.openTime,
              closeTime: wh.closeTime,
              breakStartTime: wh.breakStartTime,
              breakEndTime: wh.breakEndTime,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, business: updatedBusiness });
  } catch (error) {
    console.error("PUT settings error:", error);
    return NextResponse.json({ error: "Ayarlar kaydedilirken hata oluştu." }, { status: 500 });
  }
}
