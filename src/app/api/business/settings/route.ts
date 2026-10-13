import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { storedTimeToMinutes } from "@/lib/appointmentRules";
import { subscriptionLock } from "@/lib/subscriptionAccess";

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
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;

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
      enableStaffSelection,
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
        ...(enableStaffSelection !== undefined ? { enableStaffSelection: Boolean(enableStaffSelection) } : {}),
      },
    });

    // Update working hours if provided. Rows are matched by id *and* business, so a request can never
    // change another business's hours; times must be valid "HH:mm" with opening before closing.
    if (Array.isArray(workingHours)) {
      const isTime = (v: unknown) => typeof v === "string" && storedTimeToMinutes(v) !== null;
      const isOptionalTime = (v: unknown) => v === null || v === undefined || v === "" || isTime(v);
      for (const wh of workingHours) {
        if (!wh?.id) continue;
        if (!isTime(wh.openTime) || !isTime(wh.closeTime) || !isOptionalTime(wh.breakStartTime) || !isOptionalTime(wh.breakEndTime)) {
          return NextResponse.json({ error: "Çalışma saatleri SS:DD biçiminde olmalıdır." }, { status: 400 });
        }
        if (wh.isOpen && storedTimeToMinutes(wh.openTime)! >= storedTimeToMinutes(wh.closeTime)!) {
          return NextResponse.json({ error: "Açılış saati kapanış saatinden önce olmalıdır." }, { status: 400 });
        }
      }
      for (const wh of workingHours) {
        if (!wh?.id) continue;
        await prisma.workingHour.updateMany({
          where: { id: wh.id, businessId: user.business.id },
          data: {
            isOpen: Boolean(wh.isOpen),
            openTime: wh.openTime,
            closeTime: wh.closeTime,
            breakStartTime: wh.breakStartTime || null,
            breakEndTime: wh.breakEndTime || null,
          },
        });
      }
    }

    return NextResponse.json({ success: true, business: updatedBusiness });
  } catch (error) {
    console.error("PUT settings error:", error);
    return NextResponse.json({ error: "Ayarlar kaydedilirken hata oluştu." }, { status: 500 });
  }
}
