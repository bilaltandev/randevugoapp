// Bank transfer (havale/EFT) payments. There is no card gateway yet:
//   1. the owner picks a plan and a billing period → requestPayment() records an open request (paymentStatus
//      "pending"). Prices are in USD; the TL amount to transfer is fixed with the day's TCMB rate. The page shows
//      the bank details plus a reference to write in the transfer description;
//   2. the admin sees the transfer arrive and confirms it → confirmPayment() starts or extends the paid period.
// Nothing here ever activates a subscription on the owner's word alone.
import prisma from "./prisma";
import { applyPercentOff, checkCouponForBusiness, getActiveRedemption, normalizeCouponCode } from "./coupons";
import { getUsdTryRate, usdToTry } from "./exchangeRate";
import { PERIOD_MONTHS, PLAN_PRICES, periodOf, planOf, type BillingPeriod, type Plan } from "./plans";

export { paymentReference } from "./plans";

export class PaymentRequestError extends Error {
  constructor(message: string, public code: string, public status = 400) {
    super(message);
  }
}

/** Bank account shown on the payment screen; null until PAYMENT_IBAN is configured. */
export function bankDetails() {
  const iban = process.env.PAYMENT_IBAN?.trim();
  if (!iban) return null;
  return {
    iban,
    accountName: process.env.PAYMENT_ACCOUNT_NAME?.trim() || "",
    bankName: process.env.PAYMENT_BANK_NAME?.trim() || "",
  };
}

/**
 * USD price of one period; a custom price the admin set is kept while plan and period stay the same.
 * Shared with the subscription API so the page shows exactly what a request will charge.
 */
export function planPrice(
  subscription: { plan: string; monthlyPrice: number; billingPeriod?: string | null } | null,
  plan: Plan,
  period: BillingPeriod
) {
  const same = subscription && planOf(subscription) === plan && periodOf(subscription) === period;
  return same ? subscription.monthlyPrice : PLAN_PRICES[plan][period];
}

export async function requestPayment(businessId: string, plan: Plan, period: BillingPeriod, rawCoupon: unknown) {
  const subscription = await prisma.subscription.findUnique({ where: { businessId } });
  if (!subscription) throw new PaymentRequestError("Abonelik kaydı bulunamadı.", "NOT_FOUND", 404);

  if (plan === "PERSON") {
    const [staff, members] = await Promise.all([
      prisma.employee.count({ where: { businessId } }),
      prisma.employee.count({ where: { businessId, userId: { not: null } } }),
    ]);
    if (members > 0) throw new PaymentRequestError("Person planı için önce ekip üyelerini ekipten çıkarın.", "HAS_MEMBERS", 409);
    if (staff > 1) {
      throw new PaymentRequestError("Person planında yalnızca bir çalışan olabilir. Team planını seçin.", "TOO_MANY_STAFF", 409);
    }
  }

  // Coupons: a running discount applies by itself; a new code is checked now and used up on confirmation.
  const couponCode = normalizeCouponCode(rawCoupon);
  const running = await getActiveRedemption(businessId);
  let percentOff = 0;
  let appliedCode: string | null = null;
  if (running) {
    if (couponCode && couponCode !== running.coupon.code) {
      throw new PaymentRequestError("Devam eden bir indiriminiz var; yeni kod bu indirim bittikten sonra kullanılabilir.", "COUPON_RUNNING");
    }
    percentOff = running.percentOff;
    appliedCode = running.coupon.code;
  } else if (couponCode) {
    const check = await checkCouponForBusiness(couponCode, businessId);
    if (!check.ok) throw new PaymentRequestError(check.error, "COUPON_INVALID");
    percentOff = check.coupon.percentOff;
    appliedCode = check.coupon.code;
  }

  const price = planPrice(subscription, plan, period);
  const amount = percentOff ? applyPercentOff(price, percentOff) : price;
  const rate = await getUsdTryRate();
  const amountTry = rate ? usdToTry(amount, rate.rate) : null;

  const updated = await prisma.subscription.update({
    where: { businessId },
    data: {
      plan,
      billingPeriod: period,
      monthlyPrice: price,
      paymentStatus: "pending",
      paymentProvider: "EFT",
      paymentRequestedAt: new Date(),
      pendingAmount: amount,
      pendingAmountTry: amountTry,
      pendingRate: rate?.rate ?? null,
      pendingCouponCode: appliedCode,
    },
  });
  if (plan === "PERSON") {
    await prisma.teamInvite.updateMany({ where: { businessId, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  return { subscription: updated, amount, amountTry, rate, percentOff, appliedCode };
}

/**
 * Admin confirmed a transfer: the paid months (by default one billing period: 1 or 12) start when the current
 * trial or paid period ends (or now, if it already ended), and the request's coupon uses up one payment.
 */
export async function confirmPayment(businessId: string, months?: number) {
  const subscription = await prisma.subscription.findUnique({ where: { businessId } });
  const paidMonths = months ?? PERIOD_MONTHS[periodOf(subscription)];
  const now = new Date();
  const currentEnd =
    subscription?.status === "active" && subscription.subscriptionEndDate
      ? subscription.subscriptionEndDate
      : subscription?.status === "trial"
        ? subscription.trialEndDate
        : null;
  const start = currentEnd && currentEnd > now ? currentEnd : now;
  const end = new Date(start);
  end.setMonth(end.getMonth() + paidMonths);

  // Coupon lookups run before the transaction: production uses a single pooled connection
  // (connection_limit=1), so a query on `prisma` from inside `$transaction` would wait for the
  // connection the transaction holds until it timed out, and the confirmation failed.
  const code = subscription?.pendingCouponCode;
  const running = code
    ? await prisma.couponRedemption.findFirst({
        where: { businessId, monthsRemaining: { gt: 0 }, coupon: { code } },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const newCoupon = code && !running ? await checkCouponForBusiness(code, businessId) : null;

  return prisma.$transaction(async (tx) => {
    if (running) {
      await tx.couponRedemption.update({ where: { id: running.id }, data: { monthsRemaining: { decrement: 1 } } });
    } else if (newCoupon?.ok) {
      await tx.couponRedemption.create({
        data: {
          couponId: newCoupon.coupon.id,
          businessId,
          percentOff: newCoupon.coupon.percentOff,
          monthsRemaining: newCoupon.coupon.durationMonths - 1,
        },
      });
    }

    const updated = await tx.subscription.upsert({
      where: { businessId },
      create: {
        businessId,
        planType: "PRO",
        trialStartDate: now,
        trialEndDate: now,
        subscriptionStartDate: now,
        subscriptionEndDate: end,
        status: "active",
        paymentStatus: "paid",
        paymentProvider: "EFT",
      },
      update: {
        planType: "PRO",
        subscriptionStartDate: subscription?.status === "active" ? undefined : now,
        subscriptionEndDate: end,
        status: "active",
        paymentStatus: "paid",
        paymentRequestedAt: null,
        pendingAmount: null,
        pendingAmountTry: null,
        pendingRate: null,
        pendingCouponCode: null,
      },
    });

    await tx.notification.create({
      data: {
        businessId,
        title: "Ödemeniz onaylandı 🎉",
        message: `Aboneliğiniz ${end.toLocaleDateString("tr-TR")} tarihine kadar aktif. Teşekkür ederiz!`,
        type: "SUBSCRIPTION",
        link: "/dashboard/subscription",
      },
    });
    return updated;
  });
}

/** Admin found no matching transfer: drop the open request, nothing else changes. */
export async function rejectPayment(businessId: string) {
  return prisma.subscription.update({
    where: { businessId },
    data: {
      paymentStatus: "failed",
      paymentRequestedAt: null,
      pendingAmount: null,
      pendingAmountTry: null,
      pendingRate: null,
      pendingCouponCode: null,
    },
  });
}
