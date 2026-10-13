import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { PLAN_PRICES, formatUSD, isBillingPeriod, isPlan, monthlyEquivalent, periodOf, planOf, PERIOD_SUFFIX, type BillingPeriod } from "@/lib/plans";
import { confirmPayment, rejectPayment } from "@/lib/subscriptionPayments";

// 9 Standard Platform Features
export const DEFAULT_FEATURE_FLAGS = [
  { key: "appointments", description: "Online Randevu & Rezervasyon Sistemi" },
  { key: "employees", description: "Uzman & Personel Seçimi ve Yönetimi" },
  { key: "reviews", description: "Müşteri Değerlendirmeleri ve Yorumlar" },
  { key: "gallery", description: "Görsel Portföy ve Sonsuz Galeri Vitrini" },
  { key: "menu", description: "Hizmet ve Fiyat Listesi Menüsü" },
  { key: "qrMenu", description: "Masalara Özel Temassız QR Menü" },
  { key: "analytics", description: "Gelişmiş İstatistik ve Gelir Raporları" },
  { key: "whatsapp", description: "WhatsApp Otomatik Bildirimleri ve Hat Entegrasyonu" },
  { key: "pageBuilder", description: "Web Sitesi Tasarımcısı ve Blok Özelleştirme" },
];

function isAuthorizedAdmin(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return normalized === "SUPER_ADMIN" || normalized === "ADMIN" || normalized === "SUPERADMIN";
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAuthorizedAdmin(user.role)) {
      return NextResponse.json({ error: "Sadece Süper Yöneticiler (SUPER_ADMIN) erişebilir." }, { status: 403 });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Ensure default feature flags exist
    for (const f of DEFAULT_FEATURE_FLAGS) {
      const exists = await prisma.featureFlag.findUnique({ where: { key: f.key } });
      if (!exists) {
        await prisma.featureFlag.create({
          data: {
            key: f.key,
            description: f.description,
            isEnabled: true,
          },
        });
      }
    }

    // 1. Fetch all businesses with associations
    const businesses = await prisma.business.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        subscription: true,
        _count: {
          select: {
            appointments: true,
            customers: true,
            services: true,
            employees: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Platform Overall Metrics
    const totalBusinesses = businesses.length;
    const activeBusinesses = businesses.filter((b) => b.isActive !== false).length;
    const passiveBusinesses = businesses.filter((b) => b.isActive === false).length;

    const trialBusinesses = businesses.filter(
      (b) => b.subscription?.status === "trial"
    ).length;

    const activeSubscriptions = businesses.filter(
      (b) => b.subscription?.status === "active"
    ).length;

    const expiredSubscriptions = businesses.filter(
      (b) => b.subscription?.status === "expired"
    ).length;

    const cancelledSubscriptions = businesses.filter(
      (b) => b.subscription?.status === "cancelled"
    ).length;

    const totalUsers = await prisma.user.count();
    const totalAppointments = await prisma.appointment.count();

    const todayAppointmentsCount = await prisma.appointment.count({
      where: { date: todayStr },
    });

    const monthlyAppointmentsCount = await prisma.appointment.count({
      where: {
        createdAt: { gte: firstDayOfMonth },
      },
    });

    // Monthly Recurring Revenue: sum of active subscriptions' monthly prices
    const monthlyRecurringRevenue = businesses
      .filter((b) => b.subscription?.status === "active")
      // USD per month: yearly prices count as a twelfth.
      .reduce((sum, b) => sum + monthlyEquivalent(b.subscription?.monthlyPrice ?? 0, periodOf(b.subscription)), 0);

    // Platform GMV (Total revenue from completed reservations)
    const completedAppointments = await prisma.appointment.findMany({
      where: { status: "COMPLETED" },
      select: { price: true },
    });
    const totalGmv = completedAppointments.reduce((acc, a) => acc + a.price, 0);

    // 3. Recent Businesses (last 6)
    const recentBusinesses = businesses.slice(0, 6);

    // 4. Recent Appointments across platform (last 8)
    const recentAppointments = await prisma.appointment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        business: { select: { id: true, name: true, slug: true, sector: true } },
        service: { select: { id: true, name: true } },
      },
    });

    // 5. Most Active Businesses (by appointment count)
    const topBusinesses = [...businesses]
      .sort((a, b) => (b._count?.appointments || 0) - (a._count?.appointments || 0))
      .slice(0, 5);

    // 6. Sector Distribution
    const sectorCounts: Record<string, number> = {};
    businesses.forEach((b) => {
      const sec = b.sector || "DIGER";
      sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
    });

    // 7. Feature Flags
    const featureFlags = await prisma.featureFlag.findMany({
      orderBy: { key: "asc" },
    });

    // 8. Recent Audit Logs
    let auditLogs: any[] = [];
    try {
      if ((prisma as any).auditLog) {
        auditLogs = await (prisma as any).auditLog.findMany({
          take: 40,
          orderBy: { createdAt: "desc" },
        });
      }
    } catch {
      auditLogs = [];
    }

    return NextResponse.json({
      metrics: {
        totalBusinesses,
        activeBusinesses,
        passiveBusinesses,
        trialBusinesses,
        activeSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions,
        totalUsers,
        totalAppointments,
        todayAppointmentsCount,
        monthlyAppointmentsCount,
        monthlyRecurringRevenue,
        totalGmv,
      },
      businesses,
      recentBusinesses,
      recentAppointments,
      topBusinesses,
      sectorCounts,
      featureFlags,
      auditLogs,
    });
  } catch (error) {
    console.error("Super Admin GET API error:", error);
    return NextResponse.json({ error: "Yönetici verileri yüklenirken hata oluştu." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAuthorizedAdmin(user.role)) {
      return NextResponse.json(
        { error: `Yetkisiz erişim (Rol: ${user?.role || "Giriş yapılmamış"}). Sadece SUPER_ADMIN yetkisiyle işlem yapılabilir.` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, businessId } = body;

    if (!businessId && action !== "GLOBAL_FEATURE_TOGGLE") {
      return NextResponse.json({ error: "İşletme ID'si zorunludur." }, { status: 400 });
    }

    const business = businessId
      ? await prisma.business.findUnique({
          where: { id: businessId },
          include: { subscription: true, user: true },
        })
      : null;

    if (businessId && !business) {
      return NextResponse.json({ error: "İşletme bulunamadı." }, { status: 404 });
    }

    // 1. TOGGLE ACTIVE / PASSIVE
    if (action === "TOGGLE_ACTIVE") {
      const newActive = body.isActive !== undefined ? Boolean(body.isActive) : !business?.isActive;
      const updated = await prisma.business.update({
        where: { id: businessId },
        data: { isActive: newActive },
      });

      await createAuditLog({
        adminEmail: user.email,
        adminName: user.name,
        action: "BUSINESS_STATUS_CHANGE",
        target: business!.name,
        targetId: businessId,
        oldValue: business!.isActive ? "Aktif" : "Pasif",
        newValue: newActive ? "Aktif" : "Pasif",
        details: `İşletme durumu ${newActive ? "Aktif" : "Pasif"} olarak değiştirildi.`,
      });

      return NextResponse.json({ success: true, business: updated });
    }

    // 2. TOGGLE VERIFIED (Onay Rozeti)
    if (action === "TOGGLE_VERIFY") {
      const newVerified = body.isVerified !== undefined ? Boolean(body.isVerified) : !business?.isVerified;
      const updated = await prisma.business.update({
        where: { id: businessId },
        data: { isVerified: newVerified },
      });

      await createAuditLog({
        adminEmail: user.email,
        adminName: user.name,
        action: "BUSINESS_STATUS_CHANGE",
        target: business!.name,
        targetId: businessId,
        oldValue: business!.isVerified ? "Onaylı" : "Onaysız",
        newValue: newVerified ? "Onaylı" : "Onaysız",
        details: "İşletme onay rozeti güncellendi.",
      });

      return NextResponse.json({ success: true, business: updated });
    }

    // 3. CHANGE SECTOR
    if (action === "CHANGE_SECTOR") {
      const { newSector } = body;
      if (!newSector) {
        return NextResponse.json({ error: "Yeni sektör seçilmelidir." }, { status: 400 });
      }

      const updated = await prisma.business.update({
        where: { id: businessId },
        data: { sector: newSector },
      });

      await createAuditLog({
        adminEmail: user.email,
        adminName: user.name,
        action: "SECTOR_CHANGE",
        target: business!.name,
        targetId: businessId,
        oldValue: business!.sector,
        newValue: newSector,
        details: `İşletme sektörü ${business!.sector} -> ${newSector} olarak değiştirildi.`,
      });

      return NextResponse.json({ success: true, business: updated });
    }

    // 4. EXTEND TRIAL
    if (action === "EXTEND_TRIAL") {
      const days = Number(body.days) || 14;
      const currentEndDate = business!.subscription?.trialEndDate
        ? new Date(business!.subscription.trialEndDate)
        : new Date();

      const baseDate = currentEndDate > new Date() ? currentEndDate : new Date();
      const newTrialEndDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

      const updatedSub = await prisma.subscription.upsert({
        where: { businessId },
        create: {
          businessId,
          status: "trial",
          trialStartDate: new Date(),
          trialEndDate: newTrialEndDate,
        },
        update: {
          status: "trial",
          trialEndDate: newTrialEndDate,
        },
      });

      await createAuditLog({
        adminEmail: user.email,
        adminName: user.name,
        action: "TRIAL_EXTENDED",
        target: business!.name,
        targetId: businessId,
        oldValue: currentEndDate.toISOString().split("T")[0],
        newValue: newTrialEndDate.toISOString().split("T")[0],
        details: `Deneme süresi ${days} gün uzatıldı (Yeni Bitiş: ${newTrialEndDate.toISOString().split("T")[0]}).`,
      });

      return NextResponse.json({ success: true, subscription: updatedSub });
    }

    // 5. ACTIVATE SUBSCRIPTION
    if (action === "ACTIVATE_SUBSCRIPTION") {
      // Without `months`: one billing period of the business (1 month, or 12 for yearly).
      const months = Number(body.months) || undefined;
      const pending = business!.subscription?.paymentStatus === "pending";
      // Confirms an open bank transfer request too: clears it and uses up its coupon month.
      const updatedSub = await confirmPayment(businessId, months);

      await createAuditLog({
        adminEmail: user.email,
        adminName: user.name,
        action: "SUBSCRIPTION_CHANGE",
        target: business!.name,
        targetId: businessId,
        oldValue: business!.subscription?.status || "Yok",
        newValue: `active (${months ?? (periodOf(updatedSub) === "YEARLY" ? 12 : 1)} ay - ${formatUSD(updatedSub.monthlyPrice)} ${PERIOD_SUFFIX[periodOf(updatedSub)]})`,
        details: `${pending ? "Havale/EFT ödemesi onaylandı" : "Abonelik yönetici tarafından manuel aktif edildi"}. Bitiş: ${updatedSub.subscriptionEndDate?.toISOString().split("T")[0]}`,
      });

      return NextResponse.json({ success: true, subscription: updatedSub });
    }

    // 6a. REJECT an open bank transfer request (no matching transfer arrived)
    if (action === "REJECT_PAYMENT") {
      const updatedSub = await rejectPayment(businessId);
      await createAuditLog({
        adminEmail: user.email,
        adminName: user.name,
        action: "SUBSCRIPTION_CHANGE",
        target: business!.name,
        targetId: businessId,
        oldValue: "Ödeme bekleniyor",
        newValue: "Ödeme talebi reddedildi",
        details: "Havale/EFT ödeme talebi yönetici tarafından reddedildi.",
      });
      return NextResponse.json({ success: true, subscription: updatedSub });
    }

    // 6. UPDATE SUBSCRIPTION (Status, EndDate, Price)
    if (action === "UPDATE_SUBSCRIPTION") {
      const { status, subscriptionEndDate, monthlyPrice } = body;
      const dataToUpdate: any = {};

      if (status) dataToUpdate.status = status;
      if (subscriptionEndDate) dataToUpdate.subscriptionEndDate = new Date(subscriptionEndDate);
      if (monthlyPrice !== undefined) dataToUpdate.monthlyPrice = Number(monthlyPrice);

      const updatedSub = await prisma.subscription.upsert({
        where: { businessId },
        create: {
          businessId,
          status: status || "active",
          trialStartDate: new Date(),
          trialEndDate: new Date(),
          subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : null,
          monthlyPrice: monthlyPrice !== undefined ? Number(monthlyPrice) : PLAN_PRICES.PERSON.MONTHLY,
        },
        update: dataToUpdate,
      });

      await createAuditLog({
        adminEmail: user.email,
        adminName: user.name,
        action: "SUBSCRIPTION_CHANGE",
        target: business!.name,
        targetId: businessId,
        oldValue: `${business!.subscription?.status || "trial"} (${formatUSD(business!.subscription?.monthlyPrice ?? 0)})`,
        newValue: `${status || business!.subscription?.status} (${formatUSD(Number(monthlyPrice ?? business!.subscription?.monthlyPrice ?? 0))})`,
        details: `Abonelik detayları güncellendi.`,
      });

      return NextResponse.json({ success: true, subscription: updatedSub });
    }

    // 6b. SET PLAN (Person / Team) and the TEAM member limit, by hand
    if (action === "SET_PLAN") {
      const sub = business!.subscription;
      const plan = body.plan === undefined ? planOf(sub) : body.plan;
      if (!isPlan(plan)) {
        return NextResponse.json({ error: "Geçersiz plan." }, { status: 400 });
      }
      const memberLimit = body.memberLimit === undefined ? (sub?.memberLimit ?? 5) : Number(body.memberLimit);
      if (!Number.isInteger(memberLimit) || memberLimit < 1 || memberLimit > 100) {
        return NextResponse.json({ error: "Ekip üyesi sınırı 1–100 arası bir sayı olmalıdır." }, { status: 400 });
      }

      const [members, staff] = await Promise.all([
        prisma.employee.count({ where: { businessId, userId: { not: null } } }),
        prisma.employee.count({ where: { businessId } }),
      ]);
      if (memberLimit < members) {
        return NextResponse.json({ error: `Sınır mevcut üye sayısından (${members}) küçük olamaz.` }, { status: 409 });
      }
      if (plan === "PERSON" && (members > 0 || staff > 1)) {
        return NextResponse.json(
          { error: "Person planı için işletmenin ekip üyesi olmamalı ve en fazla bir çalışanı olmalı." },
          { status: 409 }
        );
      }

      const billingPeriod: BillingPeriod = isBillingPeriod(body.billingPeriod) ? body.billingPeriod : periodOf(sub);

      // A plan or period change moves the price to the list price (USD), unless a price is given.
      const changed = plan !== planOf(sub) || billingPeriod !== periodOf(sub);
      const listPrice = PLAN_PRICES[plan][billingPeriod];
      const monthlyPrice =
        body.monthlyPrice !== undefined ? Number(body.monthlyPrice) : changed ? listPrice : (sub?.monthlyPrice ?? listPrice);
      if (!Number.isFinite(monthlyPrice) || monthlyPrice < 0) {
        return NextResponse.json({ error: "Geçersiz ücret." }, { status: 400 });
      }

      const updatedSub = await prisma.subscription.upsert({
        where: { businessId },
        create: { businessId, plan, billingPeriod, memberLimit, monthlyPrice, trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        update: { plan, billingPeriod, memberLimit, monthlyPrice },
      });
      if (plan === "PERSON") {
        await prisma.teamInvite.updateMany({ where: { businessId, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
      }

      await createAuditLog({
        adminEmail: user.email,
        adminName: user.name,
        action: "SUBSCRIPTION_CHANGE",
        target: business!.name,
        targetId: businessId,
        oldValue: `${planOf(sub)} ${periodOf(sub)} (limit ${sub?.memberLimit ?? 5}, ${formatUSD(sub?.monthlyPrice ?? 0)})`,
        newValue: `${plan} ${billingPeriod} (limit ${memberLimit}, ${formatUSD(monthlyPrice)})`,
        details: "Plan ve ekip üyesi sınırı yönetici tarafından güncellendi.",
      });

      return NextResponse.json({ success: true, subscription: updatedSub });
    }

    // 7. TOGGLE BUSINESS FEATURE FLAG
    if (action === "TOGGLE_BUSINESS_FEATURE") {
      const { featureKey, enable } = body;
      if (!featureKey) {
        return NextResponse.json({ error: "Özellik anahtarı (featureKey) zorunludur." }, { status: 400 });
      }

      let flag = await prisma.featureFlag.findUnique({
        where: { key: featureKey },
      });

      if (!flag) {
        flag = await prisma.featureFlag.create({
          data: { key: featureKey, isEnabled: true },
        });
      }

      let enabledIds: string[] = [];
      let disabledIds: string[] = [];
      try {
        if (flag.enabledBusinessIds) enabledIds = JSON.parse(flag.enabledBusinessIds);
      } catch {}
      try {
        if (flag.disabledBusinessIds) disabledIds = JSON.parse(flag.disabledBusinessIds);
      } catch {}

      if (enable) {
        // Enable for this business
        enabledIds = Array.from(new Set([...enabledIds, businessId]));
        disabledIds = disabledIds.filter((id) => id !== businessId);
      } else {
        // Disable for this business
        disabledIds = Array.from(new Set([...disabledIds, businessId]));
        enabledIds = enabledIds.filter((id) => id !== businessId);
      }

      const updatedFlag = await prisma.featureFlag.update({
        where: { key: featureKey },
        data: {
          enabledBusinessIds: JSON.stringify(enabledIds),
          disabledBusinessIds: JSON.stringify(disabledIds),
        },
      });

      await createAuditLog({
        adminEmail: user.email,
        adminName: user.name,
        action: "FEATURE_FLAG_CHANGE",
        target: business!.name,
        targetId: businessId,
        oldValue: !enable ? "Açık" : "Kapalı",
        newValue: enable ? "Açık" : "Kapalı",
        details: `[${featureKey}] özelliği işletme için ${enable ? "AÇILDI" : "KAPATILDI"}.`,
      });

      return NextResponse.json({ success: true, flag: updatedFlag });
    }

    // 8. GLOBAL FEATURE FLAG TOGGLE
    if (action === "GLOBAL_FEATURE_TOGGLE") {
      const { featureKey, isEnabled } = body;
      if (!featureKey) {
        return NextResponse.json({ error: "featureKey zorunludur." }, { status: 400 });
      }

      const updatedFlag = await prisma.featureFlag.upsert({
        where: { key: featureKey },
        create: {
          key: featureKey,
          isEnabled: Boolean(isEnabled),
        },
        update: {
          isEnabled: Boolean(isEnabled),
        },
      });

      await createAuditLog({
        adminEmail: user.email,
        adminName: user.name,
        action: "FEATURE_FLAG_CHANGE",
        target: "Tüm Sistem (Global)",
        targetId: null,
        oldValue: !isEnabled ? "Aktif" : "Pasif",
        newValue: isEnabled ? "Aktif" : "Pasif",
        details: `[${featureKey}] özelliği tüm platform için global ${isEnabled ? "AÇILDI" : "KAPATILDI"}.`,
      });

      return NextResponse.json({ success: true, flag: updatedFlag });
    }

    return NextResponse.json({ error: "Geçersiz işlem (action)." }, { status: 400 });
  } catch (error) {
    console.error("Super Admin PATCH API error:", error);
    return NextResponse.json({ error: "İşlem sırasında hata oluştu." }, { status: 500 });
  }
}
