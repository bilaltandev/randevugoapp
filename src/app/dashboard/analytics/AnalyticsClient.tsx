"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { StatStrip } from "@/components/ui/StatStrip";

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

  return (
    <div className="space-y-5">
      <PageHeader
        accent="amber"
        title="İstatistikler"
        description="Performans metrikleri, yoğun gün ve saat dağılımı, büyüme önerileri."
        actions={
          <Button onClick={handleGenerateAiReport} disabled={loadingAi}>
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            {loadingAi ? "Analiz ediliyor..." : "Yapay zeka analizi"}
          </Button>
        }
      />

      <StatStrip
        stats={[
          { label: "Toplam gelir", value: formatCurrency(totalRevenue), hint: "Onaylanan ve tamamlanan" },
          { label: "Ortalama randevu tutarı", value: formatCurrency(avgTicket), hint: "Randevu başına" },
          { label: "Toplam randevu", value: appointments.length, hint: `${completed.length} onaylı/tamamlanan` },
          { label: "Tekrar gelen müşteri", value: `%${repeatRate}`, hint: `${customers.length} müşteri içinde` },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Days of week: horizontal bars, single series */}
        <Panel title="Haftalık talep dağılımı" description="Güne göre randevu sayısı">
          <ul className="space-y-2.5">
            {Object.entries(dayCounts).map(([day, count]) => {
              const pct = (count / maxDayCount) * 100;
              return (
                <li key={day} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 text-sm" title={`${day}: ${count} randevu`}>
                  <span className="text-ink-2">{day}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{ width: count > 0 ? `${Math.max(2, pct)}%` : 0 }}
                    />
                  </span>
                  <span className="text-right tabular-nums text-ink">{count}</span>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Hours: column chart, peak labelled */}
        <Panel title="Saatlere göre yoğunluk" description="Başlangıç saatine göre randevu sayısı">
          <div className="flex h-44 items-end gap-1.5" role="list">
            {Object.entries(hourCounts).map(([hour, count]) => {
              const isPeak = count >= maxHourCount && count > 0;
              const pct = (count / maxHourCount) * 100;
              return (
                <div
                  key={hour}
                  role="listitem"
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
                  title={`${hour}: ${count} randevu`}
                >
                  <span className={cn("text-xs tabular-nums", isPeak ? "font-medium text-ink" : "text-ink-3")}>
                    {count > 0 ? count : ""}
                  </span>
                  <span
                    className={cn(
                      "w-full rounded-t-[4px] transition-colors",
                      count > 0 ? (isPeak ? "bg-brand" : "bg-brand/45 group-hover:bg-brand/70") : "bg-surface-muted"
                    )}
                    style={{ height: count > 0 ? `${Math.max(4, pct * 0.8)}%` : "2px" }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5 border-t border-line pt-2">
            {Object.keys(hourCounts).map((hour) => (
              <span key={hour} className="flex-1 text-center text-[10px] tabular-nums text-ink-3 sm:text-xs">
                {hour.slice(0, 2)}
              </span>
            ))}
          </div>
        </Panel>
      </div>

      {/* Growth insights */}
      <Panel
        title="Büyüme önerileri"
        description={aiReport ? "Yapay zeka analizinden" : "Genel öneriler · kişisel analiz için “Yapay zeka analizi”ni çalıştırın"}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-ink">Yoğun saatler ve talep</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">
              {aiReport?.peakHoursAnalysis ||
                "Hafta sonu Cumartesi 13:00 - 18:00 ve hafta içi 17:30 sonrası randevu talebiniz %85'e çıkıyor. Pazartesi ve Salı sabahları ise doluluk %30 seviyesinde kalıyor."}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-ink">Uygulanabilir öneriler</h3>
            <ul className="mt-2 space-y-2">
              {tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-ink-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}
