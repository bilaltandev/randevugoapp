// Runs the mobile auth HTTP tests against the real Next.js app, backed by the TEST database only.
//
//   npx next build                               (build first; this script does not build)
//   node scripts/test-env/run-http-tests.mjs
//
// Safety:
// 1. guard.mjs must pass (TEST project differs from production) or nothing starts.
// 2. The server gets TEST database urls and fresh random JWT secrets through its own env only; .env is
//    never modified. Port 3001 is used so a dev server on 3000 is left alone.
// 3. Before any test runs, a random marker written straight into the TEST db must appear in a page served
//    by the app — proof the app reads TEST, not production. Otherwise the server is stopped untouched.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawn, spawnSync } from "child_process";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const PORT = 3001;
const BASE = `http://localhost:${PORT}`;

const guard = spawnSync(process.execPath, [path.join(here, "guard.mjs"), root], { encoding: "utf8" });
process.stdout.write(guard.stdout);
if (guard.status !== 0) {
  console.log("✗ Test veritabanı doğrulanamadı; sunucu başlatılmadı.");
  process.exit(1);
}

const test = {};
for (const line of fs.readFileSync(path.join(root, ".env.test.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) test[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const listeningPids = () => {
  const out = spawnSync("netstat", ["-ano"], { encoding: "utf8" }).stdout || "";
  return [...new Set(out.split(/\r?\n/).filter((l) => l.includes(`:${PORT} `) && l.includes("LISTENING")).map((l) => l.trim().split(/\s+/).pop()))];
};
if (listeningPids().length) {
  console.log(`✗ Port ${PORT} kullanımda; başka bir sunucuyu durdurmamak için çıkılıyor.`);
  process.exit(1);
}

const secrets = {
  JWT_SECRET: crypto.randomBytes(48).toString("base64url"),
  MOBILE_JWT_SECRET: crypto.randomBytes(48).toString("base64url"),
};
const testEnv = { DATABASE_URL: test.TEST_DATABASE_URL, DIRECT_URL: test.TEST_DIRECT_URL, ...secrets };

const { PrismaClient } = createRequire(path.join(root, "package.json"))("@prisma/client");
const db = new PrismaClient({ datasourceUrl: test.TEST_DATABASE_URL });

let server;
let status = 1;
const markerIds = [];
const stopServer = () => {
  for (const pid of listeningPids()) spawnSync("taskkill", ["/F", "/T", "/PID", pid], { stdio: "ignore" });
  if (server && !server.killed) server.kill();
};
// Never leave the TEST-backed server running if this script is interrupted.
process.on("exit", stopServer);
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    stopServer();
    process.exit(130);
  });
}

try {
  server = spawn(process.execPath, [path.join(root, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(PORT)], {
    cwd: root,
    env: { ...process.env, ...testEnv },
    stdio: "ignore",
  });

  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) {
    try { ready = (await fetch(`${BASE}/login`)).status < 500; } catch { await new Promise((r) => setTimeout(r, 1000)); }
  }
  if (!ready) throw new Error("server-not-ready");
  console.log(`✓ Uygulama ${PORT} portunda TEST bağlantısıyla başladı`);

  const token = "TESTMARKER" + crypto.randomBytes(6).toString("hex");
  const slug = "marker-" + crypto.randomBytes(4).toString("hex");
  const owner = await db.user.create({ data: { email: `${slug}@test.invalid`, password: "x", name: "Marker" } });
  markerIds.push(owner.id);
  await db.business.create({ data: { userId: owner.id, name: token, slug, phone: "0", address: "Test" } });
  const seen = (await (await fetch(`${BASE}/${slug}`)).text()).includes(token);
  if (!seen) throw new Error("app-not-on-test");
  console.log("✓ Uygulamanın TEST veritabanını okuduğu doğrulandı (işaret kaydı sayfada görünüyor)");
  await db.user.deleteMany({ where: { id: { in: markerIds } } });
  markerIds.length = 0;

  const files = process.argv.slice(2);
  const targets = files.length
    ? files
    : fs.readdirSync(path.join(root, "tests", "mobile-auth-http")).filter((f) => f.endsWith(".test.ts")).map((f) => path.join("tests", "mobile-auth-http", f));
  const tsx = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
  const r = spawnSync(process.execPath, [tsx, "--test", "--test-concurrency=1", ...targets], {
    cwd: root,
    env: { ...process.env, ...testEnv, RG_TEST_DB_VERIFIED: "1", MOBILE_API_BASE: BASE, NODE_ENV: "test" },
    encoding: "utf8",
  });
  const scrub = (s) => (s || "").replace(/postgres(ql)?:\/\/\S+/g, "<redacted-url>");
  process.stdout.write(scrub(r.stdout));
  process.stderr.write(scrub(r.stderr));
  status = r.status ?? 1;
} catch (error) {
  const reason = { "server-not-ready": "sunucu başlamadı", "app-not-on-test": "uygulama TEST veritabanını okumuyor; testler çalıştırılmadı" }[error.message];
  console.log("✗ DURDURULDU: " + (reason || "beklenmeyen hata (" + (error.code || error.name) + ")"));
} finally {
  if (markerIds.length) await db.user.deleteMany({ where: { id: { in: markerIds } } }).catch(() => {});
  await db.$disconnect();
  stopServer();
}
process.exit(status);
