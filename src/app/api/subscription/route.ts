import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    let subscription = await prisma.subscription.findUnique({
      where: { businessId: user.business.id },
    });

    if (!subscription) {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(now.getDate() + 3);

      subscription = await prisma.subscription.create({
        data: {
          businessId: user.business.id,
          planType: "TRIAL",
          trialStartDate: now,
          trialEndDate: trialEnd,
          status: "trial",
          paymentStatus: "paid",
          monthlyPrice: 89.0,
        },
      });
    }

    const now = new Date();
    let daysRemaining = 0;
    let isExpired = false;

    if (subscription.status === "trial") {
      const diffMs = new Date(subscription.trialEndDate).getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      if (diffMs <= 0) {
        isExpired = true;
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "expired" },
        });
        subscription.status = "expired";
      }
    } else if (subscription.status === "active" && subscription.subscriptionEndDate) {
      const diffMs = new Date(subscription.subscriptionEndDate).getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      if (diffMs <= 0) {
        isExpired = true;
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "expired" },
        });
        subscription.status = "expired";
      }
    } else if (subscription.status === "expired" || subscription.status === "cancelled") {
      isExpired = true;
    }

    return NextResponse.json({
      subscription,
      daysRemaining,
      isExpired,
      monthlyPrice: 89.0,
      supportedGateways: ["PayTR", "iyzico"],
    });
  } catch (error) {
    console.error("GET subscription error:", error);
    return NextResponse.json({ error: "Abonelik bilgisi alınırken hata oluştu." }, { status: 500 });
  }
}

// POST: Upgrade or Renew Subscription (PayTR / iyzico integration endpoint)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { provider = "PayTR", planType = "PRO" } = body;

    const now = new Date();
    const subEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const updated = await prisma.subscription.upsert({
      where: { businessId: user.business.id },
      create: {
        businessId: user.business.id,
        planType,
        trialStartDate: now,
        trialEndDate: now,
        subscriptionStartDate: now,
        subscriptionEndDate: subEnd,
        status: "active",
        paymentStatus: "paid",
        monthlyPrice: 89.0,
        paymentProvider: provider,
      },
      update: {
        planType,
        subscriptionStartDate: now,
        subscriptionEndDate: subEnd,
        status: "active",
        paymentStatus: "paid",
        paymentProvider: provider,
      },
    });

    await prisma.notification.create({
      data: {
        businessId: user.business.id,
        title: "Abonelik Başarıyla Aktif Edildi 🎉",
        message: `${provider} üzerinden 89 TL aylık aboneliğiniz onaylandı. 30 gün boyunca kesintisiz kullanım sağlayabilirsiniz.`,
        type: "SUBSCRIPTION",
        link: "/dashboard/subscription",
      },
    });

    return NextResponse.json({
      success: true,
      subscription: updated,
      message: "Aboneliğiniz başarıyla yenilendi!",
    });
  } catch (error) {
    console.error("POST subscription error:", error);
    return NextResponse.json({ error: "Ödeme işlemi sırasında hata oluştu." }, { status: 500 });
  }
}

// PATCH: Toggle for testing restrictions (simulate expired or reset trial)
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { status } = await req.json();

    const updated = await prisma.subscription.update({
      where: { businessId: user.business.id },
      data: { status },
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error("PATCH subscription error:", error);
    return NextResponse.json({ error: "Abonelik durumu değiştirilemedi." }, { status: 500 });
  }
}
