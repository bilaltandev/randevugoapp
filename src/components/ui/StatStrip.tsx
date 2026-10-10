import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Stat {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  /** Highlights a metric that needs action (e.g. pending approvals > 0). */
  attention?: boolean;
  /** Recent daily values, oldest first; drawn as a small line next to the number. */
  trend?: { values: number[]; label: string };
}

/** Minimal line + soft area for a handful of daily values. */
function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const w = 88;
  const h = 32;
  const max = Math.max(...values, 1);
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - 3 - (v / max) * (h - 6)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-[88px] shrink-0 overflow-visible" role="img" aria-label={label}>
      <path d={`${line} L${w},${h} L0,${h} Z`} className="fill-brand/10" />
      <path d={line} className="fill-none stroke-brand" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.5} className="fill-brand" />
    </svg>
  );
}

/** Several metrics in one surface, divided by hairlines instead of separate cards. */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-panel border border-line bg-surface shadow-panel lg:grid-cols-4">
      {stats.map((stat, i) => {
        const body = (
          <>
            <dt className="text-[13px] font-medium text-ink-3">{stat.label}</dt>
            <dd className="mt-2 flex items-end justify-between gap-3">
              <span
                className={cn(
                  "font-display text-[28px] font-bold leading-none tracking-[-0.03em] tabular-nums",
                  stat.attention ? "text-pending" : "text-ink"
                )}
              >
                {stat.value}
              </span>
              {stat.trend && <Sparkline values={stat.trend.values} label={stat.trend.label} />}
            </dd>
            {stat.hint && <dd className="mt-2 text-xs text-ink-3 truncate">{stat.hint}</dd>}
          </>
        );
        const cellClass = cn(
          "block min-w-0 px-4 py-4 sm:px-5 sm:py-5 border-line",
          // hairline dividers: 2-col grid on mobile, 4-col on desktop
          i % 2 === 1 && "border-l",
          i >= 2 && "border-t lg:border-t-0",
          i === 2 && "lg:border-l"
        );
        return stat.href ? (
          <Link key={stat.label} href={stat.href} className={cn(cellClass, "transition-colors hover:bg-surface-muted")}>
            {body}
          </Link>
        ) : (
          <div key={stat.label} className={cellClass}>
            {body}
          </div>
        );
      })}
    </dl>
  );
}
