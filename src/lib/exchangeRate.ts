// USD → TRY rate for bank transfers: prices are in dollars, the transfer is made in TL.
// Source: the Central Bank of Türkiye's daily rates (USD "Döviz Satış"), cached for an hour.
// If TCMB can't be reached, USD_TRY_RATE (env) is used when set; otherwise the rate is unknown (null).

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";
const CACHE_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 4000;

export type UsdTryRate = { rate: number; date: string; source: "TCMB" | "manual" };

let cached: { value: UsdTryRate; at: number } | null = null;

async function fetchTcmb(): Promise<UsdTryRate | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(TCMB_URL, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) return null;
    const xml = await res.text();
    const usd = xml.match(/<Currency[^>]*CurrencyCode="USD"[^>]*>([\s\S]*?)<\/Currency>/);
    const selling = usd?.[1].match(/<ForexSelling>([\d.]+)<\/ForexSelling>/);
    const rate = selling ? Number(selling[1]) : NaN;
    if (!Number.isFinite(rate) || rate <= 0) return null;
    const date = xml.match(/Tarih="([\d.]+)"/)?.[1] ?? "";
    return { rate, date, source: "TCMB" };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function getUsdTryRate(): Promise<UsdTryRate | null> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  const live = await fetchTcmb();
  if (live) {
    cached = { value: live, at: Date.now() };
    return live;
  }
  const manual = Number(process.env.USD_TRY_RATE);
  if (Number.isFinite(manual) && manual > 0) return { rate: manual, date: "", source: "manual" };
  return cached?.value ?? null; // an older TCMB rate beats none
}

/** TL amount for a dollar price, rounded up to the kuruş so the transfer never falls short. */
export function usdToTry(usd: number, rate: number): number {
  return Math.ceil(usd * rate * 100 - 1e-6) / 100;
}
