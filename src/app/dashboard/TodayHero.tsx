import React from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, CalendarPlus, CheckCircle2, Hourglass, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Today at a glance on a brand gradient card, with a "done" ring and colored quick actions below. */
export function TodayHero({ total, pending, done }: { total: number; pending: number; done: number }) {
  const share = total ? done / total : 0;
  const R = 38;
  const C = 2 * Math.PI * R;
  const hint = total === 0 ? "Bugün randevu yok" : pending > 0 ? `${pending} tanesi onay bekliyor` : "Hepsi onaylı";

  return (
    <div className="space-y-4">
      <section
        className="relative overflow-hidden rounded-[26px] p-6 text-on-brand shadow-[0_24px_48px_-20px_color-mix(in_srgb,var(--rg-brand)_70%,transparent)] sm:p-7"
        style={{
          backgroundImage: [
            "radial-gradient(70% 90% at 95% 0%, rgba(255,255,255,0.28), transparent 70%)",
            "radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.13) 1px, transparent 1.3px)",
            "linear-gradient(135deg, var(--rg-brand), var(--rg-brand-ink))",
          ].join(", "),
          backgroundSize: "auto, 16px 16px, auto",
        }}
      >
        <div className="flex items-center gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold opacity-85">Bugünkü randevular</p>
            <p className="font-display text-[64px] font-extrabold leading-[1.05] tracking-[-0.05em] tabular-nums">{total}</p>
            <span className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
              {pending > 0 ? <Hourglass className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              <span className="truncate">{hint}</span>
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="relative h-[92px] w-[92px]">
              <svg viewBox="0 0 92 92" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="46" cy="46" r={R} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={9} />
                <circle
                  cx="46"
                  cy="46"
                  r={R}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={9}
                  strokeLinecap="round"
                  strokeDasharray={`${C * share} ${C}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-extrabold tabular-nums">
                {done}/{total}
              </span>
            </div>
            <span className="text-[11px] font-bold opacity-85">Tamamlandı</span>
          </div>
        </div>
      </section>

      <nav className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Hızlı işlemler">
        <Action href="/dashboard/calendar?new=1" icon={CalendarPlus} label="Randevu ekle" tone="brand" />
        <Action href="/dashboard/calendar" icon={Lock} label="Saat kapat" tone="amber" />
        <Action href="/dashboard/calendar" icon={CalendarDays} label="Takvim" tone="blue" />
        <Action href="/dashboard/analytics" icon={BarChart3} label="İstatistikler" tone="violet" />
      </nav>
    </div>
  );
}

const TONES = {
  brand: "bg-brand-soft text-brand border-brand-line",
  amber: "bg-amber-soft text-amber border-amber/30",
  blue: "bg-blue-soft text-blue border-blue/30",
  violet: "bg-violet-soft text-violet border-violet/30",
} as const;

function Action({ href, icon: Icon, label, tone }: { href: string; icon: LucideIcon; label: string; tone: keyof typeof TONES }) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 rounded-panel py-1 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-[20px] border shadow-panel transition-transform group-hover:-translate-y-0.5 sm:h-16 sm:w-16",
          TONES[tone]
        )}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
      </span>
      <span className="truncate text-xs font-semibold text-ink-2 sm:text-[13px]">{label}</span>
    </Link>
  );
}
