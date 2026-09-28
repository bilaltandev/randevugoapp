"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";

interface SubscriptionAlertProps {
  status?: string;
  daysRemaining?: number;
  trialEndDate?: string;
}

export function SubscriptionAlert({
  status = "trial",
  daysRemaining = 3,
}: SubscriptionAlertProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleQuickUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "PayTR", planType: "PRO" }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Aboneliğiniz 89 TL / Ay üzerinden başarıyla aktif edildi!");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpgrading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="text-sm font-medium">{successMsg}</span>
      </div>
    );
  }

  if (status === "expired" || status === "cancelled") {
    return (
      <div className="mb-6 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 to-slate-900 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-500/20 p-2 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-rose-200">
                Abonelik Süreniz Sona Erdi! (Panel Sınırlandırıldı)
              </h4>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Müşterileriniz şu an randevu oluşturamıyor. Kesintisiz hizmet için aylık 89 TL ile devam edin.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleQuickUpgrade}
              disabled={upgrading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 hover:opacity-95 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              {upgrading ? "İşleniyor..." : "Aboneliği Başlat (89 TL / Ay)"}
            </button>
            <Link
              href="/dashboard/subscription"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Detaylar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "trial") {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/80 dark:bg-gradient-to-r dark:from-amber-950/20 dark:to-slate-900/80 p-4 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-400/20">
                  Ücretsiz Deneme
                </span>
                <span className="text-sm font-semibold text-[#111827] dark:text-slate-200">
                  {daysRemaining > 0
                    ? `Deneme sürenizin bitmesine ${daysRemaining} gün kaldı.`
                    : "Deneme süreniz bugün sona eriyor."}
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
                Tüm SaaS özellikleri (Rezervasyon motoru, sayfa düzenleyici, çalışan yönetimi) aktif durumda.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleQuickUpgrade}
              disabled={upgrading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-[#6246EA] hover:bg-[#5339d1] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#6246EA]/25 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {upgrading ? "Aktif Ediliyor..." : "Pro'ya Geç (89 TL / Ay)"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
