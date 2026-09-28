import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import {
  CalendarDays,
  CalendarCheck,
  Users2,
  TrendingUp,
  Star,
  Sparkles,
  ArrowUpRight,
  Clock,
  Scissors,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { SubscriptionAlert } from "@/components/SubscriptionAlert";
import DashboardOverviewClient from "./DashboardOverviewClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const businessId = user.business.id;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // 1. Metrics Calculation
  const totalAppointments = await prisma.appointment.count({
    where: { businessId },
  });

  const todayAppointments = await prisma.appointment.findMany({
    where: {
      businessId,
      date: todayStr,
    },
    include: {
      service: true,
      employee: true,
    },
    orderBy: { startTime: "asc" },
  });

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      businessId,
      date: { gte: todayStr },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      service: true,
      employee: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 5,
  });

  const totalCustomers = await prisma.customer.count({
    where: { businessId },
  });

  // Calculate total revenue from completed/confirmed appointments
  const revenueAppointments = await prisma.appointment.findMany({
    where: {
      businessId,
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    select: { price: true },
  });
  const totalRevenue = revenueAppointments.reduce((acc, a) => acc + a.price, 0);

  // Average Rating
  const reviews = await prisma.review.findMany({
    where: { businessId },
    select: { rating: true },
  });
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  // Most popular service
  const services = await prisma.service.findMany({
    where: { businessId },
    include: {
      _count: {
        select: { appointments: true },
      },
    },
    orderBy: {
      appointments: { _count: "desc" },
    },
    take: 1,
  });
  const popularService = services[0]?.name || "Tanımlanmadı";

  // Subscription calculation
  const subscription = user.business.subscription;
  let daysRemaining = 3;
  if (subscription?.status === "trial" && subscription.trialEndDate) {
    const diff = new Date(subscription.trialEndDate).getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="space-y-6">
      {/* Subscription Alert Banner */}
      <SubscriptionAlert
        status={subscription?.status || "trial"}
        daysRemaining={daysRemaining}
      />

      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Merhaba, {user.name} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            İşte <span className="text-slate-200 font-semibold">{user.business.name}</span> işletmenizin bugünkü özeti.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <CalendarDays className="w-4 h-4 text-indigo-400" />
            <span>Takvimi Aç</span>
          </Link>
          <Link
            href={`/${user.business.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition-all"
          >
            <span>Sayfamı Gör</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Appointments */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Bugünkü Randevular</span>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">
              {todayAppointments.length}
            </span>
            <span className="text-[11px] text-slate-400">adet</span>
          </div>
          <p className="text-[11px] text-indigo-400/90 mt-1">Bugün bekleyen randevular</p>
        </div>

        {/* Card 2: Total Customers */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Toplam Müşteri</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">{totalCustomers}</span>
            <span className="text-[11px] text-slate-400">kayıtlı</span>
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1">CRM müşteri veritabanı</p>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Toplam Gelir</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
          <p className="text-[11px] text-amber-400/90 mt-1">{totalAppointments} randevudan</p>
        </div>

        {/* Card 4: Average Rating & Popular Service */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Puan & Popüler</span>
            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400 border border-rose-500/20">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-100">{avgRating}</span>
            <span className="text-xs text-amber-400">★</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-1">
            En çok: <span className="text-slate-200 font-medium">{popularService}</span>
          </p>
        </div>
      </div>

      {/* Main Interactive Overview Area */}
      <DashboardOverviewClient
        businessId={businessId}
        todayAppointments={todayAppointments}
        upcomingAppointments={upcomingAppointments}
        businessSlug={user.business.slug}
        businessPhone={user.business.whatsappNumber || user.business.phone}
      />
    </div>
  );
}
