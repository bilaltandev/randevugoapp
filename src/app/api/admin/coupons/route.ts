import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getSuperAdmin } from "@/lib/support";
import { COUPON_CODE_PATTERN, COUPON_INCLUDE, MAX_COUPON_DURATION_MONTHS, normalizeCouponCode } from "@/lib/coupons";

export async function GET() {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Sadece yöneticiler erişebilir." }, { status: 403 });
  }

  const coupons = await prisma.coupon.findMany({
    include: COUPON_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ coupons });
}

export async function POST(req: Request) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Sadece yöneticiler erişebilir." }, { status: 403 });
    }

    const body = await req.json();
    const code = normalizeCouponCode(body.code);
    const percentOff = Number(body.percentOff);
    const durationMonths = Number(body.durationMonths);
    const maxRedemptions =
      body.maxRedemptions === "" || body.maxRedemptions == null ? null : Number(body.maxRedemptions);
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 200) : "";

    if (!COUPON_CODE_PATTERN.test(code)) {
      return NextResponse.json(
        { error: "Kupon kodu 3-30 karakter olmalı; yalnızca harf, rakam, - ve _ kullanılabilir." },
        { status: 400 }
      );
    }
    if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
      return NextResponse.json({ error: "İndirim yüzdesi 1 ile 100 arasında bir tam sayı olmalı." }, { status: 400 });
    }
    if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > MAX_COUPON_DURATION_MONTHS) {
      return NextResponse.json(
        { error: `İndirim süresi 1 ile ${MAX_COUPON_DURATION_MONTHS} ay arasında olmalı.` },
        { status: 400 }
      );
    }
    if (maxRedemptions !== null && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)) {
      return NextResponse.json({ error: "Kullanım limiti en az 1 olmalı ya da boş bırakılmalı." }, { status: 400 });
    }

    // A date-only value means "usable through that whole day" (Turkey time).
    let expiresAt: Date | null = null;
    if (body.expiresAt) {
      expiresAt = new Date(`${body.expiresAt}T23:59:59+03:00`);
      if (Number.isNaN(expiresAt.getTime())) {
        return NextResponse.json({ error: "Geçersiz son kullanım tarihi." }, { status: 400 });
      }
      if (expiresAt < new Date()) {
        return NextResponse.json({ error: "Son kullanım tarihi geçmişte olamaz." }, { status: 400 });
      }
    }

    if (await prisma.coupon.findUnique({ where: { code } })) {
      return NextResponse.json({ error: "Bu kupon kodu zaten mevcut." }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        percentOff,
        durationMonths,
        expiresAt,
        maxRedemptions,
        description: description || null,
        createdBy: admin.email,
      },
      include: COUPON_INCLUDE,
    });

    await createAuditLog({
      adminEmail: admin.email,
      adminName: admin.name,
      action: "COUPON_CREATE",
      target: coupon.code,
      targetId: coupon.id,
      newValue: `%${percentOff} / ${durationMonths} ay`,
      details: `Kupon oluşturuldu: ${code} (%${percentOff}, ilk ${durationMonths} ay${
        expiresAt ? `, son kullanım ${body.expiresAt}` : ""
      }${maxRedemptions ? `, limit ${maxRedemptions}` : ""}).`,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: unknown) {
    console.error("Create coupon error:", error);
    return NextResponse.json({ error: "Kupon oluşturulurken bir hata oluştu." }, { status: 500 });
  }
}
