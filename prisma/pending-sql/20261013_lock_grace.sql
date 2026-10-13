-- One-off, production rollout of the subscription lock (user decision 2026-10-13): businesses whose trial or
-- paid period had already ended get 3 more trial days from now, so nobody is closed without warning.
-- Run once, right after 20261013_usd_billing_periods.sql. Rows still inside a trial/paid period are untouched.
UPDATE "Subscription"
SET "status" = 'trial', "trialEndDate" = now() + interval '3 days'
WHERE NOT (
  ("status" = 'active' AND ("subscriptionEndDate" IS NULL OR "subscriptionEndDate" > now()))
  OR ("status" = 'trial' AND "trialEndDate" > now())
);
