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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SectorBadge } from "@/components/SectorBadge";
import { AdminThemeManagement } from "@/components/admin/AdminThemeManagement";

interface AdminClientProps {
  initialBusinesses: any[];
  metrics: {
    totalBusinesses: number;
    totalAppointments: number;
    activeSubscriptions: number;
    trialBusinesses: number;
    monthlyRecurringRevenue: number;
    totalGmv: number;
  };
  adminUser: any;
}

export default function AdminClient({
  initialBusinesses,
  metrics,
  adminUser,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<"businesses" | "themes">("businesses");
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleVerify = async (businessId: string, currentVal: boolean) => {
    setLoadingId(businessId);
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, isVerified: !currentVal }),
      });
      if (res.ok) {
        setBusinesses((prev) =>
          prev.map((b) => (b.id === businessId ? { ...b, isVerified: !currentVal } : b))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateSubscriptionStatus = async (businessId: string, newStatus: string) => {
    setLoadingId(businessId);
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, subscriptionStatus: newStatus }),
      });
      if (res.ok) {
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === businessId
              ? { ...b, subscription: { ...b.subscription, status: newStatus } }
              : b
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Admin Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>RandevuGo Süper Yönetici Paneli</span>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                ROOT ADMIN
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Giriş yapan: {adminUser.name} ({adminUser.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>İşletme Paneline Dön</span>
          </Link>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("businesses")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "businesses"
              ? "bg-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>İşletmeler & Finans</span>
        </button>

        <button
          onClick={() => setActiveTab("themes")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "themes"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Tema Yönetimi & Dağıtımı</span>
          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300 ml-1">
            8 Hazır Tema
          </span>
        </button>
      </div>

      {activeTab === "themes" ? (
        <AdminThemeManagement />
      ) : (
        <>
          {/* Platform KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] text-slate-400 font-medium">Toplam İşletme</span>
              <div className="text-xl font-extrabold text-slate-100 mt-1">{metrics.totalBusinesses}</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] text-slate-400 font-medium">Toplam Randevu</span>
              <div className="text-xl font-extrabold text-indigo-400 mt-1">{metrics.totalAppointments}</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] text-slate-400 font-medium">Aylık MRR (Gelir)</span>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {formatCurrency(metrics.monthlyRecurringRevenue)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] text-slate-400 font-medium">Aktif Abone</span>
              <div className="text-xl font-extrabold text-emerald-300 mt-1">{metrics.activeSubscriptions}</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] text-slate-400 font-medium">Deneme Sürümünde</span>
              <div className="text-xl font-extrabold text-amber-400 mt-1">{metrics.trialBusinesses}</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] text-slate-400 font-medium">İşletmelerin GMV</span>
              <div className="text-xl font-extrabold text-slate-100 mt-1">{formatCurrency(metrics.totalGmv)}</div>
            </div>
          </div>

          {/* Businesses Management Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-100">Kayıtlı İşletmeler</h2>
                <p className="text-xs text-slate-400">
                  Platformdaki tüm işletmeleri listeleyin, onay durumunu ve aboneliklerini yönetin.
                </p>
              </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="İşletme adı, slug veya e-posta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">İşletme & URL</th>
                <th className="py-3 px-4">Sahibi / E-Posta</th>
                <th className="py-3 px-4">Sektör</th>
                <th className="py-3 px-4">Randevu Sayısı</th>
                <th className="py-3 px-4">Abonelik Durumu</th>
                <th className="py-3 px-4">Onay Rozeti</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                      <span>{b.name}</span>
                    </div>
                    <Link
                      href={`/${b.slug}`}
                      target="_blank"
                      className="text-[11px] text-indigo-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>/{b.slug}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{b.user?.name}</div>
                    <div className="text-slate-400 text-[11px]">{b.user?.email}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <SectorBadge sector={b.sector} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    {b._count?.appointments || 0} adet
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={b.subscription?.status || "trial"}
                      disabled={loadingId === b.id}
                      onChange={(e) => handleUpdateSubscriptionStatus(b.id, e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="trial">Deneme (Trial)</option>
                      <option value="active">Pro Aktif (89 TL)</option>
                      <option value="expired">Süresi Doldu</option>
                      <option value="cancelled">İptal Edildi</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleVerify(b.id, b.isVerified)}
                      disabled={loadingId === b.id}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                        b.isVerified
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {b.isVerified ? "✓ Onaylı" : "Onaysız"}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/${b.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <span>İncele</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}
</div>
);
}
