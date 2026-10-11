import { after, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cleanup, prisma } from "./helpers";
import { hitRateLimit, pruneRateLimits, resetRateLimit } from "../../src/lib/rateLimit";

after(cleanup);

const key = () => `test:${crypto.randomBytes(6).toString("hex")}`;
const policy = { limit: 5, windowSeconds: 900 };

test("allows up to the limit, then blocks with a Retry-After", async () => {
  const k = key();
  for (let i = 1; i <= 5; i++) assert.equal((await hitRateLimit(k, policy)).allowed, true, `hit ${i}`);
  const sixth = await hitRateLimit(k, policy);
  assert.equal(sixth.allowed, false);
  assert.equal(sixth.count, 6);
  assert.ok(sixth.retryAfterSeconds > 0 && sixth.retryAfterSeconds <= 900);
});

test("concurrent hits are counted atomically (no lost updates)", async () => {
  const k = key();
  const results = await Promise.all(Array.from({ length: 20 }, () => hitRateLimit(k, { limit: 100, windowSeconds: 60 })));
  assert.deepEqual(results.map((r) => r.count).sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => i + 1));
});

test("an expired window starts over at 1", async () => {
  const k = key();
  await hitRateLimit(k, policy);
  await hitRateLimit(k, policy);
  await prisma.authRateLimit.update({ where: { key: k }, data: { windowStart: new Date(Date.now() - 901 * 1000) } });
  assert.equal((await hitRateLimit(k, policy)).count, 1);
});

test("reset clears the counter (successful login)", async () => {
  const k = key();
  for (let i = 0; i < 6; i++) await hitRateLimit(k, policy);
  await resetRateLimit(k);
  assert.deepEqual(await hitRateLimit(k, policy).then((r) => [r.allowed, r.count]), [true, 1]);
});

test("pruning removes only counters older than a day", async () => {
  const [old, fresh] = [key(), key()];
  await hitRateLimit(old, policy);
  await hitRateLimit(fresh, policy);
  await prisma.authRateLimit.update({ where: { key: old }, data: { windowStart: new Date(Date.now() - 25 * 3600 * 1000) } });
  await pruneRateLimits();
  assert.equal(await prisma.authRateLimit.count({ where: { key: old } }), 0);
  assert.equal(await prisma.authRateLimit.count({ where: { key: fresh } }), 1);
});
