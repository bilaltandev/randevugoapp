// Verifies that TEST_* connections point to a Supabase project that is NOT production.
// Prints only pass/fail lines; never prints URLs, refs, users, passwords or keys.
// Usage: node scripts/test-env/guard.mjs <repoRoot> [--connect]
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const root = process.argv[2];
const connect = process.argv.includes("--connect");

function fail(msg) {
  console.log("✗ DURDURULDU: " + msg);
  process.exit(1);
}
function ok(msg) {
  console.log("✓ " + msg);
}

function parseEnv(file) {
  if (!fs.existsSync(file)) fail(path.basename(file) + " bulunamadı.");
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

// Supabase project ref from a Postgres URL (pooler: user "postgres.<ref>", direct: host "db.<ref>.supabase.co").
function refFromPg(url) {
  let u;
  try { u = new URL(url); } catch { return null; }
  if (!/^postgres(ql)?:$/.test(u.protocol)) return null;
  const host = u.hostname.toLowerCase();
  const user = decodeURIComponent(u.username || "");
  const direct = host.match(/^db\.([a-z0-9]{20})\.supabase\.co$/);
  if (direct) return direct[1];
  if (/\.pooler\.supabase\.com$/.test(host)) {
    const m = user.match(/^[a-z_]+\.([a-z0-9]{20})$/);
    return m ? m[1] : null;
  }
  return null;
}
function refFromHttp(url) {
  try {
    const m = new URL(url).hostname.toLowerCase().match(/^([a-z0-9]{20})\.supabase\.co$/);
    return m ? m[1] : null;
  } catch { return null; }
}
function refFromAnonKey(key) {
  // Legacy anon keys are JWTs carrying "ref"; new sb_publishable_ keys carry none.
  const parts = (key || "").split(".");
  if (parts.length !== 3) return undefined;
  try { return JSON.parse(Buffer.from(parts[1], "base64url").toString()).ref ?? undefined; } catch { return undefined; }
}

const test = parseEnv(path.join(root, ".env.test.local"));
const prod = parseEnv(path.join(root, ".env"));

for (const k of ["TEST_DATABASE_URL", "TEST_DIRECT_URL", "TEST_SUPABASE_URL", "TEST_SUPABASE_ANON_KEY"]) {
  if (!test[k]) fail(k + " tanımlı değil.");
}
ok("TEST_ değişkenlerinin hepsi tanımlı");
if (Object.keys(test).some((k) => ["DATABASE_URL", "DIRECT_URL"].includes(k))) {
  fail(".env.test.local içinde TEST_ öneki olmayan DATABASE_URL/DIRECT_URL var; karışma riski.");
}

const tPool = refFromPg(test.TEST_DATABASE_URL);
const tDirect = refFromPg(test.TEST_DIRECT_URL);
const tHttp = refFromHttp(test.TEST_SUPABASE_URL);
if (!tPool || !tDirect || !tHttp) fail("Test proje kimliği adreslerden çıkarılamadı (" +
  [!tPool && "TEST_DATABASE_URL", !tDirect && "TEST_DIRECT_URL", !tHttp && "TEST_SUPABASE_URL"].filter(Boolean).join(", ") + ").");
if (!(tPool === tDirect && tDirect === tHttp)) fail("Test adresleri farklı Supabase projelerini gösteriyor.");
ok("Test adreslerinin üçü aynı projeyi gösteriyor");

const keyRef = refFromAnonKey(test.TEST_SUPABASE_ANON_KEY);
if (keyRef !== undefined && keyRef !== tPool) fail("Anon anahtar başka bir projeye ait.");
ok(keyRef === undefined ? "Anon anahtar yeni formatta (proje kimliği taşımıyor); Data API testinde doğrulanacak" : "Anon anahtar test projesine ait");

const pRefs = [prod.DATABASE_URL, prod.DIRECT_URL].filter(Boolean).map(refFromPg);
if (pRefs.length === 0 || pRefs.some((r) => !r)) fail("Production proje kimliği .env'den çıkarılamadı; karşılaştırma yapılamıyor.");
if (pRefs.includes(tPool)) fail("TEST projesi production ile AYNI.");
if ([test.TEST_DATABASE_URL, test.TEST_DIRECT_URL].some((u) => u === prod.DATABASE_URL || u === prod.DIRECT_URL)) fail("Test adresi production adresiyle birebir aynı.");
ok("Test projesi production'dan farklı");

if (!connect) process.exit(0);

(async () => {
  const { PrismaClient } = createRequire(path.join(root, "package.json"))("@prisma/client");
  const ids = {};
  for (const [name, url] of [["pooler", test.TEST_DATABASE_URL], ["direct", test.TEST_DIRECT_URL]]) {
    const db = new PrismaClient({ datasourceUrl: url });
    try {
      // Read-only session: any accidental write in this check would error.
      const [r] = await db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
        return tx.$queryRawUnsafe(`
          SELECT current_database() AS db, current_user AS usr,
                 (SELECT system_identifier::text FROM pg_control_system()) AS sysid,
                 (SELECT count(*)::int FROM pg_tables WHERE schemaname = 'public') AS public_tables,
                 (SELECT count(*)::int FROM pg_roles WHERE rolname IN ('anon','authenticated')) AS supabase_roles,
                 (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypassrls
        `);
      });
      ids[name] = r;
      ok(`${name}: bağlandı (salt okunur), public tablo sayısı=${r.public_tables}, anon/authenticated rolleri=${r.supabase_roles === 2 ? "var" : "YOK"}, kullanıcı RLS'i atlıyor mu=${r.bypassrls}`);
    } catch (e) {
      fail(`${name} bağlantısı başarısız: ${(e && e.code) || "hata"}`);
    } finally {
      await db.$disconnect();
    }
  }
  if (!ids.pooler.sysid || ids.pooler.sysid !== ids.direct.sysid) fail("Pooler ve doğrudan bağlantı aynı veritabanı kümesini göstermiyor (veya sistem kimliği okunamadı).");
  ok("Pooler ve doğrudan bağlantı aynı veritabanı kümesine bağlı");
  if (ids.direct.supabase_roles !== 2) fail("Hedef bir Supabase veritabanı gibi görünmüyor.");
  if (ids.direct.public_tables > 0) console.log("! UYARI: Test veritabanı boş değil (public şemada tablo var). Devam etmeden önce kontrol edin.");
  else ok("Test veritabanı boş (yeni proje)");
})();
