// Pure rules of src/lib/subscriptionAccess.ts (no database).   npx tsx --test tests/subscription/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { subscriptionAccess, subscriptionLock } from "../../src/lib/subscriptionAccess";

const now = new Date("2026-10-13T12:00:00Z");
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600_000);

test("trial is open until its end date, then drops to the free tier even if the stored status still says trial", () => {
  assert.deepEqual(subscriptionAccess({ status: "trial", trialEndDate: hoursFromNow(1) }, now), {
    active: true,
    kind: "trial",
    endsAt: hoursFromNow(1),
  });
  assert.equal(subscriptionAccess({ status: "trial", trialEndDate: hoursFromNow(-1) }, now).kind, "free");
});

test("paid period is open until subscriptionEndDate", () => {
  const paid = { status: "active", trialEndDate: hoursFromNow(-100), subscriptionEndDate: hoursFromNow(24) };
  assert.equal(subscriptionAccess(paid, now).active, true);
  assert.equal(subscriptionAccess({ ...paid, subscriptionEndDate: hoursFromNow(-1) }, now).kind, "free");
});

test("expired subscriptions are free; cancelled and missing ones are locked", () => {
  assert.equal(subscriptionAccess({ status: "expired", trialEndDate: hoursFromNow(48) }, now).kind, "free");
  assert.equal(subscriptionAccess({ status: "cancelled", trialEndDate: hoursFromNow(48) }, now).active, false);
  assert.equal(subscriptionAccess(null, now).active, false);
});

test("a new business starts on the free tier", () => {
  assert.deepEqual(subscriptionAccess({ status: "free", trialEndDate: now }, now), { active: true, kind: "free", endsAt: null });
});

test("a pending bank transfer does not give paid access", () => {
  // paymentStatus is not part of the rule: only the admin's confirmation (status "active") opens it.
  const pending = { status: "expired", trialEndDate: hoursFromNow(-1), paymentStatus: "pending" };
  assert.equal(subscriptionAccess(pending, now).kind, "free");
});

test("subscriptionLock answers 402 SUBSCRIPTION_REQUIRED only when locked", async () => {
  assert.equal(subscriptionLock({ status: "trial", trialEndDate: new Date(Date.now() + 3600_000) }), null);
  assert.equal(subscriptionLock({ status: "expired", trialEndDate: new Date(0) }), null);
  const res = subscriptionLock({ status: "cancelled", trialEndDate: new Date(0) });
  assert.ok(res);
  assert.equal(res.status, 402);
  assert.equal((await res.json()).code, "SUBSCRIPTION_REQUIRED");
});
