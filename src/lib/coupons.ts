import prisma from "./prisma";
import { DEFAULT_MONTHLY_PRICE, normalizeCouponCode } from "./couponOptions";

export * from "./couponOptions";

export type CouponCheck =
  | { ok: true; coupon: { id: string; code: string; percentOff: number; durationMonths: number } }
  | { ok: false; error: string };

/** The discount a business is still receiving from an earlier redemption, if any. */
export async function getActiveRedemption(businessId: string) {
  return prisma.couponRedemption.findFirst({
    where: { businessId, monthsRemaining: { gt: 0 } },
    include: { coupon: { select: { code: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Whether `rawCode` can be redeemed by this business right now. */
export async function checkCouponForBusiness(rawCode: unknown, businessId: string): Promise<CouponCheck> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { ok: false, error: "İndirim kodu girin." };

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: { _count: { select: { redemptions: true } } },
  });
  if (!coupon || !coupon.isActive) {
    return { ok: false, error: "Bu indirim kodu geçerli değil." };
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { ok: false, error: "Bu indirim kodunun süresi dolmuş." };
  }
  if (coupon.maxRedemptions !== null && coupon._count.redemptions >= coupon.maxRedemptions) {
    return { ok: false, error: "Bu indirim kodunun kullanım limiti dolmuş." };
  }

  const alreadyUsed = await prisma.couponRedemption.findUnique({
    where: { couponId_businessId: { couponId: coupon.id, businessId } },
  });
  if (alreadyUsed) {
    return { ok: false, error: "Bu indirim kodunu daha önce kullandınız." };
  }
  if (await getActiveRedemption(businessId)) {
    return { ok: false, error: "Devam eden bir indiriminiz var; yeni kod bu indirim bittikten sonra kullanılabilir." };
  }

  return {
    ok: true,
    coupon: { id: coupon.id, code: coupon.code, percentOff: coupon.percentOff, durationMonths: coupon.durationMonths },
  };
}

/** The business's undiscounted monthly price (admins can set it per business). */
export async function getBasePrice(businessId: string): Promise<number> {
  const sub = await prisma.subscription.findUnique({
    where: { businessId },
    select: { monthlyPrice: true },
  });
  return sub?.monthlyPrice ?? DEFAULT_MONTHLY_PRICE;
}

/** What the admin coupon list shows for each coupon. */
export const COUPON_INCLUDE = {
  redemptions: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      percentOff: true,
      monthsRemaining: true,
      createdAt: true,
      business: { select: { id: true, name: true } },
    },
  },
};
