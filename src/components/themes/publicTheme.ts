import { useSyncExternalStore, type CSSProperties } from "react";

/** The subset of theme colors the public booking page paints with. */
export interface PublicThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  primary: string;
  text: string;
  mutedText: string;
  border: string;
  borderLight: string;
  badgeBg: string;
  badgeText: string;
}

/**
 * Exposes the business's theme as CSS variables so markup can use plain
 * Tailwind classes (see `pt`) instead of repeating inline styles.
 */
export function publicThemeVars(colors: PublicThemeColors, onPrimary: string, isLight: boolean): CSSProperties {
  return {
    "--t-bg": colors.background,
    "--t-surface": colors.surface,
    "--t-surface-2": colors.surfaceHover,
    "--t-primary": colors.primary,
    "--t-on-primary": onPrimary,
    "--t-text": colors.text,
    "--t-muted": colors.mutedText,
    "--t-border": colors.border,
    "--t-border-2": colors.borderLight,
    "--t-badge-bg": colors.badgeBg,
    "--t-badge-text": colors.badgeText,
    // Fixed status hues, tuned for the theme's light or dark surface.
    "--t-success": isLight ? "#15803D" : "#4ADE80",
    "--t-success-bg": isLight ? "rgba(22,163,74,0.08)" : "rgba(74,222,128,0.10)",
    "--t-warning": isLight ? "#B45309" : "#FCD34D",
    "--t-warning-bg": isLight ? "rgba(217,119,6,0.08)" : "rgba(252,211,77,0.10)",
    "--t-danger": isLight ? "#B91C1C" : "#FCA5A5",
    "--t-danger-bg": isLight ? "rgba(220,38,38,0.07)" : "rgba(248,113,113,0.10)",
    colorScheme: isLight ? "light" : "dark",
  } as CSSProperties;
}

/** Class names bound to the variables above. */
export const pt = {
  page: "bg-(color:--t-bg) text-(color:--t-text)",
  surface: "bg-(color:--t-surface)",
  surface2: "bg-(color:--t-surface-2)",
  text: "text-(color:--t-text)",
  muted: "text-(color:--t-muted)",
  accent: "text-(color:--t-primary)",
  border: "border-(color:--t-border)",
  border2: "border-(color:--t-border-2)",
  divide: "divide-(color:--t-border)",
  primaryBtn:
    "bg-(color:--t-primary) text-(color:--t-on-primary) font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
  secondaryBtn:
    "border border-(color:--t-border-2) bg-(color:--t-surface) text-(color:--t-text) font-medium transition-colors hover:bg-(color:--t-surface-2) disabled:cursor-not-allowed disabled:opacity-40",
  selected: "border-(color:--t-primary) bg-(color:--t-badge-bg)",
  focus:
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--t-primary)",
  input:
    "w-full border border-(color:--t-border-2) bg-(color:--t-surface) px-3 text-base text-(color:--t-text) placeholder:text-(color:--t-muted) placeholder:opacity-70 transition-colors focus:border-(color:--t-primary) focus:outline-none sm:text-sm",
};

/** Theme fonts reference Inter, which the app doesn't load; fall back to the app font instead. */
export function themeFont(font?: string): string | undefined {
  if (!font || /inter/i.test(font)) return undefined;
  return font;
}

const noopSubscribe = () => () => {};

/** Today's "YYYY-MM-DD" in the visitor's timezone; "" during server render so hydration matches. */
export function useTodayKey(): string {
  return useSyncExternalStore(noopSubscribe, () => toDateKey(new Date()), () => "");
}

/** "YYYY-MM-DD" for a local date (no UTC shift). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Long Turkish date for a "YYYY-MM-DD" key, e.g. "Salı, 14 Ekim". */
export function formatDateKey(key: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return new Date(y, m - 1, d).toLocaleDateString("tr-TR", opts);
}
