import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  applyPercentOff,
  formatTL,
  getActiveRedemption,
  getBasePrice,
  normalizeCouponCode,
  checkCouponForBusiness,
  DEFAULT_MONTHLY_PRICE,
} from "@/lib/coupons";

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
          monthlyPrice: DEFAULT_MONTHLY_PRICE,
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
      monthlyPrice: subscription.monthlyPrice,
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
    const businessId = user.business.id;

    const body = await req.json().catch(() => ({}));
    const { provider = "PayTR", planType = "PRO" } = body;
    const couponCode = normalizeCouponCode(body.couponCode);

    // Price is always computed here; the client only sends the code.
    const basePrice = await getBasePrice(businessId);
    const activeRedemption = await getActiveRedemption(businessId);

    let percentOff = 0;
    let appliedCode: string | null = null;
    let newCoupon: { id: string; code: string; percentOff: number; durationMonths: number } | null = null;

    if (activeRedemption) {
      if (couponCode && couponCode !== activeRedemption.coupon.code) {
        return NextResponse.json(
          { error: "Devam eden bir indiriminiz var; yeni kod bu indirim bittikten sonra kullanılabilir." },
          { status: 400 }
        );
      }
      percentOff = activeRedemption.percentOff;
      appliedCode = activeRedemption.coupon.code;
    } else if (couponCode) {
      const check = await checkCouponForBusiness(couponCode, businessId);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
      newCoupon = check.coupon;
      percentOff = check.coupon.percentOff;
      appliedCode = check.coupon.code;
    }

    const chargedAmount = percentOff ? applyPercentOff(basePrice, percentOff) : basePrice;

    const now = new Date();
    const subEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const updated = await prisma.$transaction(async (tx) => {
      // This payment consumes one discounted month.
      if (activeRedemption) {
        await tx.couponRedemption.update({
          where: { id: activeRedemption.id },
          data: { monthsRemaining: { decrement: 1 } },
        });
      } else if (newCoupon) {
        await tx.couponRedemption.create({
          data: {
            couponId: newCoupon.id,
            businessId,
            percentOff: newCoupon.percentOff,
            monthsRemaining: newCoupon.durationMonths - 1,
          },
        });
      }

      return tx.subscription.upsert({
        where: { businessId },
        create: {
          businessId,
          planType,
          trialStartDate: now,
          trialEndDate: now,
          subscriptionStartDate: now,
          subscriptionEndDate: subEnd,
          status: "active",
          paymentStatus: "paid",
          monthlyPrice: basePrice,
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
    });

    const remainingRedemption = await getActiveRedemption(businessId);
    const priceText = formatTL(chargedAmount);
    await prisma.notification.create({
      data: {
        businessId,
        title: "Abonelik Başarıyla Aktif Edildi 🎉",
        message: appliedCode
          ? `${provider} üzerinden ${priceText} ödemeniz onaylandı (${appliedCode} kodu ile %${percentOff} indirim). 30 gün boyunca kesintisiz kullanım sağlayabilirsiniz.`
          : `${provider} üzerinden ${priceText} aylık aboneliğiniz onaylandı. 30 gün boyunca kesintisiz kullanım sağlayabilirsiniz.`,
        type: "SUBSCRIPTION",
        link: "/dashboard/subscription",
      },
    });

    return NextResponse.json({
      success: true,
      subscription: updated,
      chargedAmount,
      appliedCode,
      percentOff,
      activeDiscount: remainingRedemption
        ? {
            code: remainingRedemption.coupon.code,
            percentOff: remainingRedemption.percentOff,
            monthsRemaining: remainingRedemption.monthsRemaining,
          }
        : null,
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
