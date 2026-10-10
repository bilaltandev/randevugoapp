import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getSuperAdmin } from "@/lib/support";
import { COUPON_INCLUDE } from "@/lib/coupons";

// Activate / deactivate. Deactivating stops new redemptions; running discounts continue.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Sadece yöneticiler erişebilir." }, { status: 403 });
    }

    const { id } = await params;
    const { isActive } = await req.json();
    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kupon bulunamadı." }, { status: 404 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive },
      include: COUPON_INCLUDE,
    });

    await createAuditLog({
      adminEmail: admin.email,
      adminName: admin.name,
      action: "COUPON_UPDATE",
      target: coupon.code,
      targetId: coupon.id,
      oldValue: existing.isActive ? "Aktif" : "Pasif",
      newValue: isActive ? "Aktif" : "Pasif",
      details: `Kupon ${isActive ? "aktifleştirildi" : "pasife alındı"}: ${coupon.code}`,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: unknown) {
    console.error("Update coupon error:", error);
    return NextResponse.json({ error: "Kupon güncellenirken bir hata oluştu." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Sadece yöneticiler erişebilir." }, { status: 403 });
    }

    const { id } = await params;
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { redemptions: { where: { monthsRemaining: { gt: 0 } } } } } },
    });
    if (!coupon) {
      return NextResponse.json({ error: "Kupon bulunamadı." }, { status: 404 });
    }

    // Deleting would silently end discounts businesses are still counting on.
    if (coupon._count.redemptions > 0) {
      return NextResponse.json(
        {
          error: `Bu kuponla indirimi devam eden ${coupon._count.redemptions} işletme var. Silmek yerine pasife alın; yeni kullanım durur, mevcut indirimler biter.`,
        },
        { status: 409 }
      );
    }

    await prisma.coupon.delete({ where: { id } });

    await createAuditLog({
      adminEmail: admin.email,
      adminName: admin.name,
      action: "COUPON_DELETE",
      target: coupon.code,
      targetId: coupon.id,
      oldValue: `%${coupon.percentOff} / ${coupon.durationMonths} ay`,
      details: `Kupon silindi: ${coupon.code}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete coupon error:", error);
    return NextResponse.json({ error: "Kupon silinirken bir hata oluştu." }, { status: 500 });
  }
}
