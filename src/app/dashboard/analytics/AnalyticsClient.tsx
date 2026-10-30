"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

const DAY_SHORT: Record<string, string> = { Pazartesi: "Pzt", Salı: "Sal", Çarşamba: "Çar", Perşembe: "Per", Cuma: "Cum", Cumartesi: "Cmt", Pazar: "Paz" };

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

  const repeatRate =
    customers.length > 0
      ? Math.round((customers.filter((c) => c.totalAppointments > 1).length / customers.length) * 100)
      : 0;

  const tips: string[] = aiReport?.actionableTips || [
    "Hafta ortası sabahları (10:00 - 13:00) için 'Erken Saat Bakım Kampanyası' tanımlayarak boş koltukları doldurun.",
    "En popüler hizmetinizin yanına hızlı bir tamamlayıcı bakım ekleyerek sepet tutarınızı %25 artırabilirsiniz.",
    "WhatsApp ile randevudan 2 saat önce hatırlatma göndererek randevuya gelmeme (no-show) oranını sıfıra yaklaştırın.",
  ];

  const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  const hasData = appointments.length > 0;

  // Most booked services, from the bookings themselves.
  const serviceCounts = new Map<string, number>();
  appointments.forEach((a) => {
    if (a.service?.name) serviceCounts.set(a.service.name, (serviceCounts.get(a.service.name) ?? 0) + 1);
  });
  const topServices = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topServiceMax = topServices[0]?.[1] ?? 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="İstatistikler"
        actions={
          <Button onClick={handleGenerateAiReport} disabled={loadingAi}>
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            {loadingAi ? "Analiz ediliyor..." : "Yapay zeka analizi"}
          </Button>
        }
      />

      {/* Highlights: one plain sentence first, like the Health app's summary */}
      <section className="dash-widget dash-widget-brand" aria-label="Öne çıkanlar">
        <p className="text-[13px] font-medium opacity-80">Öne çıkanlar</p>
        <p className="mt-2 max-w-3xl font-display text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-[1.2] tracking-[-0.03em]">
          {hasData
            ? `En yoğun gününüz ${peakDay[0]}, en yoğun saatiniz ${peakHour[0]}. Müşterilerinizin %${repeatRate} kadarı tekrar geliyor.`
            : "İlk randevularınız geldiğinde işletmenizin özeti burada görünecek."}
        </p>
      </section>

      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Toplam gelir", value: totalRevenue, format: formatCurrency, hint: "Onaylanan ve tamamlanan" },
          { label: "Ortalama tutar", value: avgTicket, format: formatCurrency, hint: "Randevu başına" },
          { label: "Toplam randevu", value: appointments.length, format: String, hint: `${completed.length} onaylı/tamamlanan` },
          { label: "Tekrar gelen", value: repeatRate, format: (n: number) => `%${n}`, hint: `${customers.length} müşteri içinde` },
        ].map((stat) => (
          <div key={stat.label} className="dash-widget">
            <dt className="text-[13px] font-medium text-ink-3">{stat.label}</dt>
            <dd className="mt-1.5 truncate font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">
              <AnimatedNumber value={stat.value} format={stat.format} />
            </dd>
            <dd className="mt-2 truncate text-[13px] text-ink-3">{stat.hint}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="dash-widget" aria-label="Güne göre randevu">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Günler</h2>
          <p className="text-[13px] text-ink-3">Güne göre randevu sayısı</p>
          <BarChart bars={Object.entries(dayCounts).map(([day, value]) => ({ key: day, label: DAY_SHORT[day], value, title: `${day}: ${value} randevu` }))} />
        </section>

        <section className="dash-widget" aria-label="Saate göre randevu">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Saatler</h2>
          <p className="text-[13px] text-ink-3">Başlangıç saatine göre randevu sayısı</p>
          <BarChart bars={Object.entries(hourCounts).map(([hour, value]) => ({ key: hour, label: hour.slice(0, 2), value, title: `${hour}: ${value} randevu` }))} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="dash-widget" aria-label="En çok tercih edilen hizmetler">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">En çok tercih edilenler</h2>
          {topServices.length === 0 ? (
            <p className="mt-2 text-sm text-ink-3">Henüz veri yok.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {topServices.map(([name, count]) => (
                <li key={name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-ink">{name}</span>
                    <span className="font-medium text-ink-2 tabular-nums">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(count / topServiceMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="dash-widget" aria-label="Büyüme önerileri">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Büyüme önerileri</h2>
          <p className="text-[13px] text-ink-3">{aiReport ? "Yapay zeka analizinden" : "Genel öneriler. Kişisel analiz için yukarıdan başlatın."}</p>
          {aiReport?.peakHoursAnalysis && <p className="mt-3 text-sm leading-relaxed text-ink-2">{aiReport.peakHoursAnalysis}</p>}
          <ul className="ios-list mt-2 [--ios-inset:26px]">
            {tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2.5 py-2.5 text-sm leading-relaxed text-ink-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** Rounded columns in one color; the busiest stands out, the rest stay quiet. */
function BarChart({ bars }: { bars: { key: string; label: string; value: number; title: string }[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="mt-5">
      <div className="flex h-40 items-end gap-1.5 sm:gap-2" role="list">
        {bars.map((bar) => {
          const peak = bar.value === max && bar.value > 0;
          return (
            <div key={bar.key} role="listitem" title={bar.title} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className={cn("text-[11px] tabular-nums", peak ? "font-semibold text-ink" : "text-ink-3")}>{bar.value > 0 ? bar.value : ""}</span>
              <span
                className={cn("dash-bar w-full max-w-7 rounded-full", peak ? "bg-brand" : "bg-brand/25")}
                style={{ height: bar.value > 0 ? `${Math.max(6, (bar.value / max) * 82)}%` : "6px" }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {bars.map((bar) => (
          <span key={bar.key} className="flex-1 truncate text-center text-[11px] text-ink-3">
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Counts up from zero once. Starts on the final value, so without JS timing it simply shows the number. */
function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min((now - start) / 800, 1);
      setShown(value * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{format(Number.isInteger(value) ? Math.round(shown) : shown)}</>;
}
