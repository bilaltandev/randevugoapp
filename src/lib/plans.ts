// Client-safe plan constants and rules (no server imports).
//
// PERSON: one person takes the bookings; the business has at most one staff record and no staff choice.
// TEAM: the owner invites members (TeamInvite); each member signs in and gets the bookings made for them.
// Free tier: no plan of its own. New businesses start here (status "free"), and any business with no trial or paid
// period left falls back to it: PERSON with a monthly booking limit (and ads, once they exist). There are no new
// trials; older ones run until their end date.

export type Plan = "PERSON" | "TEAM";

export const PLANS: Plan[] = ["PERSON", "TEAM"];

export type BillingPeriod = "MONTHLY" | "YEARLY";

export const BILLING_PERIODS: BillingPeriod[] = ["MONTHLY", "YEARLY"];

/** What customers pay, in TL: fixed so the prices stay at 49 and 99 whatever the exchange rate does. */
export const PLAN_PRICES_TRY: Record<Plan, Record<BillingPeriod, number>> = {
  PERSON: { MONTHLY: 49, YEARLY: 399 },
  TEAM: { MONTHLY: 99, YEARLY: 799 },
};

/** The same prices in US dollars, stored on subscriptions and used for revenue totals. */
export const PLAN_PRICES: Record<Plan, Record<BillingPeriod, number>> = {
  PERSON: { MONTHLY: 0.99, YEARLY: 7.99 },
  TEAM: { MONTHLY: 1.99, YEARLY: 15.99 },
};

/** Earlier list prices. Not custom prices: subscriptions holding one move to today's lower list price. */
const OLD_LIST_PRICES = [1.49, 2.49, 13.49, 22.49, 1.99, 3.99, 14.99, 24.99];

/** Bookings a month on the free tier. */
export const FREE_MONTHLY_BOOKINGS = 30;

/** Months a yearly payment gives for free: 399 TL is about eight months of 49 TL. */
export const YEARLY_FREE_MONTHS = 4;

/** A list price, old or current, as opposed to one the admin set by hand. */
export function isListPrice(usd: number): boolean {
  return OLD_LIST_PRICES.includes(usd) || PLANS.some((p) => BILLING_PERIODS.some((b) => PLAN_PRICES[p][b] === usd));
}

/** Months one payment covers. */
export const PERIOD_MONTHS: Record<BillingPeriod, number> = { MONTHLY: 1, YEARLY: 12 };

export const PERIOD_NAMES: Record<BillingPeriod, string> = { MONTHLY: "Aylık", YEARLY: "Yıllık" };

/** "/ ay" or "/ yıl" after a price. */
export const PERIOD_SUFFIX: Record<BillingPeriod, string> = { MONTHLY: "/ ay", YEARLY: "/ yıl" };

export function isBillingPeriod(value: unknown): value is BillingPeriod {
  return value === "MONTHLY" || value === "YEARLY";
}

/** Unknown or missing values count as MONTHLY, the column default. */
export function periodOf(subscription: { billingPeriod?: string | null } | null | undefined): BillingPeriod {
  return subscription?.billingPeriod === "YEARLY" ? "YEARLY" : "MONTHLY";
}

/** How much a year costs less when paid yearly, in whole percent (Person and Team: 32 and 33). */
export function yearlySavingPercent(plan: Plan): number {
  const twelveMonths = PLAN_PRICES_TRY[plan].MONTHLY * 12;
  return Math.round(((twelveMonths - PLAN_PRICES_TRY[plan].YEARLY) / twelveMonths) * 100);
}

/** "49 TL" */
export function formatTRY(amount: number): string {
  return `${amount.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL`;
}

/** "$1.99" */
export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Per-month value of a price, e.g. for revenue totals. */
export function monthlyEquivalent(price: number, period: BillingPeriod): number {
  return price / PERIOD_MONTHS[period];
}

export const PLAN_NAMES: Record<Plan, string> = { PERSON: "Person", TEAM: "Team" };

/** Staff records a PERSON business may have. */
export const PERSON_STAFF_LIMIT = 1;

export function isPlan(value: unknown): value is Plan {
  return value === "PERSON" || value === "TEAM";
}

type SubscriptionPeriod = {
  status?: string | null;
  trialEndDate?: Date | string | null;
  subscriptionEndDate?: Date | string | null;
};

/** No trial or paid period left. Worked out from the dates, like subscriptionAccess. A cancelled account isn't free: it's closed. */
export function onFreeTier(subscription: SubscriptionPeriod | null | undefined, now = new Date()): boolean {
  if (!subscription?.status || subscription.status === "cancelled") return false;
  if (subscription.status === "active") {
    return !!subscription.subscriptionEndDate && new Date(subscription.subscriptionEndDate) <= now;
  }
  if (subscription.status === "trial") {
    return !subscription.trialEndDate || new Date(subscription.trialEndDate) <= now;
  }
  return true;
}

/** Unknown or missing values count as PERSON, the column default, and so does the free tier. */
export function planOf(subscription: ({ plan?: string | null } & SubscriptionPeriod) | null | undefined): Plan {
  return subscription?.plan === "TEAM" && !onFreeTier(subscription) ? "TEAM" : "PERSON";
}

/** Whether customers may pick a staff member on the booking page: never on PERSON, else the business setting. */
export function staffSelectionEnabled(plan: Plan, enableStaffSelection: boolean): boolean {
  return plan === "TEAM" && enableStaffSelection;
}

/** Short code the owner writes in a bank transfer's description so the admin can match it to the business. */
export function paymentReference(businessId: string): string {
  return `CG-${businessId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
