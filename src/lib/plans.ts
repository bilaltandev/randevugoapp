// Client-safe plan constants and rules (no server imports).
//
// PERSON: one person takes the bookings; the business has at most one staff record and no staff choice.
// TEAM: the owner invites members (TeamInvite); each member signs in and gets the bookings made for them.

export type Plan = "PERSON" | "TEAM";

export const PLANS: Plan[] = ["PERSON", "TEAM"];

export type BillingPeriod = "MONTHLY" | "YEARLY";

export const BILLING_PERIODS: BillingPeriod[] = ["MONTHLY", "YEARLY"];

/** List prices in US dollars for one billing period. Bank transfers are paid in TL at the day's rate. */
export const PLAN_PRICES: Record<Plan, Record<BillingPeriod, number>> = {
  PERSON: { MONTHLY: 1.49, YEARLY: 13.49 },
  TEAM: { MONTHLY: 2.49, YEARLY: 22.49 },
};

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

/** How much a year costs less when paid yearly, in whole percent (Person and Team: 25). */
export function yearlySavingPercent(plan: Plan): number {
  const twelveMonths = PLAN_PRICES[plan].MONTHLY * 12;
  return Math.round(((twelveMonths - PLAN_PRICES[plan].YEARLY) / twelveMonths) * 100);
}

/** "$1.49" */
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

/** Unknown or missing values count as PERSON, the column default. */
export function planOf(subscription: { plan?: string | null } | null | undefined): Plan {
  return subscription?.plan === "TEAM" ? "TEAM" : "PERSON";
}

/** Whether customers may pick a staff member on the booking page: never on PERSON, else the business setting. */
export function staffSelectionEnabled(plan: Plan, enableStaffSelection: boolean): boolean {
  return plan === "TEAM" && enableStaffSelection;
}

/** Short code the owner writes in a bank transfer's description so the admin can match it to the business. */
export function paymentReference(businessId: string): string {
  return `CG-${businessId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
