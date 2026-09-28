"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Users2,
  Clock,
  CalendarCheck,
  Zap,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsClientProps {
  business: any;
  appointments: any[];
  customers: any[];
}

export default function AnalyticsClient({
  business,
  appointments,
  customers,
}: AnalyticsClientProps) {
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  // Calculations
  const completed = appointments.filter((a) => a.status === "COMPLETED" || a.status === "CONFIRMED");
  const totalRevenue = completed.reduce((acc, a) => acc + a.price, 0);
  const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;

  // Day distribution
  const daysOfWeek = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const dayCounts: Record<string, number> = {
    Pazartesi: 0, Salı: 0, Çarşamba: 0, Perşembe: 0, Cuma: 0, Cumartesi: 0, Pazar: 0
  };

  appointments.forEach((a) => {
    const d = new Date(a.date);
    const dayName = daysOfWeek[d.getDay()];
    if (dayCounts[dayName] !== undefined) {
      dayCounts[dayName]++;
    }
  });

  const maxDayCount = Math.max(1, ...Object.values(dayCounts));

  // Peak hours distribution (09 to 20)
  const hourCounts: Record<string, number> = {};
  for (let h = 9; h <= 20; h++) {
    const key = `${h.toString().padStart(2, "0")}:00`;
    hourCounts[key] = 0;
  }

  appointments.forEach((a) => {
    const hourPrefix = a.startTime ? a.startTime.split(":")[0] + ":00" : "12:00";
    if (hourCounts[hourPrefix] !== undefined) {
      hourCounts[hourPrefix]++;
    }
  });

  const maxHourCount = Math.max(1, ...Object.values(hourCounts));

  const handleGenerateAiReport = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/ai/generate-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${business.name} (${business.sector}) için işletme büyüme ve yoğun saat optimizasyon analizi`,
          sector: business.sector,
        }),
      });
      const data = await res.json();
      if (data.data?.aiInsights) {
        setAiReport(data.data.aiInsights);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            İstatistikler & Yapay Zeka Analizi
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            İşletmenizin performans metrikleri, yoğun saat dağılımı ve yapay zeka büyüme önerileri.
          </p>
        </div>

        <button
          onClick={handleGenerateAiReport}
          disabled={loadingAi}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loadingAi ? "AI İnceliyor..." : "Yapay Zeka Analizini Çalıştır"}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-medium">Toplam Randevu Geliri</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tamamlanan randevulardan</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-medium">Ortalama Randevu Tutarı (AOV)</span>
          <div className="text-2xl font-extrabold text-indigo-400 mt-2">
            {formatCurrency(avgTicket)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Müşteri sepet büyüklüğü</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-medium">Tekrar Eden Müşteri Oranı</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-2">
            %{customers.length > 0 ? Math.round((customers.filter((c) => c.totalAppointments > 1).length / customers.length) * 100) : 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Müşteri sadakat seviyesi</p>
        </div>
      </div>

      {/* AI Intelligence Report Card */}
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-slate-900/80 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-xl bg-indigo-500/20 p-2 text-indigo-400 border border-indigo-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">RandevuGo AI Büyüme Analizi</h3>
            <span className="text-xs text-indigo-300">Yapay zeka optimizasyon modeli</span>
          </div>
        </div>

        <div className="space-y-4 text-xs mt-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="font-semibold text-slate-200 block mb-1">
              📊 Yoğun Saatler & Talep Tespiti:
            </span>
            <p className="text-slate-300 leading-relaxed">
              {aiReport?.peakHoursAnalysis ||
                "Hafta sonu Cumartesi 13:00 - 18:00 ve hafta içi 17:30 sonrası randevu talebiniz %85'e çıkıyor. Pazartesi ve Salı sabahları ise doluluk %30 seviyesinde kalıyor."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="font-semibold text-slate-200 block mb-1">
              🎯 Aksiyon Alınabilir İpuçları:
            </span>
            {(
              aiReport?.actionableTips || [
                "Hafta ortası sabahları (10:00 - 13:00) için 'Erken Saat Bakım Kampanyası' tanımlayarak boş koltukları doldurun.",
                "En popüler hizmetinizin yanına hızlı bir tamamlayıcı bakım ekleyerek sepet tutarınızı %25 artırabilirsiniz.",
                "WhatsApp ile randevudan 2 saat önce hatırlatma göndererek randevuya gelmeme (no-show) oranını sıfıra yaklaştırın.",
              ]
            ).map((tip: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Days of Week Chart */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Haftalık Talep Dağılımı</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(dayCounts).map(([day, count]) => {
              const pct = Math.round((count / maxDayCount) * 100);
              return (
                <div key={day} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>{day}</span>
                    <span className="font-semibold text-indigo-400">{count} randevu</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                      style={{ width: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Hours Chart */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Günün Saatlerine Göre Yoğunluk</h3>
          </div>

          <div className="grid grid-cols-6 gap-2 text-center text-xs">
            {Object.entries(hourCounts).map(([hour, count]) => {
              const isPeak = count >= maxHourCount && count > 0;
              return (
                <div
                  key={hour}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between h-20 transition-all ${
                    isPeak
                      ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300 font-bold"
                      : "border-slate-800 bg-slate-950/40 text-slate-400"
                  }`}
                >
                  <span className="text-[10px] text-slate-500">{hour}</span>
                  <div className="my-auto font-bold text-base text-slate-200">{count}</div>
                  <span className="text-[9px] uppercase tracking-wider opacity-75">
                    {count === 0 ? "Sakin" : isPeak ? "En Yoğun" : "Normal"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
