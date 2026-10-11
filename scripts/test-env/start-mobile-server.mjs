// Development-only API server for testing the Expo app on a real phone, backed by the TEST database.
//
//   npx next build                                   (once, after code changes)
//   node scripts/test-env/start-mobile-server.mjs    (Ctrl+C to stop)
//
// Safety:
// - guard.mjs must pass (TEST project, different from production) or nothing starts.
// - Refuses to run on Vercel/CI. Never use this for production traffic.
// - DATABASE_URL/DIRECT_URL → TEST, MOBILE_JWT_SECRET → TEST_MOBILE_JWT_SECRET, and a throwaway random
//   JWT_SECRET (so the real web secret is never loaded), all in this process tree only; .env is untouched.
// - Before announcing the address, a random marker written into the TEST db must appear in a page served
//   by the app (proof it reads TEST). Otherwise the server is stopped.
// - Listens on 0.0.0.0:3001 so a phone on the same Wi-Fi can reach it. No firewall or router changes.
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { spawn, spawnSync } from "child_process";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const PORT = 3001;

if (process.env.VERCEL || process.env.CI) {
  console.log("✗ Bu betik yalnızca yerel geliştirme içindir (VERCEL/CI ortamında çalışmaz).");
  process.exit(1);
}

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
if (!test.TEST_MOBILE_JWT_SECRET || test.TEST_MOBILE_JWT_SECRET.length < 32) {
  console.log("✗ .env.test.local içinde TEST_MOBILE_JWT_SECRET (en az 32 karakter) gerekli.");
  process.exit(1);
}
if (!fs.existsSync(path.join(root, ".next", "BUILD_ID"))) {
  console.log("✗ Önce `npx next build` çalıştırın.");
  process.exit(1);
}

const listeningPids = () => {
  const out = spawnSync("netstat", ["-ano"], { encoding: "utf8" }).stdout || "";
  return [...new Set(out.split(/\r?\n/).filter((l) => l.includes(`:${PORT} `) && l.includes("LISTENING")).map((l) => l.trim().split(/\s+/).pop()))];
};
if (listeningPids().length) {
  console.log(`✗ Port ${PORT} kullanımda. Önceki sunucuyu kapatın.`);
  process.exit(1);
}

/** Private IPv4 addresses a phone on the same network could use (virtual adapters skipped). */
const lanAddresses = () =>
  Object.entries(os.networkInterfaces())
    .filter(([name]) => !/vEthernet|WSL|VirtualBox|VMware|Hyper-V|Loopback|Bluetooth/i.test(name))
    .flatMap(([name, addrs]) => (addrs || []).filter((a) => a.family === "IPv4" && !a.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address)).map((a) => ({ name, address: a.address })));

const server = spawn(process.execPath, [path.join(root, "node_modules", "next", "dist", "bin", "next"), "start", "-H", "0.0.0.0", "-p", String(PORT)], {
  cwd: root,
  env: {
    ...process.env,
    DATABASE_URL: test.TEST_DATABASE_URL,
    DIRECT_URL: test.TEST_DIRECT_URL,
    MOBILE_JWT_SECRET: test.TEST_MOBILE_JWT_SECRET,
    JWT_SECRET: crypto.randomBytes(48).toString("base64url"),
  },
  stdio: ["ignore", "ignore", "inherit"], // keep server errors visible; request logs off
});
const stop = () => {
  for (const pid of listeningPids()) spawnSync("taskkill", ["/F", "/T", "/PID", pid], { stdio: "ignore" });
  if (!server.killed) server.kill();
};
process.on("exit", stop);
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => process.exit(0));
server.on("exit", (code) => {
  console.log(`Sunucu kapandı (kod ${code ?? "?"}).`);
  process.exit(code ?? 0);
});

const base = `http://127.0.0.1:${PORT}`;
let ready = false;
for (let i = 0; i < 60 && !ready; i++) {
  try { ready = (await fetch(`${base}/login`)).status < 500; } catch { await new Promise((r) => setTimeout(r, 1000)); }
}
if (!ready) {
  console.log("✗ Sunucu başlamadı.");
  process.exit(1);
}

// Prove the app reads the TEST database before telling anyone to connect.
const { PrismaClient } = createRequire(path.join(root, "package.json"))("@prisma/client");
const db = new PrismaClient({ datasourceUrl: test.TEST_DATABASE_URL });
const token = "TESTMARKER" + crypto.randomBytes(6).toString("hex");
const slug = "marker-" + crypto.randomBytes(4).toString("hex");
let onTest = false;
try {
  const owner = await db.user.create({ data: { email: `${slug}@test.invalid`, password: "x", name: "Marker" } });
  try {
    await db.business.create({ data: { userId: owner.id, name: token, slug, phone: "0", address: "Test" } });
    onTest = (await (await fetch(`${base}/${slug}`)).text()).includes(token);
  } finally {
    await db.user.delete({ where: { id: owner.id } });
  }
} finally {
  await db.$disconnect();
}
if (!onTest) {
  console.log("✗ DURDURULDU: uygulama TEST veritabanını okumuyor.");
  process.exit(1);
}

console.log("✓ Uygulamanın TEST veritabanını okuduğu doğrulandı");
console.log(`\nMobil test sunucusu hazır (yalnızca geliştirme). Port ${PORT}:`);
for (const { name, address } of lanAddresses()) console.log(`  ${name.padEnd(14)} http://${address}:${PORT}`);
console.log("\nmobile/.env içindeki EXPO_PUBLIC_API_URL, telefonun bağlı olduğu ağdaki adresle aynı olmalı.");
console.log("Durdurmak için Ctrl+C.");
