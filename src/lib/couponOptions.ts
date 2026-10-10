// Client-safe coupon constants and helpers (no server imports).

export const DEFAULT_MONTHLY_PRICE = 89;
export const COUPON_CODE_PATTERN = /^[A-Z0-9_-]{3,30}$/;
export const MAX_COUPON_DURATION_MONTHS = 12;

/** Upper-cases with the ASCII rules so "hosgeldin" and "HOSGELDIN" match regardless of locale. */
export function normalizeCouponCode(code: unknown): string {
  return typeof code === "string" ? code.trim().toUpperCase() : "";
}

export function applyPercentOff(price: number, percentOff: number): number {
  return Math.round(price * (100 - percentOff)) / 100;
}

export function formatTL(amount: number): string {
  return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}
