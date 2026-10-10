import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-(color:--bk-on-brand) hover:bg-brand-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-muted",
  ghost: "text-ink-2 hover:bg-surface-muted hover:text-ink",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

/** Theme-driven heading voice (font, weight, case, tracking — see theme.ts). */
export const headingCls =
  "font-(family-name:--bk-heading) [font-weight:var(--bk-hw)] [text-transform:var(--bk-ht)] [letter-spacing:var(--bk-hls)]";

/** Focus ring shared by every interactive element on the page. */
export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function btn(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-(--bk-r-btn) font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
    focusRing,
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

/** Selectable tile (day, time, staff…): one look for picked vs available. */
export function choice(selected: boolean, className?: string) {
  return cn(
    "rounded-(--bk-r-ctl) border text-left transition-colors",
    focusRing,
    selected
      ? "border-brand bg-brand-soft text-ink ring-1 ring-brand"
      : "border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-muted",
    className
  );
}

export const inputCls = cn(
  "h-11 w-full rounded-(--bk-r-ctl) border border-line-strong bg-surface px-3 text-base text-ink placeholder:text-ink-3 transition-colors sm:text-sm",
  "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
);

export function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`5 üzerinden ${rating}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(cls, s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-line text-line-strong")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function SectionTitle({ id, children, aside }: { id?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <h2 id={id} className={cn(headingCls, "text-xl text-ink sm:text-2xl")}>
        {children}
      </h2>
      {aside}
    </div>
  );
}

export function Initial({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn("flex items-center justify-center bg-surface-muted font-semibold text-ink-2", className)}
      aria-hidden="true"
    >
      {name.trim().slice(0, 1).toLocaleUpperCase("tr-TR") || "?"}
    </span>
  );
}
