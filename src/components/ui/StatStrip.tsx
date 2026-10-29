import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatAccent = "brand" | "blue" | "violet" | "amber";

export interface Stat {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  /** Highlights a metric that needs action (e.g. pending approvals > 0). */
  attention?: boolean;
  /** Recent daily values, oldest first; drawn as a small line next to the number. */
  trend?: { values: number[]; label: string };
  /** Tiles only: the tile's icon and color. */
  icon?: LucideIcon;
  accent?: StatAccent;
}

const ACCENT: Record<StatAccent, { text: string; soft: string; stroke: string; fill: string; dot: string }> = {
  brand: { text: "text-brand", soft: "bg-brand-soft", stroke: "stroke-brand", fill: "fill-brand/10", dot: "fill-brand" },
  blue: { text: "text-blue", soft: "bg-blue-soft", stroke: "stroke-blue", fill: "fill-blue/10", dot: "fill-blue" },
  violet: { text: "text-violet", soft: "bg-violet-soft", stroke: "stroke-violet", fill: "fill-violet/10", dot: "fill-violet" },
  amber: { text: "text-amber", soft: "bg-amber-soft", stroke: "stroke-amber", fill: "fill-amber/10", dot: "fill-amber" },
};

/** Minimal line + soft area for a handful of daily values. */
function Sparkline({ values, label, accent = "brand" }: { values: number[]; label: string; accent?: StatAccent }) {
  if (values.length < 2) return null;
  const w = 88;
  const h = 32;
  const max = Math.max(...values, 1);
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - 3 - (v / max) * (h - 6)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const a = ACCENT[accent];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-[88px] shrink-0 overflow-visible" role="img" aria-label={label}>
      <path d={`${line} L${w},${h} L0,${h} Z`} className={a.fill} />
      <path d={line} className={cn("fill-none", a.stroke)} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.5} className={a.dot} />
    </svg>
  );
}

/**
 * Several metrics. "strip": one surface divided by hairlines. "tiles": separate raised cards, each with
 * its accent icon and a soft glow in the corner, like the mobile app's stat tiles.
 */
export function StatStrip({ stats, variant = "strip" }: { stats: Stat[]; variant?: "strip" | "tiles" }) {
  if (variant === "tiles") {
    return (
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const a = ACCENT[stat.accent ?? "brand"];
          const Icon = stat.icon;
          const body = (
            <>
              <span className={cn("pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-80", a.soft)} aria-hidden="true" />
              <div className="relative flex items-center justify-between gap-2">
                {Icon && (
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-[11px]", a.soft, a.text)} aria-hidden="true">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                )}
                {stat.trend && <Sparkline values={stat.trend.values} label={stat.trend.label} accent={stat.accent} />}
              </div>
              <dd className="relative mt-3 font-display text-[26px] font-extrabold leading-none tracking-[-0.035em] text-ink tabular-nums">
                {stat.value}
              </dd>
              <dt className="relative mt-1.5 text-[13px] font-semibold text-ink">{stat.label}</dt>
              {stat.hint && <dd className="relative mt-0.5 truncate text-xs text-ink-3">{stat.hint}</dd>}
            </>
          );
          const tileClass = "relative block min-w-0 overflow-hidden rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-5";
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className={cn(tileClass, "dash-lift")}>
              {body}
            </Link>
          ) : (
            <div key={stat.label} className={tileClass}>
              {body}
            </div>
          );
        })}
      </dl>
    );
  }

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
