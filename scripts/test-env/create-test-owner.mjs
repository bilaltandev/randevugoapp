// Creates (or reuses) a synthetic BUSINESS_OWNER + business in the TEST database for phone login tests.
//
//   node scripts/test-env/create-test-owner.mjs                   (idempotent)
//   node scripts/test-env/create-test-owner.mjs --reset-password  (new random password for the test owner)
//   node scripts/test-env/create-test-owner.mjs --sync-password   (apply the TEST_OWNER_PASSWORD written in .env.test.local)
//   node scripts/test-env/create-test-owner.mjs --sample-data     (replace this business's demo services/appointments,
//                                                                  dated around today)
//
// - Runs guard.mjs first and writes only through TEST_DATABASE_URL.
// - Credentials live in .env.test.local (git-ignored) as TEST_OWNER_EMAIL / TEST_OWNER_PASSWORD.
//   The password is generated here and never printed or logged; read it from that file.
// - Only addresses on the reserved .test TLD are accepted, so no real person's account can be touched.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawnSync } from "child_process";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const envFile = path.join(root, ".env.test.local");
const resetPassword = process.argv.includes("--reset-password");
// Use the TEST_OWNER_PASSWORD already written in .env.test.local (e.g. edited by hand to something memorable).
const syncPassword = process.argv.includes("--sync-password");
const sampleData = process.argv.includes("--sample-data");

/** Local calendar date (YYYY-MM-DD) `offset` days from today, matching how the app stores dates. */
const dayKey = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("sv-SE");
};

/** Rebuilds a small, fully synthetic schedule for one business (TEST db only). */
async function seedSampleData(db, businessId) {
  await db.appointment.deleteMany({ where: { businessId } });
  await db.customer.deleteMany({ where: { businessId } });
  await db.employee.deleteMany({ where: { businessId } });
  await db.service.deleteMany({ where: { businessId } });

  const haircut = await db.service.create({ data: { businessId, name: "Saç Kesimi", durationMinutes: 30, price: 250 } });
  const beard = await db.service.create({ data: { businessId, name: "Sakal Tıraşı", durationMinutes: 20, price: 150 } });
  const employee = await db.employee.create({
    data: {
      businessId,
      name: "Ahmet Usta (Sentetik)",
      specialty: "Saç & Sakal",
      employeeServices: { create: [{ serviceId: haircut.id }, { serviceId: beard.id }] },
    },
  });

  const plan = [
    [-1, "14:00", haircut, "COMPLETED", 1],
    [-1, "16:00", beard, "CANCELLED", 2],
    [0, "09:30", haircut, "COMPLETED", 3],
    [0, "11:00", beard, "CONFIRMED", 4],
    [0, "15:00", haircut, "PENDING", 5],
    [0, "17:30", haircut, "CONFIRMED", 1],
    [1, "10:00", haircut, "PENDING", 2],
    [1, "12:30", beard, "CONFIRMED", 3],
    [2, "13:00", haircut, "PENDING", 4],
    [4, "18:00", beard, "CONFIRMED", 5],
  ];
  const customers = [];
  for (let i = 1; i <= 5; i++) {
    customers.push(await db.customer.create({ data: { businessId, name: `Test Müşteri ${i}`, phone: `0500000000${i}` } }));
  }
  const endOf = (start, minutes) => {
    const [h, m] = start.split(":").map(Number);
    const t = h * 60 + m + minutes;
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  };
  for (const [offset, start, service, status, c] of plan) {
    const customer = customers[c - 1];
    await db.appointment.create({
      data: {
        businessId, serviceId: service.id, employeeId: employee.id, customerId: customer.id,
        date: dayKey(offset), startTime: start, endTime: endOf(start, service.durationMinutes),
        status, customerName: customer.name, customerPhone: customer.phone, price: service.price,
      },
    });
  }
  // A closed slot ("Saat kapat") today, like the web calendar creates.
  await db.appointment.create({
    data: {
      businessId, serviceId: haircut.id, employeeId: employee.id, date: dayKey(0), startTime: "13:00", endTime: "14:00",
      status: "CONFIRMED", customerName: "[KAPALI: Öğle arası]", customerPhone: "0000000000", notes: "Öğle arası",
      price: 0, isBlockedSlot: true,
    },
  });
  return plan.length + 1;
}

const guard = spawnSync(process.execPath, [path.join(here, "guard.mjs"), root], { encoding: "utf8" });
process.stdout.write(guard.stdout);
if (guard.status !== 0) {
  console.log("✗ Test veritabanı doğrulanamadı; hiçbir şey yazılmadı.");
  process.exit(1);
}

const readEnv = () => {
  const out = {};
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
};
/** Sets KEY=value in .env.test.local: replaces an existing line or appends. Other lines are untouched. */
const writeEnvVar = (key, value) => {
  const src = fs.readFileSync(envFile, "utf8");
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  fs.writeFileSync(envFile, re.test(src) ? src.replace(re, line) : src + (src.endsWith("\n") ? "" : "\n") + line + "\n");
};
/** Readable random password (no look-alike characters), easy to type on a phone. */
const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(crypto.randomBytes(14), (b) => chars[b % chars.length]).join("");
};

let env = readEnv();
const email = (env.TEST_OWNER_EMAIL || "sahip@randevugo.test").toLowerCase();
if (!/^[^@\s]+@[^@\s]+\.test$/.test(email)) {
  console.log("✗ TEST_OWNER_EMAIL yalnızca .test uzantılı (sentetik) bir adres olabilir.");
  process.exit(1);
}
if (!env.TEST_OWNER_EMAIL) writeEnvVar("TEST_OWNER_EMAIL", email);

const req = createRequire(path.join(root, "package.json"));
const { PrismaClient } = req("@prisma/client");
const bcrypt = req("bcryptjs");
const db = new PrismaClient({ datasourceUrl: env.TEST_DATABASE_URL });

try {
  let user = await db.user.findUnique({ where: { email }, include: { businesses: true } });
  const useFilePassword = syncPassword && !!env.TEST_OWNER_PASSWORD;
  const needsPassword = !user || resetPassword || useFilePassword || !env.TEST_OWNER_PASSWORD;
  if (needsPassword && !useFilePassword) {
    writeEnvVar("TEST_OWNER_PASSWORD", generatePassword());
    env = readEnv();
  }
  const passwordHash = needsPassword ? await bcrypt.hash(env.TEST_OWNER_PASSWORD, 10) : undefined;

  if (!user) {
    user = await db.user.create({
      data: { email, name: "Test Sahibi (Sentetik)", password: passwordHash, role: "BUSINESS_OWNER", isActive: true },
      include: { businesses: true },
    });
    console.log("✓ Sentetik işletme sahibi oluşturuldu");
  } else {
    if (user.role !== "BUSINESS_OWNER") {
      console.log("✗ Bu e-posta test veritabanında başka bir rolle kayıtlı; değiştirilmedi.");
      process.exit(1);
    }
    await db.user.update({ where: { id: user.id }, data: { isActive: true, ...(passwordHash ? { password: passwordHash } : {}) } });
    console.log(`✓ Mevcut sentetik hesap kullanılıyor${passwordHash ? " (şifre yenilendi)" : ""}`);
  }

  if (user.businesses.length === 0) {
    const slug = `test-isletme-${crypto.randomBytes(3).toString("hex")}`;
    const now = new Date();
    await db.business.create({
      data: {
        userId: user.id,
        name: "Test İşletme (Sentetik)",
        slug,
        sector: "BERBER",
        phone: "0000000000",
        address: "Test Mah. (sentetik veri)",
        city: "Test",
        subscription: {
          create: {
            planType: "TRIAL",
            trialStartDate: now,
            trialEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // long trial: test account only
            status: "trial",
            paymentStatus: "paid",
            monthlyPrice: 0,
          },
        },
      },
    });
    console.log("✓ Sentetik işletme oluşturuldu (30 günlük deneme aboneliği)");
  } else {
    console.log("✓ İşletme zaten mevcut");
  }

  if (sampleData) {
    const business = await db.business.findFirstOrThrow({ where: { userId: user.id } });
    const count = await seedSampleData(db, business.id);
    console.log(`✓ Sentetik örnek veri yenilendi: 2 hizmet, 1 çalışan, 5 müşteri, ${count} randevu (dün → 4 gün sonrası)`);
  }

  console.log(`\nGiriş e-postası: ${email}`);
  console.log("Şifre: .env.test.local dosyasındaki TEST_OWNER_PASSWORD satırında (ekrana yazdırılmadı).");
} catch (error) {
  console.log("✗ Hata: " + (error?.code || error?.name || "bilinmiyor"));
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
