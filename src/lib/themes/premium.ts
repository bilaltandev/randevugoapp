import { subscriptionAccess } from "@/lib/subscriptionAccess";
import { getThemeConfig } from "./registry";

export const PREMIUM_THEME_REQUIRED = "PREMIUM_THEME_REQUIRED";

type Subscription = Parameters<typeof subscriptionAccess>[0];

export function isPremiumTheme(themeId?: string | null): boolean {
  return !!themeId && getThemeConfig(themeId).id === themeId && !!getThemeConfig(themeId).isPremium;
}

/** Person and Team, plus trials still running. The free tier previews premium themes but can't apply them. */
export function canUsePremiumThemes(subscription: Subscription, now = new Date()): boolean {
  const access = subscriptionAccess(subscription, now);
  return access.active && access.kind !== "free";
}

/** The theme a business's page may show: a premium theme falls back to its free sibling once the plan ends. */
export function themeForPlan(themeId: string, subscription: Subscription, now = new Date()): string {
  if (!isPremiumTheme(themeId) || canUsePremiumThemes(subscription, now)) return themeId;
  return getThemeConfig(themeId).fallbackThemeId ?? "premium-dark";
}
