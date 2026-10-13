import type { BillingPeriod, SubscriptionInfo } from '@/api/panel';
import type { Plan } from '@/api/business';
import { t } from '@/i18n';

// Mirrors src/lib/plans.ts on the server. Prices come from the API (`prices`); these are only a fallback
// for servers that don't send them yet.
const LIST_PRICES: Record<Plan, Record<BillingPeriod, number>> = {
  PERSON: { MONTHLY: 1.49, YEARLY: 13.49 },
  TEAM: { MONTHLY: 2.49, YEARLY: 22.49 },
};

export const BILLING_PERIODS: BillingPeriod[] = ['MONTHLY', 'YEARLY'];

export const periodName = (period: BillingPeriod) => (period === 'YEARLY' ? t('Yıllık') : t('Aylık'));

/** "/ ay" or "/ yıl" after a price. */
export const periodSuffix = (period: BillingPeriod) => (period === 'YEARLY' ? t('/ yıl') : t('/ ay'));

/** "$1.49" */
export const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;

/** "1.234,56 TL" */
export const formatTry = (amount: number) =>
  `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;

export function priceFor(info: SubscriptionInfo, plan: Plan, period: BillingPeriod): number {
  return info.prices?.[plan]?.[period] ?? LIST_PRICES[plan][period];
}

/** Yearly discount against twelve monthly payments, in whole percent. */
export function yearlySaving(info: SubscriptionInfo, plan: Plan): number {
  const twelve = priceFor(info, plan, 'MONTHLY') * 12;
  return Math.round(((twelve - priceFor(info, plan, 'YEARLY')) / twelve) * 100);
}

/** TL to transfer for a dollar amount: rounded up to the kuruş, same as the server. */
export const usdToTry = (usd: number, rate: number) => Math.ceil(usd * rate * 100 - 1e-6) / 100;
