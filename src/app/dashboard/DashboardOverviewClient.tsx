"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  CalendarDays,
  Plus,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import { Modal } from "@/components/Modal";

interface DashboardOverviewClientProps {
  businessId: string;
  todayAppointments: any[];
  upcomingAppointments: any[];
  businessSlug: string;
  businessPhone: string;
}

export default function DashboardOverviewClient({
  businessId,
  todayAppointments: initialToday,
  upcomingAppointments: initialUpcoming,
  businessSlug,
  businessPhone,
}: DashboardOverviewClientProps) {
  const [todayAppts, setTodayAppts] = useState(initialToday);
  const [upcomingAppts, setUpcomingAppts] = useState(initialUpcoming);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Status badge style helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">Onaylandı</span>;
      case "COMPLETED":
        return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">Tamamlandı</span>;
      case "CANCELLED":
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">İptal Edildi</span>;
      default:
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">Onay Bekliyor</span>;
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    setLoadingId(appointmentId);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointmentId, status: newStatus }),
      });
      if (res.ok) {
        setTodayAppts((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
        );
        setUpcomingAppts((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Today's Appointments Table */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Bugünkü Randevular</span>
                <span className="rounded-full bg-indigo-500/15 text-indigo-400 px-2 py-0.5 text-xs font-semibold">
                  {todayAppts.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Onaylayabilir veya durumunu güncelleyebilirsiniz
              </p>
            </div>
            <Link
              href="/dashboard/appointments"
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todayAppts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
              <CalendarDays className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              Bugün için planlanmış bir randevu bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppts.map((appt) => (
                <div
                  key={appt.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition-colors hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/80 font-bold text-sm text-indigo-400">
                      {appt.startTime}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-100 text-sm">
                          {appt.customerName}
                        </span>
                        {getStatusBadge(appt.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>{appt.service?.name}</span>
                        <span>•</span>
                        <span>Uzman: {appt.employee?.name}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">{formatCurrency(appt.price)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* WhatsApp message link */}
                    <a
                      href={`https://wa.me/${appt.customerPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      title="Müşteriye WhatsApp'tan Yaz"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>

                    {appt.status === "PENDING" && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}
                        disabled={loadingId === appt.id}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                      >
                        Onayla
                      </button>
                    )}

                    {appt.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, "COMPLETED")}
                        disabled={loadingId === appt.id}
                        className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                      >
                        Tamamlandı
                      </button>
                    )}

                    {appt.status !== "CANCELLED" && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, "CANCELLED")}
                        disabled={loadingId === appt.id}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="İptal Et"
                      >
                        İptal
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-100">Yaklaşan Rezervasyonlar</h3>
            <Link
              href="/dashboard/appointments"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Tüm Liste
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingAppts.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/70 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200 block">{a.customerName}</span>
                  <span className="text-slate-400 text-[11px]">{a.service?.name} • Uzman: {a.employee?.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-indigo-400 block">{a.date}</span>
                  <span className="text-slate-400 text-[11px]">{a.startTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: AI Insights & Quick Shortcuts */}
      <div className="space-y-6">
        {/* AI Business Insights Card */}
        <div className="rounded-3xl border-2 border-[#DDD6FE] dark:border-[#6246EA]/40 bg-gradient-to-br from-[#F5F3FF] via-[#FAF5FF] to-white dark:from-[#130E2E] dark:via-[#0F142A] dark:to-[#080D1B] p-5 sm:p-6 shadow-md shadow-[#6246EA]/10 dark:shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#6246EA]/15 dark:bg-[#6246EA]/25 blur-2xl rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-3.5 relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6246EA] to-[#8C75FF] text-white shadow-md shadow-[#6246EA]/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#111827] dark:text-white truncate">
                  RandevuGo AI Analiz
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00C98D]/15 text-[#00A874] border border-[#00C98D]/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C98D] animate-ping" />
                  Canlı
                </span>
              </div>
              <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-0.5">
                Otomatik İşletme Zekası
              </p>
            </div>
          </div>

          <p className="text-xs text-[#344054] dark:text-slate-200 leading-relaxed mb-4 relative z-10 font-medium">
            Hafta sonu randevu talepleriniz{" "}
            <span className="font-bold text-[#6246EA] dark:text-indigo-400">
              %85 doluluğa
            </span>{" "}
            ulaştı. Boş geçen Salı sabahları için özel promosyon öneriliyor.
          </p>

          {/* AI Recommendation Box */}
          <div className="space-y-2.5 pt-3 border-t border-[#E4E7EC] dark:border-slate-800/80 text-xs relative z-10">
            <div className="p-3 rounded-2xl bg-white dark:bg-[#151D36] border border-[#E0DDFE] dark:border-[#6246EA]/30 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[#6246EA] dark:text-indigo-300 flex items-center gap-1.5 text-xs">
                  <span>💡</span>
                  <span>AI Büyüme Tavsiyesi:</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  +%24 Ciro
                </span>
              </div>
              <p className="text-[#475467] dark:text-slate-300 text-[11px] leading-relaxed">
                Saç kesimi alan müşterilerin %60'ı sakal tıraşını da seçiyor. İkili paket tanımlayarak cironuzu artırabilirsiniz.
              </p>
            </div>
          </div>

          {/* Action CTA */}
          <Link
            href="/dashboard/analytics"
            className="mt-4 inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-[#6246EA] to-[#7B61FF] hover:from-[#5337D9] hover:to-[#6C4FF5] py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-[#6246EA]/25 transition-all active:scale-95 relative z-10"
          >
            <span>Detaylı AI Raporunu Gör</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Action Buttons Card */}
        <div className="rounded-3xl border border-[#E4E7EC] dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 mb-3">
            Hızlı İşlemler
          </h3>

          <Link
            href="/dashboard/calendar"
            className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FC] dark:bg-slate-950/40 border border-[#E4E7EC] dark:border-slate-800 hover:border-[#6246EA]/40 hover:bg-[#F4F3FF] dark:hover:bg-slate-900 transition-colors text-xs font-semibold text-[#344054] dark:text-slate-200"
          >
            <span>Saat Kapat / Mola Ekle</span>
            <span className="text-[#6246EA]">→</span>
          </Link>

          <Link
            href="/dashboard/services"
            className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FC] dark:bg-slate-950/40 border border-[#E4E7EC] dark:border-slate-800 hover:border-[#6246EA]/40 hover:bg-[#F4F3FF] dark:hover:bg-slate-900 transition-colors text-xs font-semibold text-[#344054] dark:text-slate-200"
          >
            <span>Yeni Hizmet Ekle</span>
            <span className="text-[#6246EA]">→</span>
          </Link>

          <Link
            href="/dashboard/page-builder"
            className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FC] dark:bg-slate-950/40 border border-[#E4E7EC] dark:border-slate-800 hover:border-[#6246EA]/40 hover:bg-[#F4F3FF] dark:hover:bg-slate-900 transition-colors text-xs font-semibold text-[#344054] dark:text-slate-200"
          >
            <span>Sayfa Tasarımını Düzenle</span>
            <span className="text-[#6246EA]">→</span>
          </Link>

          <Link
            href="/dashboard/subscription"
            className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FC] dark:bg-slate-950/40 border border-[#E4E7EC] dark:border-slate-800 hover:border-[#6246EA]/40 hover:bg-[#F4F3FF] dark:hover:bg-slate-900 transition-colors text-xs font-semibold text-[#344054] dark:text-slate-200"
          >
            <span>Abonelik & Ödeme Yönetimi</span>
            <span className="text-[#6246EA]">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
