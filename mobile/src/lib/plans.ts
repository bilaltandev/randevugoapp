import type { BillingPeriod, SubscriptionInfo } from '@/api/panel';
import type { Plan } from '@/api/business';
import { t } from '@/i18n';

// Mirrors src/lib/plans.ts on the server. Prices come from the API (`prices`); these are only a fallback
// for servers that don't send them yet.
const LIST_PRICES: Record<Plan, Record<BillingPeriod, number>> = {
  PERSON: { MONTHLY: 0.99, YEARLY: 7.99 },
  TEAM: { MONTHLY: 1.99, YEARLY: 15.99 },
};

export const BILLING_PERIODS: BillingPeriod[] = ['MONTHLY', 'YEARLY'];

export const periodName = (period: BillingPeriod) => (period === 'YEARLY' ? t('Yıllık') : t('Aylık'));

/** "/ ay" or "/ yıl" after a price. */
export const periodSuffix = (period: BillingPeriod) => (period === 'YEARLY' ? t('/ yıl') : t('/ ay'));

/** "$1.99" */
export const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;

/** "1.234,56 TL" */
export const formatTry = (amount: number) =>
  `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;

/** The fixed TL price, or null when the server sent a custom USD price (or none: an older server). */
export const priceTryFor = (info: SubscriptionInfo, plan: Plan, period: BillingPeriod) => info.pricesTry?.[plan]?.[period] ?? null;

export function priceFor(info: SubscriptionInfo, plan: Plan, period: BillingPeriod): number {
  return info.prices?.[plan]?.[period] ?? LIST_PRICES[plan][period];
}

/** "49 TL", or dollars for a custom price. */
export function priceLabel(info: SubscriptionInfo, plan: Plan, period: BillingPeriod, percentOff = 0): string {
  const inTry = priceTryFor(info, plan, period);
  const price = inTry ?? priceFor(info, plan, period);
  const amount = percentOff ? Math.round(price * (100 - percentOff)) / 100 : price;
  return inTry !== null ? `${amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL` : formatUsd(amount);
}

/** What the business pays now, in TL when it's a list price. */
export function currentPriceLabel(info: SubscriptionInfo): string {
  return priceLabel(info, info.plan === 'TEAM' ? 'TEAM' : 'PERSON', info.billingPeriod ?? 'MONTHLY');
}

/** Yearly discount against twelve monthly payments, in whole percent. */
export function yearlySaving(info: SubscriptionInfo, plan: Plan): number {
  const twelve = priceFor(info, plan, 'MONTHLY') * 12;
  return Math.round(((twelve - priceFor(info, plan, 'YEARLY')) / twelve) * 100);
}

/** TL to transfer for a dollar amount: rounded up to the kuruş, same as the server. */
export const usdToTry = (usd: number, rate: number) => Math.ceil(usd * rate * 100 - 1e-6) / 100;
