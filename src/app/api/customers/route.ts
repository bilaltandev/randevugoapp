import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      where: { businessId: user.business.id },
      include: {
        appointments: {
          orderBy: { date: "desc" },
          take: 3,
          include: { service: true },
        },
      },
      orderBy: { totalSpent: "desc" },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("GET customers error:", error);
    return NextResponse.json({ error: "Müşteriler alınırken hata oluştu." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id, notes, phone, email } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Müşteri ID'si gereklidir." }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id, businessId: user.business.id },
      data: {
        ...(notes !== undefined ? { notes } : {}),
        ...(phone ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
      },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error) {
    console.error("PATCH customer error:", error);
    return NextResponse.json({ error: "Müşteri güncellenirken hata oluştu." }, { status: 500 });
  }
}
