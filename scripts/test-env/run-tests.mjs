// Runs the mobile-auth test suite against the TEST Supabase database only.
//
//   node scripts/test-env/run-tests.mjs [test files...]   (default: tests/mobile-auth/*.test.ts)
//
// 1. guard.mjs must pass (TEST_* urls consistent and a different project than production) or nothing runs.
// 2. DATABASE_URL/DIRECT_URL are pointed at TEST in the child process only; .env is never modified.
// 3. MOBILE_JWT_SECRET and JWT_SECRET are fresh random values per run (never printed, never stored),
//    so tests don't depend on, or touch, real secrets.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const guard = spawnSync(process.execPath, [path.join(here, "guard.mjs"), root], { encoding: "utf8" });
process.stdout.write(guard.stdout);
if (guard.status !== 0) {
  console.log("✗ Test veritabanı doğrulanamadı; testler çalıştırılmadı.");
  process.exit(1);
}

const test = {};
for (const line of fs.readFileSync(path.join(root, ".env.test.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) test[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const files = process.argv.slice(2);
const targets = files.length
  ? files
  : fs.readdirSync(path.join(root, "tests", "mobile-auth")).filter((f) => f.endsWith(".test.ts")).map((f) => path.join("tests", "mobile-auth", f));

const env = {
  ...process.env,
  DATABASE_URL: test.TEST_DATABASE_URL,
  DIRECT_URL: test.TEST_DIRECT_URL,
  MOBILE_JWT_SECRET: crypto.randomBytes(48).toString("base64url"),
  JWT_SECRET: crypto.randomBytes(48).toString("base64url"),
  RG_TEST_DB_VERIFIED: "1",
  NODE_ENV: "test",
};

const tsx = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const r = spawnSync(process.execPath, [tsx, "--test", "--test-concurrency=1", ...targets], { cwd: root, env, encoding: "utf8" });
const scrub = (s) => (s || "").replace(/postgres(ql)?:\/\/\S+/g, "<redacted-url>");
process.stdout.write(scrub(r.stdout));
process.stderr.write(scrub(r.stderr));
process.exit(r.status ?? 1);
