"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Clock, Copy, Landmark, Lock, Tag, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { applyPercentOff, formatTL, normalizeCouponCode } from "@/lib/couponOptions";
import {
  BILLING_PERIODS,
  PERIOD_NAMES,
  PERIOD_SUFFIX,
  PLAN_NAMES,
  PLAN_PRICES,
  PLANS,
  formatUSD,
  periodOf,
  planOf,
  yearlySavingPercent,
  type BillingPeriod,
  type Plan,
} from "@/lib/plans";

const PLAN_INFO: Record<Plan, { tagline: string; features: string[] }> = {
  PERSON: {
    tagline: "Tek başına çalışanlar için",
    features: [
      "Sınırsız online randevu",
      "Kendi rezervasyon sayfanız",
      "Sayfa düzenleyici ve galeri",
      "Müşteri yönetimi",
      "Mobil uygulama",
    ],
  },
  TEAM: {
    tagline: "Ekibiyle çalışan işletmeler için",
    features: [
      "Person paketindeki her şey",
      "Ekibinizi davet edin (5 üyeye kadar)",
      "Her üye kendi randevularını görür",
      "Siz tüm randevuları yönetirsiniz",
      "Tek ödeme: ücreti yalnızca siz ödersiniz",
    ],
  },
};

interface ActiveDiscount {
  code: string;
  percentOff: number;
  monthsRemaining: number;
}

interface Subscription {
  plan: string;
  status: string;
  monthlyPrice: number;
  billingPeriod: string;
  paymentStatus: string;
  paymentRequestedAt: string | null;
  pendingAmount: number | null;
  pendingAmountTry: number | null;
  pendingRate: number | null;
  subscriptionEndDate: string | null;
  trialEndDate: string;
}

interface Bank {
  iban: string;
  accountName: string;
  bankName: string;
}

interface Rate {
  rate: number;
  date: string;
  source: string;
}

interface SubscriptionClientProps {
  welcome: boolean;
  initialSubscription: Subscription | null;
  access: { active: true; kind: "trial" | "paid"; endsAt: string | null } | { active: false };
  daysLeft: number;
  bank: Bank | null;
  reference: string;
  initialActiveDiscount: ActiveDiscount | null;
  /** USD price per plan and period for this business (custom admin prices included). */
  prices: Record<Plan, Record<BillingPeriod, number>>;
  /** USD→TRY for the transfer amount; null when the rate couldn't be fetched. */
  rate: Rate | null;
}

export default function SubscriptionClient({
  welcome,
  initialSubscription,
  access,
  daysLeft,
  bank,
  reference,
  initialActiveDiscount,
  prices,
  rate,
}: SubscriptionClientProps) {
  const router = useRouter();
  const [sub, setSub] = useState(initialSubscription);
  const currentPlan = planOf(sub);
  const [chosen, setChosen] = useState<Plan>(currentPlan);
  const [period, setPeriod] = useState<BillingPeriod>(periodOf(initialSubscription));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Bank transfer dialog
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponPercent, setCouponPercent] = useState<{ code: string; percentOff: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [copied, setCopied] = useState("");

  const pending = sub?.paymentStatus === "pending" && sub.paymentRequestedAt ? sub : null;

  /** Price for a plan: the admin's custom price while the plan stays the same, otherwise the list price. */
  const priceOf = (plan: Plan) => prices[plan][period];
  const discountPercent = initialActiveDiscount?.percentOff ?? couponPercent?.percentOff ?? 0;
  const amountFor = (plan: Plan) => (discountPercent ? applyPercentOff(priceOf(plan), discountPercent) : priceOf(plan));

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      // Clipboard blocked: the value is still on screen to copy by hand.
    }
  };

  const openCheckout = (plan: Plan) => {
    setChosen(plan);
    setCheckoutPlan(plan);
    setCheckoutError("");
  };

  const applyCoupon = async () => {
    const code = normalizeCouponCode(couponInput);
    if (!code) return;
    setCouponError("");
    try {
      const res = await fetch("/api/subscription/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCouponPercent(null);
        setCouponError(data.error || "İndirim kodu uygulanamadı.");
        return;
      }
      setCouponPercent({ code: data.code, percentOff: data.percentOff });
    } catch {
      setCouponError("Bağlantı hatası oluştu.");
    }
  };

  const sendPaymentRequest = async () => {
    if (!checkoutPlan) return;
    setBusy(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: checkoutPlan, billingPeriod: period, couponCode: couponPercent?.code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCheckoutError(data.error || "Ödeme bildirimi gönderilemedi.");
        return;
      }
      setSub((s) =>
        s
          ? {
              ...s,
              plan: data.plan,
              monthlyPrice: priceOf(checkoutPlan),
              billingPeriod: period,
              pendingAmountTry: data.amountTry ?? null,
              pendingRate: data.rate?.rate ?? null,
              paymentStatus: "pending",
              paymentRequestedAt: new Date().toISOString(),
              pendingAmount: data.amount,
            }
          : s
      );
      setCheckoutPlan(null);
      setNotice("Ödeme bildiriminiz alındı. Havaleniz kontrol edilip onaylanınca aboneliğiniz aktif olur.");
      router.refresh();
    } catch {
      setCheckoutError("Bağlantı hatası oluştu.");
    } finally {
      setBusy(false);
    }
  };

  // During the trial or a paid period the owner may switch plans; the next payment uses the new price.
  const switchPlan = async (plan: Plan) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/subscription", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Plan değiştirilemedi.");
        return false;
      }
      setSub((s) => (s ? { ...s, plan: data.plan, monthlyPrice: data.monthlyPrice } : s));
      return true;
    } catch {
      setError("Bağlantı hatası oluştu.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const startTrial = async () => {
    if (chosen !== currentPlan && !(await switchPlan(chosen))) return;
    router.push("/dashboard");
    router.refresh();
  };

  const status = !access.active
    ? { label: "Süresi doldu", cls: "bg-danger-soft text-danger border-danger-line" }
    : access.kind === "paid"
      ? { label: "Aktif", cls: "bg-brand-soft text-brand-ink border-brand-line" }
      : { label: "Ücretsiz deneme", cls: "bg-pending-soft text-pending border-pending-line" };

  return (
    <div className="space-y-5">
      <PageHeader
        title={welcome ? "Paketinizi seçin" : "Abonelik"}
        description={
          welcome
            ? "Kaydınız tamamlandı. Hemen satın alabilir ya da önce 3 gün ücretsiz deneyebilirsiniz."
            : "Paketinizi, deneme sürenizi ve ödemelerinizi buradan yönetin."
        }
      />

      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-control border border-brand-line bg-brand-soft px-3 py-2 text-sm text-brand-ink">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {notice}
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {!welcome && (
        <Panel>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-ink">CalendlyGo {PLAN_NAMES[currentPlan]}</h2>
            <span className={cn("inline-flex items-center rounded-control border px-1.5 py-0.5 text-xs font-medium leading-4", status.cls)}>
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-3">
            {!access.active
              ? "Panel ve randevu sayfanız kapalı. Devam etmek için aşağıdan bir paket satın alın."
              : access.kind === "paid"
                ? `Aboneliğiniz ${access.endsAt ? new Date(access.endsAt).toLocaleDateString("tr-TR") : ""} tarihine kadar aktif (${daysLeft} gün).`
                : `Ücretsiz denemenizin bitmesine ${daysLeft} gün kaldı. Süre bitince panel ve randevu sayfanız kapanır.`}
          </p>
          {initialActiveDiscount && (
            <p className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3 text-sm text-ink-3">
              <Tag className="h-4 w-4 text-brand" aria-hidden="true" />
              <span className="font-medium text-ink">{initialActiveDiscount.code}</span>· %{initialActiveDiscount.percentOff} indirim, kalan{" "}
              {initialActiveDiscount.monthsRemaining} ay
            </p>
          )}
        </Panel>
      )}

      {pending && (
        <Panel>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pending-soft text-pending">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold text-ink">Ödemeniz kontrol ediliyor</h2>
              <p className="mt-0.5 text-sm text-ink-3">
                {PLAN_NAMES[currentPlan]} ({PERIOD_NAMES[periodOf(pending)].toLowerCase()}) paketi için{" "}
                {formatUSD(pending.pendingAmount ?? pending.monthlyPrice)}
                {pending.pendingAmountTry ? ` (${formatTL(pending.pendingAmountTry)})` : ""} havale bildiriminiz{" "}
                {new Date(pending.paymentRequestedAt!).toLocaleDateString("tr-TR")} tarihinde alındı. Ödeme hesabımıza geçip
                onaylandığında aboneliğiniz otomatik olarak aktif olur.
              </p>
              <BankDetails bank={bank} reference={reference} copied={copied} onCopy={copy} className="mt-3" />
            </div>
          </div>
        </Panel>
      )}

      <div className="flex justify-center">
        <div className="inline-flex gap-1 rounded-control border border-line bg-surface-muted p-1" role="radiogroup" aria-label="Ödeme dönemi">
          {BILLING_PERIODS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={period === option}
              onClick={() => setPeriod(option)}
              className={cn(
                "rounded-[6px] px-4 py-1.5 text-sm font-medium transition-colors",
                period === option ? "bg-surface text-ink shadow-raised" : "text-ink-3 hover:text-ink"
              )}
            >
              {PERIOD_NAMES[option]}
              {option === "YEARLY" && (
                <span className="ml-1.5 rounded-full bg-brand-soft px-1.5 py-0.5 text-[11px] font-semibold text-brand-ink">
                  %{yearlySavingPercent("PERSON")} indirim
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" role="radiogroup" aria-label="Paket">
        {PLANS.map((plan) => {
          const selected = chosen === plan;
          const isCurrent = plan === currentPlan;
          return (
            <div
              key={plan}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onClick={() => setChosen(plan)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setChosen(plan);
                }
              }}
              className={cn(
                "flex cursor-pointer flex-col rounded-panel border bg-surface p-5 shadow-panel transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                selected ? "border-brand ring-1 ring-brand" : "border-line hover:border-line-strong"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">{PLAN_NAMES[plan]}</h3>
                  <p className="text-sm text-ink-3">{PLAN_INFO[plan].tagline}</p>
                </div>
                {isCurrent && !welcome && (
                  <span className="rounded-full border border-brand-line bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                    Mevcut paket
                  </span>
                )}
              </div>
              <p className="mt-4">
                <span className="font-display text-3xl font-bold tabular-nums text-ink">{formatUSD(priceOf(plan))}</span>
                <span className="text-sm text-ink-3"> {PERIOD_SUFFIX[period]}</span>
                {period === "YEARLY" && (
                  <span className="mt-0.5 block text-xs text-ink-3">
                    Ayda {formatUSD(priceOf(plan) / 12)} · aylık ödemeye göre {formatUSD(PLAN_PRICES[plan].MONTHLY * 12 - priceOf(plan))} tasarruf
                  </span>
                )}
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {PLAN_INFO[plan].features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-ink-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant={selected ? "primary" : "secondary"}
                className="mt-5 w-full"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  openCheckout(plan);
                }}
              >
                Satın al
              </Button>
              {!welcome && access.active && !isCurrent && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (await switchPlan(plan)) setNotice(`Paketiniz ${PLAN_NAMES[plan]} olarak değiştirildi.`);
                  }}
                  className="mt-2 text-sm font-medium text-ink-3 hover:text-ink disabled:opacity-50"
                >
                  {access.kind === "trial" ? "Denemeye bu paketle devam et" : "Sonraki ödemeden itibaren bu pakete geç"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {welcome && (
        <div className="flex flex-col items-center gap-1 pt-1 text-center">
          <button
            type="button"
            onClick={startTrial}
            disabled={busy}
            className="text-base font-semibold text-brand hover:text-brand-hover hover:underline disabled:opacity-50"
          >
            3 gün ücretsiz deneyin →
          </button>
          <p className="text-xs text-ink-3">
            Seçtiğiniz {PLAN_NAMES[chosen]} paketiyle başlar. Kart bilgisi gerekmez; süre bitince panel kapanır.
          </p>
        </div>
      )}

      {/* Bank transfer (havale/EFT) */}
      <Modal
        isOpen={checkoutPlan !== null}
        onClose={() => setCheckoutPlan(null)}
        title={checkoutPlan ? `${PLAN_NAMES[checkoutPlan]} paketi · Havale/EFT` : ""}
      >
        {checkoutPlan && (
          <div className="space-y-4 text-sm">
            <div className="flex items-baseline justify-between rounded-control bg-surface-muted px-3 py-2.5">
              <span className="text-ink-2">Ödenecek tutar ({period === "YEARLY" ? "1 yıl" : "1 ay"})</span>
              <span className="text-right">
                {discountPercent > 0 && (
                  <span className="mr-1.5 text-xs text-ink-3 line-through">{formatUSD(priceOf(checkoutPlan))}</span>
                )}
                <span className="font-display text-lg font-bold tabular-nums text-ink">{formatUSD(amountFor(checkoutPlan))}</span>
              </span>
            </div>
            <p className="-mt-2 text-xs text-ink-3">
              {rate ? (
                <>
                  Havale tutarı:{" "}
                  <span className="font-semibold text-ink">{formatTL(usdToTryDisplay(amountFor(checkoutPlan), rate.rate))}</span> (TCMB
                  döviz satış kuru {rate.rate.toLocaleString("tr-TR", { maximumFractionDigits: 4 })}
                  {rate.date ? `, ${rate.date}` : ""}). Kesin tutar bildirimi gönderdiğiniz andaki kurla sabitlenir.
                </>
              ) : (
                "Güncel kur şu an alınamadı; bildirim gönderilirken o günün kuruyla TL tutarı hesaplanır."
              )}
            </p>

            {!initialActiveDiscount &&
              (couponPercent ? (
                <div className="flex items-center justify-between rounded-control border border-brand-line bg-brand-soft px-3 py-2 text-brand-ink">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" aria-hidden="true" />
                    {couponPercent.code} · %{couponPercent.percentOff} indirim
                  </span>
                  <button
                    type="button"
                    aria-label="İndirim kodunu kaldır"
                    onClick={() => {
                      setCouponPercent(null);
                      setCouponInput("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Field label="İndirim kodu (isteğe bağlı)" htmlFor="coupon">
                  <div className="flex gap-2">
                    <Input id="coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="KOD" />
                    <Button onClick={applyCoupon} disabled={!couponInput.trim()}>
                      Uygula
                    </Button>
                  </div>
                  {couponError && <p className="mt-1 text-xs text-danger">{couponError}</p>}
                </Field>
              ))}

            <div>
              <p className="mb-2 font-medium text-ink">1. Tutarı aşağıdaki hesaba gönderin</p>
              <BankDetails bank={bank} reference={reference} copied={copied} onCopy={copy} />
            </div>
            <div>
              <p className="font-medium text-ink">2. Ödeme bildirimini gönderin</p>
              <p className="mt-0.5 text-ink-3">
                Açıklamaya <span className="font-semibold text-ink">{reference}</span> kodunu yazmayı unutmayın. Ödemeniz
                onaylanınca aboneliğiniz 30 gün için aktif olur ve size bildirim gelir.
              </p>
            </div>

            {checkoutError && (
              <p role="alert" className="rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-danger">
                {checkoutError}
              </p>
            )}
            <Button variant="primary" className="w-full" onClick={sendPaymentRequest} disabled={busy || !bank}>
              {busy ? "Gönderiliyor…" : "Ödemeyi yaptım, bildirimi gönder"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function BankDetails({
  bank,
  reference,
  copied,
  onCopy,
  className,
}: {
  bank: Bank | null;
  reference: string;
  copied: string;
  onCopy: (label: string, value: string) => void;
  className?: string;
}) {
  if (!bank) {
    return (
      <p className={cn("flex items-start gap-2 rounded-control border border-pending-line bg-pending-soft px-3 py-2 text-sm text-ink-2", className)}>
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-pending" aria-hidden="true" />
        Banka bilgileri henüz eklenmedi. Lütfen destek talebi oluşturun, size hemen iletelim.
      </p>
    );
  }
  const rows: [string, string][] = [
    ["Alıcı", bank.accountName],
    ["Banka", bank.bankName],
    ["IBAN", bank.iban],
    ["Açıklama", reference],
  ];
  return (
    <dl className={cn("divide-y divide-line rounded-control border border-line", className)}>
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="flex items-center gap-1.5 text-xs text-ink-3">
              {label === "Banka" && <Landmark className="h-3.5 w-3.5" aria-hidden="true" />}
              {label}
            </dt>
            <dd className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium text-ink tabular-nums">{value}</span>
              {(label === "IBAN" || label === "Açıklama") && (
                <button
                  type="button"
                  onClick={() => onCopy(label, value)}
                  className="shrink-0 text-ink-3 hover:text-ink"
                  aria-label={`${label} kopyala`}
                >
                  {copied === label ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </dd>
          </div>
        ))}
    </dl>
  );
}

/** Same rounding as the server (exchangeRate.usdToTry): up to the kuruş. */
function usdToTryDisplay(usd: number, rate: number) {
  return Math.ceil(usd * rate * 100 - 1e-6) / 100;
}
