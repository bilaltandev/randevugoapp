import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sadece sistem yöneticileri erişebilir." }, { status: 403 });
    }

    const businesses = await prisma.business.findMany({
      include: {
        user: { select: { name: true, email: true } },
        subscription: true,
        _count: {
          select: {
            appointments: true,
            customers: true,
            services: true,
            employees: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalBusinesses = businesses.length;
    const totalAppointments = await prisma.appointment.count();
    const activeSubscriptions = businesses.filter(
      (b) => b.subscription?.status === "active"
    ).length;
    const trialBusinesses = businesses.filter(
      (b) => b.subscription?.status === "trial"
    ).length;
    const monthlyRecurringRevenue = activeSubscriptions * 89;

    // Platform GMV
    const completedAppointments = await prisma.appointment.findMany({
      where: { status: "COMPLETED" },
      select: { price: true },
    });
    const totalGmv = completedAppointments.reduce((acc, a) => acc + a.price, 0);

    return NextResponse.json({
      metrics: {
        totalBusinesses,
        totalAppointments,
        activeSubscriptions,
        trialBusinesses,
        monthlyRecurringRevenue,
        totalGmv,
      },
      businesses,
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Yönetici verileri alınırken hata oluştu." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const { businessId, isVerified, subscriptionStatus } = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: "İşletme ID'si zorunludur." }, { status: 400 });
    }

    if (isVerified !== undefined) {
      await prisma.business.update({
        where: { id: businessId },
        data: { isVerified },
      });
    }

    if (subscriptionStatus) {
      await prisma.subscription.update({
        where: { businessId },
        data: { status: subscriptionStatus },
      });
    }

    return NextResponse.json({ success: true, message: "İşletme güncellendi." });
  } catch (error) {
    console.error("Admin PATCH error:", error);
    return NextResponse.json({ error: "Güncelleme başarısız." }, { status: 500 });
  }
}
