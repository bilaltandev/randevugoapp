// Pure rules of src/lib/subscriptionAccess.ts (no database).   npx tsx --test tests/subscription/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { subscriptionAccess, subscriptionLock } from "../../src/lib/subscriptionAccess";

const now = new Date("2026-10-13T12:00:00Z");
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600_000);

test("trial is open until its end date, then locks even if the stored status still says trial", () => {
  assert.deepEqual(subscriptionAccess({ status: "trial", trialEndDate: hoursFromNow(1) }, now), {
    active: true,
    kind: "trial",
    endsAt: hoursFromNow(1),
  });
  assert.equal(subscriptionAccess({ status: "trial", trialEndDate: hoursFromNow(-1) }, now).active, false);
});

test("paid period is open until subscriptionEndDate", () => {
  const paid = { status: "active", trialEndDate: hoursFromNow(-100), subscriptionEndDate: hoursFromNow(24) };
  assert.equal(subscriptionAccess(paid, now).active, true);
  assert.equal(subscriptionAccess({ ...paid, subscriptionEndDate: hoursFromNow(-1) }, now).active, false);
});

test("expired, cancelled and missing subscriptions are locked", () => {
  assert.equal(subscriptionAccess({ status: "expired", trialEndDate: hoursFromNow(48) }, now).active, false);
  assert.equal(subscriptionAccess({ status: "cancelled", trialEndDate: hoursFromNow(48) }, now).active, false);
  assert.equal(subscriptionAccess(null, now).active, false);
});

test("a pending bank transfer does not open a locked business", () => {
  // paymentStatus is not part of the rule: only the admin's confirmation (status "active") opens it.
  const pending = { status: "expired", trialEndDate: hoursFromNow(-1), paymentStatus: "pending" };
  assert.equal(subscriptionAccess(pending, now).active, false);
});

test("subscriptionLock answers 402 SUBSCRIPTION_REQUIRED only when locked", async () => {
  assert.equal(subscriptionLock({ status: "trial", trialEndDate: new Date(Date.now() + 3600_000) }), null);
  const res = subscriptionLock({ status: "expired", trialEndDate: new Date(0) });
  assert.ok(res);
  assert.equal(res.status, 402);
  assert.equal((await res.json()).code, "SUBSCRIPTION_REQUIRED");
});
