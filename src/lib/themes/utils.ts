import { ThemeConfig, ThemeOverrides } from "./types";

/**
 * Convert Hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const sanitized = hex.replace("#", "").trim();
  if (sanitized.length === 3) {
    const r = parseInt(sanitized[0] + sanitized[0], 16);
    const g = parseInt(sanitized[1] + sanitized[1], 16);
    const b = parseInt(sanitized[2] + sanitized[2], 16);
    return { r, g, b };
  }
  if (sanitized.length === 6) {
    const r = parseInt(sanitized.substring(0, 2), 16);
    const g = parseInt(sanitized.substring(2, 4), 16);
    const b = parseInt(sanitized.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

/**
 * Relative Luminance according to WCAG 2.1
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate Contrast Ratio between two hex colors (e.g. 4.5:1 is WCAG AA for normal text)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Evaluates whether a primary color is contrast safe against a background
 */
export function checkContrastSafety(
  primaryHex: string,
  backgroundHex: string
): { isSafe: boolean; ratio: number; message: string } {
  const ratio = parseFloat(getContrastRatio(primaryHex, backgroundHex).toFixed(2));
  if (ratio >= 4.5) {
    return {
      isSafe: true,
      ratio,
      message: `Mükemmel kontrast oranı (${ratio}:1). Okunabilirlik çok yüksek.`,
    };
  }
  if (ratio >= 3.0) {
    return {
      isSafe: true,
      ratio,
      message: `Yeterli kontrast oranı (${ratio}:1). Butonlar ve büyük başlıklar için uygun.`,
    };
  }
  return {
    isSafe: false,
    ratio,
    message: `Düşük kontrast (${ratio}:1). Bu renk arka planda zor okunabilir, daha canlı veya zıt bir ton seçin.`,
  };
}

/**
 * Merge theme configuration with business owner overrides
 */
export function mergeThemeWithOverrides(
  theme: ThemeConfig,
  overrides?: ThemeOverrides | null
): ThemeConfig {
  if (!overrides) return theme;

  const cloned = JSON.parse(JSON.stringify(theme)) as ThemeConfig;

  if (overrides.primaryColor) {
    cloned.colors.primary = overrides.primaryColor;
    cloned.colors.primaryHover = overrides.primaryColor;
    cloned.colors.ring = overrides.primaryColor;
    cloned.colors.badgeText = overrides.primaryColor;
    const rgb = hexToRgb(overrides.primaryColor);
    if (rgb) {
      cloned.colors.accentGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.16)`;
      cloned.colors.badgeBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;
    }
  }

  if (overrides.heroLayout) {
    cloned.hero.layout = overrides.heroLayout;
  }

  return cloned;
}

/**
 * Returns the appropriate text color (#FFFFFF or #0F172A) for a button
 * whose background is the given hex color, based on WCAG luminance.
 */
export function getButtonTextColor(primaryHex: string): string {
  const rgb = hexToRgb(primaryHex);
  if (!rgb) return "#FFFFFF";
  const lum = getLuminance(rgb.r, rgb.g, rgb.b);
  // If the color is bright (luminance > 0.35), use dark text; otherwise use white
  return lum > 0.35 ? "#0F172A" : "#FFFFFF";
}

/**
 * Radius helper classes
 */
export function getRadiusClass(radius: ThemeConfig["radius"]): {
  card: string;
  button: string;
  badge: string;
  input: string;
} {
  switch (radius) {
    case "none":
      return { card: "rounded-none", button: "rounded-none", badge: "rounded-none", input: "rounded-none" };
    case "small":
      return { card: "rounded-lg", button: "rounded-md", badge: "rounded-md", input: "rounded-md" };
    case "medium":
      return { card: "rounded-2xl", button: "rounded-xl", badge: "rounded-lg", input: "rounded-xl" };
    case "large":
      return { card: "rounded-3xl", button: "rounded-2xl", badge: "rounded-xl", input: "rounded-xl" };
    case "full":
      return { card: "rounded-3xl", button: "rounded-full", badge: "rounded-full", input: "rounded-2xl" };
    default:
      return { card: "rounded-2xl", button: "rounded-xl", badge: "rounded-lg", input: "rounded-xl" };
  }
}
