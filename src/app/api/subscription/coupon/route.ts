import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { applyPercentOff, checkCouponForBusiness, getBasePrice } from "@/lib/coupons";

// Preview a coupon at checkout; nothing is redeemed until the payment (POST /api/subscription).
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { code } = await req.json().catch(() => ({}));
    const check = await checkCouponForBusiness(code, user.business.id);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const basePrice = await getBasePrice(user.business.id);
    return NextResponse.json({
      code: check.coupon.code,
      percentOff: check.coupon.percentOff,
      durationMonths: check.coupon.durationMonths,
      basePrice,
      discountedPrice: applyPercentOff(basePrice, check.coupon.percentOff),
    });
  } catch (error) {
    console.error("Coupon preview error:", error);
    return NextResponse.json({ error: "İndirim kodu kontrol edilirken hata oluştu." }, { status: 500 });
  }
}
