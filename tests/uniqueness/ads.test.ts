// Pacing of the mobile full-screen ads. No network:   npx tsx --test tests/uniqueness/ads.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { MIN_GAP_MS, mayShowAd } from "../../mobile/src/lib/adPacing";

const now = 1_000_000_000;

test("no second ad within 30 minutes", () => {
  assert.equal(mayShowAd({ at: now - MIN_GAP_MS + 1, day: "2026-10-31", count: 1 }, now, "2026-10-31"), false);
  assert.equal(mayShowAd({ at: now - MIN_GAP_MS, day: "2026-10-31", count: 1 }, now, "2026-10-31"), true);
});

test("at most five a day, and the count starts over the next day", () => {
  assert.equal(mayShowAd({ at: 0, day: "2026-10-31", count: 5 }, now, "2026-10-31"), false);
  assert.equal(mayShowAd({ at: 0, day: "2026-10-31", count: 4 }, now, "2026-10-31"), true);
  assert.equal(mayShowAd({ at: 0, day: "2026-10-31", count: 5 }, now, "2026-11-01"), true);
});
