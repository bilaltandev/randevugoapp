import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_MONTHLY_PRICE, getActiveRedemption } from "@/lib/coupons";
import { getUsdTryRate } from "@/lib/exchangeRate";
import { BILLING_PERIODS, PLAN_PRICES, PLANS, isBillingPeriod, isPlan, periodOf, planOf, type BillingPeriod, type Plan } from "@/lib/plans";
import { subscriptionAccess, subscriptionLock } from "@/lib/subscriptionAccess";
import { PaymentRequestError, bankDetails, paymentReference, planPrice, requestPayment } from "@/lib/subscriptionPayments";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const businessId = user.business.id;

    let subscription = await prisma.subscription.findUnique({ where: { businessId } });
    if (!subscription) {
      const now = new Date();
      subscription = await prisma.subscription.create({
        data: {
          businessId,
          planType: "TRIAL",
          trialStartDate: now,
          trialEndDate: new Date(now.getTime() + 3 * DAY_MS),
          status: "trial",
          paymentStatus: "paid",
          monthlyPrice: DEFAULT_MONTHLY_PRICE,
        },
      });
    }

    const access = subscriptionAccess(subscription);
    // Keep the stored status in step with the dates so lists (admin) show the truth.
    if (!access.active && (subscription.status === "trial" || subscription.status === "active")) {
      subscription = await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "expired" } });
    }
    const daysRemaining =
      access.active && access.endsAt ? Math.max(0, Math.ceil((access.endsAt.getTime() - Date.now()) / DAY_MS)) : 0;
    const [running, rate] = await Promise.all([getActiveRedemption(businessId), getUsdTryRate()]);
    // USD price of every plan × period for this business (an admin's custom price shows where it applies).
    const prices = Object.fromEntries(
      PLANS.map((p) => [p, Object.fromEntries(BILLING_PERIODS.map((period) => [period, planPrice(subscription, p, period)]))])
    ) as Record<Plan, Record<BillingPeriod, number>>;

    return NextResponse.json({
      subscription,
      access: access.active ? { active: true, kind: access.kind, endsAt: access.endsAt } : { active: false, kind: "expired" },
      daysRemaining,
      isExpired: !access.active,
      plan: planOf(subscription),
      billingPeriod: periodOf(subscription),
      currency: "USD",
      prices,
      /** @deprecated monthly prices only; kept for older app builds. Use `prices`. */
      planPrices: { PERSON: prices.PERSON.MONTHLY, TEAM: prices.TEAM.MONTHLY },
      monthlyPrice: subscription.monthlyPrice,
      rate,
      payment:
        subscription.paymentStatus === "pending" && subscription.paymentRequestedAt
          ? {
              requestedAt: subscription.paymentRequestedAt,
              amount: subscription.pendingAmount ?? subscription.monthlyPrice,
              amountTry: subscription.pendingAmountTry,
              rate: subscription.pendingRate,
              billingPeriod: periodOf(subscription),
              couponCode: subscription.pendingCouponCode,
            }
          : null,
      bank: bankDetails(),
      reference: paymentReference(businessId),
      activeDiscount: running
        ? { code: running.coupon.code, percentOff: running.percentOff, monthsRemaining: running.monthsRemaining }
        : null,
    });
  } catch (error) {
    console.error("GET subscription error:", error);
    return NextResponse.json({ error: "Abonelik bilgisi alınırken hata oluştu." }, { status: 500 });
  }
}

// POST { plan, billingPeriod?, couponCode? }: "Satın al" by bank transfer. Records an open payment request for the admin to
// confirm; it never activates anything by itself. Allowed while locked, since this is how owners get out.
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    if (!isPlan(body.plan)) {
      return NextResponse.json({ error: "Lütfen bir paket seçin.", code: "INVALID_REQUEST" }, { status: 400 });
    }

    const period: BillingPeriod = isBillingPeriod(body.billingPeriod) ? body.billingPeriod : "MONTHLY";

    const result = await requestPayment(user.business.id, body.plan, period, body.couponCode);
    return NextResponse.json({
      success: true,
      plan: planOf(result.subscription),
      billingPeriod: period,
      amount: result.amount,
      amountTry: result.amountTry,
      rate: result.rate,
      percentOff: result.percentOff,
      appliedCode: result.appliedCode,
      bank: bankDetails(),
      reference: paymentReference(user.business.id),
    });
  } catch (error) {
    if (error instanceof PaymentRequestError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("POST subscription error:", error);
    return NextResponse.json({ error: "Ödeme talebi oluşturulamadı." }, { status: 500 });
  }
}

// PUT { plan: "PERSON" | "TEAM" }: switch plans during the trial or a paid period. The price follows the plan from the next payment.
// Going back to PERSON needs a business that already fits it: one staff record and no team members.
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;
    const businessId = user.business.id;
    const body = await req.json().catch(() => ({}));
    if (!isPlan(body.plan)) {
      return NextResponse.json({ error: "Geçersiz plan.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    const plan: Plan = body.plan;

    if (plan === "PERSON") {
      const [staff, members] = await Promise.all([
        prisma.employee.count({ where: { businessId } }),
        prisma.employee.count({ where: { businessId, userId: { not: null } } }),
      ]);
      if (members > 0) {
        return NextResponse.json(
          { error: "Person planına geçmeden önce ekip üyelerini ekipten çıkarın.", code: "HAS_MEMBERS" },
          { status: 409 }
        );
      }
      if (staff > 1) {
        return NextResponse.json(
          { error: "Person planında yalnızca bir çalışan olabilir. Önce fazla çalışanları silin veya Team planında kalın.", code: "TOO_MANY_STAFF" },
          { status: 409 }
        );
      }
    }

    const subscription = await prisma.subscription.update({
      where: { businessId },
      data: { plan, monthlyPrice: PLAN_PRICES[plan][periodOf(user.business.subscription)] },
    });
    if (plan === "PERSON") {
      // Open invites are useless without the TEAM plan.
      await prisma.teamInvite.updateMany({ where: { businessId, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
    }

    return NextResponse.json({ success: true, plan: planOf(subscription), monthlyPrice: subscription.monthlyPrice });
  } catch (error) {
    console.error("PUT subscription plan error:", error);
    return NextResponse.json({ error: "Plan değiştirilemedi." }, { status: 500 });
  }
}
