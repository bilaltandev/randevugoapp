"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Building2,
  Users2,
  CalendarCheck,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  ArrowLeft,
  Sparkles,
  LogOut,
  Palette,
  Clock,
  Layers,
  ToggleLeft,
  ToggleRight,
  Filter,
  Eye,
  Calendar,
  AlertCircle,
  RefreshCw,
  Plus,
  Sliders,
  FileText,
  DollarSign,
  ChevronRight,
  Phone,
  Mail,
  UserCheck,
  Check,
  Ban,
  Activity,
  History,
  ShieldCheck,
  Zap,
  UserCog,
  Headset,
  Ticket,
} from "lucide-react";
import { formatCurrency, formatPhoneNumber, SECTORS } from "@/lib/utils";
import { SectorBadge } from "@/components/SectorBadge";
import { AdminThemeManagement } from "@/components/admin/AdminThemeManagement";
import { AdminProfileSettings, type AdminProfile } from "@/components/admin/AdminProfileSettings";
import { AdminSupportAgents } from "@/components/admin/AdminSupportAgents";
import { AdminCoupons } from "@/components/admin/AdminCoupons";
import { Modal } from "@/components/Modal";

interface AdminClientProps {
  initialBusinesses: any[];
  metrics: {
    totalBusinesses: number;
    activeBusinesses: number;
    passiveBusinesses: number;
    trialBusinesses: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    cancelledSubscriptions: number;
    totalUsers: number;
    totalAppointments: number;
    todayAppointmentsCount: number;
    monthlyAppointmentsCount: number;
    monthlyRecurringRevenue: number;
    totalGmv: number;
  };
  recentBusinesses: any[];
  recentAppointments: any[];
  topBusinesses: any[];
  sectorCounts: Record<string, number>;
  initialFeatureFlags: any[];
  initialAuditLogs: any[];
  adminUser: any;
}

export default function AdminClient({
  initialBusinesses,
  metrics: initialMetrics,
  recentBusinesses,
  recentAppointments,
  topBusinesses,
  sectorCounts,
  initialFeatureFlags,
  initialAuditLogs,
  adminUser,
}: AdminClientProps) {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "businesses" | "features" | "subscriptions" | "audit" | "themes" | "coupons" | "agents" | "profile"
  >("overview");

  // Admin profile (kept in state so header reflects edits from the profile tab)
  const [adminProfile, setAdminProfile] = useState<AdminProfile>({
    name: adminUser.name,
    email: adminUser.email,
    phone: adminUser.phone ?? null,
  });
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin/login";
    }
  };

  // State
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [featureFlags, setFeatureFlags] = useState(initialFeatureFlags);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);

  // Business filtering & search
  const [businessSearch, setBusinessSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "PASSIVE" | "TRIAL" | "SUB_ACTIVE" | "SUB_EXPIRED"
  >("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");

  // Selected Business for Detail / Action Drawer
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "subscription" | "features" | "sector">("info");

  // Action states
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Subscription Edit Modal states
  const [subMonths, setSubMonths] = useState(1);
  const [subPrice, setSubPrice] = useState(89);
  const [trialDays, setTrialDays] = useState(14);
  const [customEndDate, setCustomEndDate] = useState("");
  const [newSector, setNewSector] = useState("BERBER");

  const showNotification = (type: "success" | "error", text: string) => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Helper to trigger API and refresh state
  const handleApiAction = async (payload: any) => {
    setLoadingAction(payload.action);
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Sunucu yanıtı geçersiz (HTTP ${res.status})` };
      }

      if (!res.ok || data.error) {
        const errorText = data.error || data.message || `İşlem gerçekleştirilemedi (HTTP ${res.status})`;
        showNotification("error", errorText);
        return;
      }

      showNotification("success", "Değişiklik başarıyla kaydedildi.");

      // Refresh data by calling GET
      try {
        const refreshRes = await fetch("/api/admin");
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.businesses) setBusinesses(refreshData.businesses);
          if (refreshData.metrics) setMetrics(refreshData.metrics);
          if (refreshData.featureFlags) setFeatureFlags(refreshData.featureFlags);
          if (refreshData.auditLogs) setAuditLogs(refreshData.auditLogs);

          // Update selected business if open
          if (selectedBusiness) {
            const updatedSelected = refreshData.businesses.find((b: any) => b.id === selectedBusiness.id);
            if (updatedSelected) setSelectedBusiness(updatedSelected);
          }
        }
      } catch (refreshErr) {
        console.warn("Veriler yenilenirken hata:", refreshErr);
      }
    } catch (err: any) {
      console.error("Admin action exception:", err);
      showNotification("error", err?.message || "İşlem sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setLoadingAction(null);
    }
  };


  // Filtered Businesses
  const filteredBusinesses = businesses.filter((b) => {
    // Search
    const q = businessSearch.toLowerCase();
    const matchesSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      b.user?.name?.toLowerCase().includes(q) ||
      b.user?.email?.toLowerCase().includes(q) ||
      b.phone?.includes(q);

    // Status Filter
    let matchesStatus = true;
    if (statusFilter === "ACTIVE") matchesStatus = b.isActive !== false;
    if (statusFilter === "PASSIVE") matchesStatus = b.isActive === false;
    if (statusFilter === "TRIAL") matchesStatus = b.subscription?.status === "trial";
    if (statusFilter === "SUB_ACTIVE") matchesStatus = b.subscription?.status === "active";
    if (statusFilter === "SUB_EXPIRED") matchesStatus = b.subscription?.status === "expired";

    // Sector Filter
    const matchesSector = sectorFilter === "ALL" || b.sector === sectorFilter;

    return matchesSearch && matchesStatus && matchesSector;
  });

  // Feature Flag Helper for Business
  const isFeatureEnabledForBusiness = (flagKey: string, businessId: string): boolean => {
    const flag = featureFlags.find((f) => f.key === flagKey);
    if (!flag) return true; // Default true if not defined

    let enabledIds: string[] = [];
    let disabledIds: string[] = [];
    try {
      if (flag.enabledBusinessIds) enabledIds = JSON.parse(flag.enabledBusinessIds);
    } catch {}
    try {
      if (flag.disabledBusinessIds) disabledIds = JSON.parse(flag.disabledBusinessIds);
    } catch {}

    if (disabledIds.includes(businessId)) return false;
    if (enabledIds.includes(businessId)) return true;
    return flag.isEnabled;
  };

  return (
    <div className="space-y-6">
      {/* Top Super Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-amber-500/20 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                RandevuGo Süper Yönetici
              </h1>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-black text-amber-300 tracking-wider uppercase">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Yönetici: <span className="text-slate-200 font-semibold">{adminProfile.name}</span> ({adminProfile.email})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>İşletme Paneli</span>
          </Link>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <span>Ana Sayfa</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors disabled:opacity-60"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? "Çıkılıyor..." : "Çıkış Yap"}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notificationMsg && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between shadow-lg transition-all animate-in fade-in ${
            notificationMsg.type === "success"
              ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/80 border border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "overview"
              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Gelişmiş Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("businesses")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "businesses"
              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>İşletme Yönetimi ({businesses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("features")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "features"
              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Özellik Yönetimi (Flags)</span>
        </button>

        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "subscriptions"
              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Abonelik Yönetimi</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "audit"
              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("themes")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "themes"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Tema Yönetimi</span>
        </button>

        <button
          onClick={() => setActiveTab("coupons")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "coupons"
              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Kuponlar</span>
        </button>

        <button
          onClick={() => setActiveTab("agents")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "agents"
              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Headset className="w-4 h-4" />
          <span>Yetkililer</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "profile"
              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>Profil Ayarları</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1: GELİŞMİŞ DASHBOARD (OVERVIEW)
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top 10 Core Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* 1. Toplam İşletme */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <span className="text-[11px] text-slate-400 font-semibold block">Toplam İşletme</span>
              <div className="text-2xl font-black text-white mt-1">{metrics.totalBusinesses}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Kayıtlı hesap</span>
            </div>

            {/* 2. Aktif İşletme */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 backdrop-blur-md">
              <span className="text-[11px] text-emerald-400 font-semibold block">Aktif İşletme</span>
              <div className="text-2xl font-black text-emerald-300 mt-1">{metrics.activeBusinesses}</div>
              <span className="text-[10px] text-emerald-400/80 mt-0.5 block">{metrics.passiveBusinesses} pasif</span>
            </div>

            {/* 3. Trial İşletme */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 backdrop-blur-md">
              <span className="text-[11px] text-amber-400 font-semibold block">Trial (Deneme)</span>
              <div className="text-2xl font-black text-amber-300 mt-1">{metrics.trialBusinesses}</div>
              <span className="text-[10px] text-amber-400/80 mt-0.5 block">14 günlük süreçte</span>
            </div>

            {/* 4. Aktif Abonelik */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 backdrop-blur-md">
              <span className="text-[11px] text-indigo-400 font-semibold block">Aktif Abonelik</span>
              <div className="text-2xl font-black text-indigo-300 mt-1">{metrics.activeSubscriptions}</div>
              <span className="text-[10px] text-indigo-400/80 mt-0.5 block">Ödeme yapan PRO</span>
            </div>

            {/* 5. Süresi Dolmuş Abonelik */}
            <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4 backdrop-blur-md">
              <span className="text-[11px] text-rose-400 font-semibold block">Süresi Dolmuş</span>
              <div className="text-2xl font-black text-rose-300 mt-1">{metrics.expiredSubscriptions}</div>
              <span className="text-[10px] text-rose-400/80 mt-0.5 block">{metrics.cancelledSubscriptions} iptal</span>
            </div>

            {/* 6. Toplam Kullanıcı */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <span className="text-[11px] text-slate-400 font-semibold block">Toplam Kullanıcı</span>
              <div className="text-2xl font-black text-slate-200 mt-1">{metrics.totalUsers}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Sistem üyesi</span>
            </div>

            {/* 7. Toplam Rezervasyon */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <span className="text-[11px] text-slate-400 font-semibold block">Toplam Rezervasyon</span>
              <div className="text-2xl font-black text-slate-200 mt-1">{metrics.totalAppointments}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Tüm zamanlar</span>
            </div>

            {/* 8. Bugünkü Rezervasyon */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 backdrop-blur-md">
              <span className="text-[11px] text-emerald-400 font-semibold block">Bugünkü Rezervasyon</span>
              <div className="text-2xl font-black text-emerald-300 mt-1">{metrics.todayAppointmentsCount}</div>
              <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Bugün planlanan</span>
            </div>

            {/* 9. Aylık Rezervasyon */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/15 p-4 backdrop-blur-md">
              <span className="text-[11px] text-indigo-400 font-semibold block">Aylık Rezervasyon</span>
              <div className="text-2xl font-black text-indigo-300 mt-1">{metrics.monthlyAppointmentsCount}</div>
              <span className="text-[10px] text-indigo-400/80 mt-0.5 block">Bu ayki hacim</span>
            </div>

            {/* 10. Tahmini Aylık Gelir (MRR) */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-slate-900 p-4 backdrop-blur-md shadow-lg shadow-amber-500/10">
              <span className="text-[11px] text-amber-300 font-bold block">Tahmini Aylık Gelir</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {formatCurrency(metrics.monthlyRecurringRevenue)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">MRR (Abonelik)</span>
            </div>
          </div>

          {/* Sector Breakdown & Most Active Businesses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sector Distribution */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
                <span>İşletme Sektör Dağılımı</span>
                <span className="text-xs text-slate-400 font-normal">{metrics.totalBusinesses} işletme</span>
              </h3>

              <div className="space-y-3">
                {SECTORS.map((sec) => {
                  const count = sectorCounts[sec.id] || 0;
                  const pct = metrics.totalBusinesses > 0 ? Math.round((count / metrics.totalBusinesses) * 100) : 0;

                  return (
                    <div key={sec.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{sec.name}</span>
                        <span className="text-slate-400 font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Most Active Businesses */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
                <span>En Aktif İşletmeler</span>
                <span className="text-xs text-slate-400 font-normal">Rezervasyon Hacmine Göre</span>
              </h3>

              <div className="space-y-2.5">
                {topBusinesses.map((b, idx) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <span>{b.name}</span>
                          <SectorBadge sector={b.sector} size="sm" />
                        </div>
                        <span className="text-[11px] text-slate-400">Sahip: {b.user?.name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-indigo-400 text-sm block">
                        {b._count?.appointments || 0} Randevu
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {b._count?.customers || 0} Müşteri
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Registrations & Recent Platform Reservations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Registrations */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
                <span>Son Kayıt Olan İşletmeler</span>
                <span className="text-xs text-amber-400 font-semibold">Yeni Katılanlar</span>
              </h3>

              <div className="space-y-2.5">
                {recentBusinesses.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span>{b.name}</span>
                        <SectorBadge sector={b.sector} size="sm" />
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {b.user?.name} • {b.user?.email}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          b.subscription?.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {b.subscription?.status === "active" ? "Aktif Abone" : "Deneme (Trial)"}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(b.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Platform Reservations */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
                <span>Son Rezervasyonlar (Canlı Akış)</span>
                <span className="text-xs text-emerald-400 font-semibold">Tüm Platform</span>
              </h3>

              <div className="space-y-2.5">
                {recentAppointments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Henüz rezervasyon bulunmuyor.</div>
                ) : (
                  recentAppointments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200 flex items-center gap-2">
                          <span>{a.customerName}</span>
                          <span className="text-indigo-400 font-normal">→ {a.business?.name}</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {a.service?.name} • {a.date} {a.startTime}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-emerald-400 block">
                          {formatCurrency(a.price)}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {a.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2: İŞLETME YÖNETİMİ (BUSINESS MANAGEMENT)
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "businesses" && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="İşletme adı, sahip, e-posta, tel..."
                  value={businessSearch}
                  onChange={(e) => setBusinessSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Sector Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-semibold shrink-0">Sektör:</span>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="w-full sm:w-auto rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="ALL">Tüm Sektörler</option>
                  {SECTORS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
                  statusFilter === "ALL"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "bg-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                Tümü ({businesses.length})
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
                  statusFilter === "ACTIVE"
                    ? "bg-emerald-500 text-slate-950 font-bold"
                    : "bg-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                Aktif ({businesses.filter((b) => b.isActive !== false).length})
              </button>
              <button
                onClick={() => setStatusFilter("PASSIVE")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
                  statusFilter === "PASSIVE"
                    ? "bg-rose-500 text-white font-bold"
                    : "bg-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                Pasif ({businesses.filter((b) => b.isActive === false).length})
              </button>
              <button
                onClick={() => setStatusFilter("TRIAL")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
                  statusFilter === "TRIAL"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "bg-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                Trial ({businesses.filter((b) => b.subscription?.status === "trial").length})
              </button>
              <button
                onClick={() => setStatusFilter("SUB_ACTIVE")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
                  statusFilter === "SUB_ACTIVE"
                    ? "bg-indigo-500 text-white font-bold"
                    : "bg-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                Abonelik Aktif ({businesses.filter((b) => b.subscription?.status === "active").length})
              </button>
              <button
                onClick={() => setStatusFilter("SUB_EXPIRED")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
                  statusFilter === "SUB_EXPIRED"
                    ? "bg-rose-500 text-white font-bold"
                    : "bg-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                Süresi Dolan ({businesses.filter((b) => b.subscription?.status === "expired").length})
              </button>
            </div>
          </div>

          {/* Business Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
            {filteredBusinesses.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Kriterlere uygun işletme bulunamadı.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">İşletme</th>
                      <th className="py-3.5 px-4">Sahibi / E-Posta</th>
                      <th className="py-3.5 px-4">Sektör</th>
                      <th className="py-3.5 px-4">Hacim</th>
                      <th className="py-3.5 px-4">Abonelik</th>
                      <th className="py-3.5 px-4">Durum</th>
                      <th className="py-3.5 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredBusinesses.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                            <span>{b.name}</span>
                            {b.isVerified && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded-md">
                                ✓ Onaylı
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/${b.slug}`}
                            target="_blank"
                            className="text-[11px] text-amber-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>/{b.slug}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-200">{b.user?.name}</div>
                          <div className="text-slate-400 text-[11px]">{b.user?.email}</div>
                          <div className="text-slate-400 text-[10px]">{formatPhoneNumber(b.phone)}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <SectorBadge sector={b.sector} size="sm" />
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">
                            {b._count?.appointments || 0} Randevu
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {b._count?.customers || 0} Müşteri • {b._count?.reviews || 0} Yorum
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.subscription?.status === "active"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : b.subscription?.status === "trial"
                                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {b.subscription?.status || "trial"}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {b.subscription?.monthlyPrice || 89} TL / ay
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() =>
                              handleApiAction({
                                action: "TOGGLE_ACTIVE",
                                businessId: b.id,
                                isActive: b.isActive === false ? true : false,
                              })
                            }
                            className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all ${
                              b.isActive !== false
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-300"
                            }`}
                          >
                            {b.isActive !== false ? "● Aktif" : "○ Pasif"}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedBusiness(b);
                                setDetailTab("info");
                                setNewSector(b.sector);
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>Yönet & Detay</span>
                            </button>

                            <Link
                              href={`/${b.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Public Sayfayı Aç"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 3: FEATURE FLAG YÖNETİMİ (FEATURE FLAGS)
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "features" && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Platform Özellik Bayrakları (Feature Flags)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              İşletmelerin kullanabileceği özellikleri global olarak veya işletme bazında anlık açıp kapatabilirsiniz.
              Tüm değişiklikler doğrudan veritabanına işlenir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureFlags.map((flag) => {
              let enabledCount = 0;
              let disabledCount = 0;
              try {
                if (flag.enabledBusinessIds) enabledCount = JSON.parse(flag.enabledBusinessIds).length;
                if (flag.disabledBusinessIds) disabledCount = JSON.parse(flag.disabledBusinessIds).length;
              } catch {}

              return (
                <div
                  key={flag.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between backdrop-blur-md hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {flag.key}
                      </span>
                      <button
                        onClick={() =>
                          handleApiAction({
                            action: "GLOBAL_FEATURE_TOGGLE",
                            featureKey: flag.key,
                            isEnabled: !flag.isEnabled,
                          })
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          flag.isEnabled
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {flag.isEnabled ? "Global: AÇIK" : "Global: KAPALI"}
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 font-medium mt-2">{flag.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <div>
                      <span>Özel Hariç: </span>
                      <span className="text-rose-400 font-bold">{disabledCount} İşletme</span>
                    </div>
                    <div>
                      <span>Özel Açık: </span>
                      <span className="text-emerald-400 font-bold">{enabledCount} İşletme</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 4: ABONELİK YÖNETİMİ (SUBSCRIPTIONS)
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
              <span className="text-xs text-amber-400 font-semibold block">Deneme (Trial)</span>
              <div className="text-2xl font-black text-amber-300 mt-1">{metrics.trialBusinesses}</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
              <span className="text-xs text-emerald-400 font-semibold block">Aktif Aboneler</span>
              <div className="text-2xl font-black text-emerald-300 mt-1">{metrics.activeSubscriptions}</div>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4">
              <span className="text-xs text-rose-400 font-semibold block">Süresi Dolmuş</span>
              <div className="text-2xl font-black text-rose-300 mt-1">{metrics.expiredSubscriptions}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400 font-semibold block">İptal Edilmiş</span>
              <div className="text-2xl font-black text-slate-300 mt-1">{metrics.cancelledSubscriptions}</div>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">İşletme Abonelik Listesi</h3>
                <p className="text-xs text-slate-400">
                  Deneme sürelerini uzatabilir, manuel aktif edebilir veya özel fiyat tanımlayabilirsiniz.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">İşletme</th>
                    <th className="py-3 px-4">Plan / Durum</th>
                    <th className="py-3 px-4">Trial Bitiş</th>
                    <th className="py-3 px-4">Abonelik Bitiş</th>
                    <th className="py-3 px-4">Aylık Fiyat</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {businesses.map((b) => {
                    const sub = b.subscription;
                    return (
                      <tr key={b.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-100 text-sm block">{b.name}</span>
                          <span className="text-slate-400 text-[11px]">{b.user?.email}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              sub?.status === "active"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : sub?.status === "trial"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            }`}
                          >
                            {sub?.status || "trial"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {sub?.trialEndDate
                            ? new Date(sub.trialEndDate).toLocaleDateString("tr-TR")
                            : "—"}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {sub?.subscriptionEndDate
                            ? new Date(sub.subscriptionEndDate).toLocaleDateString("tr-TR")
                            : "—"}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-400">
                          {formatCurrency(sub?.monthlyPrice || 89)} / ay
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedBusiness(b);
                              setDetailTab("subscription");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                            <span>Düzenle</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 5: AUDIT LOG (DENETİM KAYITLARI)
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <span>Süper Yönetici Denetim Kayıtları (Audit Log)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Yöneticiler tarafından yapılan durum değişiklikleri, süre uzatmaları, abonelik müdahaleleri ve özellik açma/kapama işlemleri şeffaf olarak burada kayıt altındadır.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Henüz kayıtlı bir denetim günlüğü (audit log) bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Yönetici</th>
                      <th className="py-3.5 px-4">İşlem</th>
                      <th className="py-3.5 px-4">Hedef</th>
                      <th className="py-3.5 px-4">Eski Değer</th>
                      <th className="py-3.5 px-4">Yeni Değer</th>
                      <th className="py-3.5 px-4">Detay</th>
                      <th className="py-3.5 px-4 text-right">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-200 block">{log.adminName || "Admin"}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{log.adminEmail}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-200">
                          {log.target}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono">
                            {log.oldValue || "—"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                            {log.newValue || "—"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                          {log.details || "—"}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("tr-TR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 6: TEMA YÖNETİMİ
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "themes" && <AdminThemeManagement />}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 7: İNDİRİM KUPONLARI
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "coupons" && <AdminCoupons notify={showNotification} />}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 8: DESTEK YETKİLİLERİ
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "agents" && <AdminSupportAgents notify={showNotification} />}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 9: PROFİL AYARLARI
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "profile" && (
        <AdminProfileSettings
          admin={adminProfile}
          onProfileUpdated={setAdminProfile}
          notify={showNotification}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          BUSINESS DETAIL & ACTIONS MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {selectedBusiness && (
        <Modal
          isOpen={Boolean(selectedBusiness)}
          onClose={() => setSelectedBusiness(null)}
          title={`İşletme Yönetimi: ${selectedBusiness.name}`}
        >
          <div className="space-y-4 text-xs">
            {/* Modal Internal Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setDetailTab("info")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  detailTab === "info" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Genel Bilgiler
              </button>
              <button
                onClick={() => setDetailTab("subscription")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  detailTab === "subscription" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Abonelik & Fiyat
              </button>
              <button
                onClick={() => setDetailTab("features")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  detailTab === "features" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Özellik Bayrakları
              </button>
              <button
                onClick={() => setDetailTab("sector")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  detailTab === "sector" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Sektör Değiştir
              </button>
            </div>

            {/* TAB: INFO */}
            {detailTab === "info" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Sahibi:</span>
                    <span className="font-semibold text-slate-200">{selectedBusiness.user?.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">E-Posta:</span>
                    <span className="font-semibold text-slate-200">{selectedBusiness.user?.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Telefon:</span>
                    <span className="font-semibold text-slate-200">{selectedBusiness.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Şehir / Adres:</span>
                    <span className="font-semibold text-slate-200">{selectedBusiness.city}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Kayıt Tarihi:</span>
                    <span className="font-semibold text-slate-200">
                      {new Date(selectedBusiness.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Sektör:</span>
                    <SectorBadge sector={selectedBusiness.sector} size="sm" />
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Randevu</span>
                    <span className="font-black text-indigo-400 text-sm">
                      {selectedBusiness._count?.appointments || 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Müşteri</span>
                    <span className="font-black text-emerald-400 text-sm">
                      {selectedBusiness._count?.customers || 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Hizmet</span>
                    <span className="font-black text-amber-400 text-sm">
                      {selectedBusiness._count?.services || 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Yorum</span>
                    <span className="font-black text-rose-400 text-sm">
                      {selectedBusiness._count?.reviews || 0}
                    </span>
                  </div>
                </div>

                {/* Quick Toggle Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() =>
                      handleApiAction({
                        action: "TOGGLE_ACTIVE",
                        businessId: selectedBusiness.id,
                        isActive: selectedBusiness.isActive === false ? true : false,
                      })
                    }
                    className={`py-2.5 px-3 rounded-xl font-bold transition-all ${
                      selectedBusiness.isActive !== false
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                    }`}
                  >
                    {selectedBusiness.isActive !== false ? "İşletmeyi Pasife Al" : "İşletmeyi Aktif Et"}
                  </button>

                  <Link
                    href={`/${selectedBusiness.slug}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-white font-bold"
                  >
                    <span>Public Sayfayı Aç</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* TAB: SUBSCRIPTION */}
            {detailTab === "subscription" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mevcut Durum:</span>
                    <span className="font-bold text-amber-400 uppercase">
                      {selectedBusiness.subscription?.status || "trial"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trial Bitiş:</span>
                    <span className="text-slate-200 font-mono">
                      {selectedBusiness.subscription?.trialEndDate
                        ? new Date(selectedBusiness.subscription.trialEndDate).toLocaleDateString("tr-TR")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Abonelik Bitiş:</span>
                    <span className="text-slate-200 font-mono">
                      {selectedBusiness.subscription?.subscriptionEndDate
                        ? new Date(selectedBusiness.subscription.subscriptionEndDate).toLocaleDateString("tr-TR")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Aylık Fiyat:</span>
                    <span className="text-emerald-400 font-bold">
                      {formatCurrency(selectedBusiness.subscription?.monthlyPrice || 89)} / ay
                    </span>
                  </div>
                </div>

                {/* 1. Trial Uzatma */}
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-2.5">
                  <span className="font-bold text-amber-300 block">Trial Süresini Uzat</span>
                  <div className="flex items-center gap-2">
                    {[7, 14, 30].map((d) => (
                      <button
                        key={d}
                        onClick={() =>
                          handleApiAction({
                            action: "EXTEND_TRIAL",
                            businessId: selectedBusiness.id,
                            days: d,
                          })
                        }
                        className="flex-1 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold"
                      >
                        +{d} Gün
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Manuel Abonelik Aktif Etme */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2.5">
                  <span className="font-bold text-indigo-300 block">Aboneliği Manuel Aktif Et</span>
                  <div className="flex items-center gap-2">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() =>
                          handleApiAction({
                            action: "ACTIVATE_SUBSCRIPTION",
                            businessId: selectedBusiness.id,
                            months: m,
                          })
                        }
                        className="flex-1 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold"
                      >
                        {m} Ay
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Özel Fiyat & Durum Güncelleme */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <span className="font-bold text-slate-200 block">Özel Aylık Fiyat & Durum</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Aylık Fiyat (TL)</label>
                      <input
                        type="number"
                        defaultValue={selectedBusiness.subscription?.monthlyPrice || 89}
                        onChange={(e) => setSubPrice(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Durum</label>
                      <select
                        defaultValue={selectedBusiness.subscription?.status || "trial"}
                        id="modal-sub-status"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100"
                      >
                        <option value="trial">Deneme (trial)</option>
                        <option value="active">Aktif (active)</option>
                        <option value="expired">Süresi Doldu (expired)</option>
                        <option value="cancelled">İptal Edildi (cancelled)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const selectEl = document.getElementById("modal-sub-status") as HTMLSelectElement;
                      handleApiAction({
                        action: "UPDATE_SUBSCRIPTION",
                        businessId: selectedBusiness.id,
                        status: selectEl?.value,
                        monthlyPrice: subPrice,
                      });
                    }}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    Fiyat & Durumu Kaydet
                  </button>
                </div>
              </div>
            )}

            {/* TAB: FEATURES (PER BUSINESS) */}
            {detailTab === "features" && (
              <div className="space-y-3">
                <p className="text-slate-400 text-xs">
                  Aşağıdaki özellikleri bu işletme için özel olarak açıp kapatabilirsiniz:
                </p>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {featureFlags.map((flag) => {
                    const isEnabled = isFeatureEnabledForBusiness(flag.key, selectedBusiness.id);

                    return (
                      <div
                        key={flag.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                      >
                        <div>
                          <span className="font-bold text-slate-200 block text-xs">{flag.key}</span>
                          <span className="text-[10px] text-slate-400 block">{flag.description}</span>
                        </div>

                        <button
                          onClick={() =>
                            handleApiAction({
                              action: "TOGGLE_BUSINESS_FEATURE",
                              businessId: selectedBusiness.id,
                              featureKey: flag.key,
                              enable: !isEnabled,
                            })
                          }
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            isEnabled
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {isEnabled ? "Açık (ON)" : "Kapalı (OFF)"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: SECTOR */}
            {detailTab === "sector" && (
              <div className="space-y-4">
                <p className="text-slate-400 text-xs">
                  İşletmenin sektörünü değiştirdiğinizde, rezervasyon motoru varsayılan ayarları ve temaları güncellenir:
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Yeni Sektör:</label>
                  <select
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-100"
                  >
                    {SECTORS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() =>
                    handleApiAction({
                      action: "CHANGE_SECTOR",
                      businessId: selectedBusiness.id,
                      newSector,
                    })
                  }
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Sektörü Güncelle
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
