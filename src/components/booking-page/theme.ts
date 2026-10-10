import type { CSSProperties } from "react";
import type { ThemeConfig } from "@/lib/themes/types";
import { getContrastRatio, getLuminance, hexToRgb } from "@/lib/themes/utils";

/**
 * The booking page paints with the app's design tokens (bg-surface, text-ink,
 * border-line, bg-brand…). Here those tokens are pointed at the business's chosen
 * theme, so a theme picked in the dashboard recolors the whole page — light or dark —
 * while layout and components stay the same.
 */

const isHex = (v?: string | null): v is string => !!v && /^#[0-9a-f]{6}$/i.test(v);

function mix(a: string, b: string, amount: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  if (!x || !y) return a;
  const ch = (p: number, q: number) => Math.round(p + (q - p) * amount).toString(16).padStart(2, "0");
  return `#${ch(x.r, y.r)}${ch(x.g, y.g)}${ch(x.b, y.b)}`;
}

function rgba(hex: string, alpha: number) {
  const c = hexToRgb(hex) ?? { r: 5, g: 150, b: 105 };
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

function isDarkColor(hex: string) {
  const c = hexToRgb(hex);
  return c ? getLuminance(c.r, c.g, c.b) < 0.3 : false;
}

/** Nudge a color toward black or white until it reaches `ratio` against `bg`. */
function ensureContrast(color: string, bg: string, ratio: number) {
  const toward = isDarkColor(bg) ? "#ffffff" : "#000000";
  let out = color;
  for (let i = 0; i < 10 && getContrastRatio(out, bg) < ratio; i++) out = mix(out, toward, 0.15);
  return out;
}

/** Corner shapes per theme: cards, form controls/tiles, buttons, chips. */
const RADII: Record<string, Record<string, string>> = {
  none: { "--bk-r-card": "0px", "--bk-r-ctl": "0px", "--bk-r-btn": "0px", "--bk-r-pill": "0px" },
  small: { "--bk-r-card": "6px", "--bk-r-ctl": "4px", "--bk-r-btn": "4px", "--bk-r-pill": "4px" },
  medium: { "--bk-r-card": "12px", "--bk-r-ctl": "8px", "--bk-r-btn": "8px", "--bk-r-pill": "9999px" },
  large: { "--bk-r-card": "16px", "--bk-r-ctl": "10px", "--bk-r-btn": "12px", "--bk-r-pill": "9999px" },
  full: { "--bk-r-card": "22px", "--bk-r-ctl": "14px", "--bk-r-btn": "9999px", "--bk-r-pill": "9999px" },
};

/** Heading voice per theme: weight, case and tracking. */
const HEADING_STYLES: Record<string, Record<string, string>> = {
  extraBold: { "--bk-hw": "800", "--bk-ht": "none", "--bk-hls": "-0.025em" },
  bold: { "--bk-hw": "650", "--bk-ht": "none", "--bk-hls": "-0.015em" },
  serif: { "--bk-hw": "600", "--bk-ht": "none", "--bk-hls": "0" },
  uppercase: { "--bk-hw": "700", "--bk-ht": "uppercase", "--bk-hls": "0.03em" },
  clean: { "--bk-hw": "500", "--bk-ht": "none", "--bk-hls": "-0.01em" },
};

export type StorefrontLayout = "centered" | "split" | "banner" | "minimal";

/** How the top of the page is arranged for the theme (photos + business header). */
export function storefrontLayout(theme: ThemeConfig): StorefrontLayout {
  const l = theme.hero.layout;
  return l === "split" || l === "banner" || l === "minimal" ? l : "centered";
}

export interface BookingPalette {
  style: CSSProperties;
  isDark: boolean;
  /** The accent actually used (owner's color when readable, else the theme's). */
  accent: string;
  canvas: string;
  surfaceMuted: string;
  lineStrong: string;
  mutedText: string;
}

/**
 * @param theme       the business's theme (dashboard → Sayfa Düzenleyici → Temalar)
 * @param ownerAccent a custom accent color, used when it stays visible on the theme's surface
 */
export function bookingPalette(theme: ThemeConfig, ownerAccent?: string | null): BookingPalette {
  const c = theme.colors;
  const dark = isDarkColor(c.background);
  const accent =
    isHex(ownerAccent) && getContrastRatio(ownerAccent, c.surface) >= 3 ? ownerAccent : c.primary;

  const semantic = dark
    ? {
        "--rg-pending": "#FBBF24",
        "--rg-pending-soft": "rgba(251, 191, 36, 0.12)",
        "--rg-pending-line": "rgba(251, 191, 36, 0.35)",
        "--rg-danger": "#F87171",
        "--rg-danger-soft": "rgba(248, 113, 113, 0.12)",
        "--rg-danger-line": "rgba(248, 113, 113, 0.35)",
      }
    : {
        "--rg-pending": "#B45309",
        "--rg-pending-soft": "#FFFBEB",
        "--rg-pending-line": "#FDE68A",
        "--rg-danger": "#B91C1C",
        "--rg-danger-soft": "#FEF2F2",
        "--rg-danger-line": "#FECACA",
      };

  const style = {
    "--rg-canvas": c.background,
    "--rg-surface": c.surface,
    "--rg-surface-muted": c.surfaceHover,
    "--rg-line": c.border,
    "--rg-line-strong": c.borderLight,
    "--rg-ink": c.text,
    "--rg-ink-2": mix(c.text, c.mutedText, 0.45),
    "--rg-ink-3": ensureContrast(c.mutedText, c.surface, 4.5),
    "--rg-neutral-soft": c.surfaceHover,
    ...semantic,
    "--rg-brand": accent,
    "--rg-brand-hover": mix(accent, dark ? "#ffffff" : "#000000", 0.12),
    "--rg-brand-soft": rgba(accent, dark ? 0.14 : 0.08),
    "--rg-brand-line": rgba(accent, 0.45),
    "--rg-brand-ink": ensureContrast(accent, c.surface, 4.5),
    // White or near-black, whichever reads better on the accent.
    "--bk-on-brand":
      getContrastRatio("#FFFFFF", accent) >= getContrastRatio("#0F172A", accent) ? "#FFFFFF" : "#0F172A",
    "--bk-heading": /inter/i.test(theme.typography.headingFont) ? "inherit" : theme.typography.headingFont,
    ...HEADING_STYLES[theme.typography.headingStyle] ?? HEADING_STYLES.bold,
    ...RADII[theme.radius] ?? RADII.medium,
    colorScheme: dark ? "dark" : "light",
  } as CSSProperties;

  return {
    style,
    isDark: dark,
    accent,
    canvas: c.background,
    surfaceMuted: c.surfaceHover,
    lineStrong: c.borderLight,
    mutedText: c.mutedText,
  };
}
