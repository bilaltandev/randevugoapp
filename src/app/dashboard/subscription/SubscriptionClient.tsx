"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { CreditCard, CheckCircle2, Check, ShieldCheck, Lock, Tag, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { applyPercentOff, formatTL, normalizeCouponCode } from "@/lib/couponOptions";

interface ActiveDiscount {
  code: string;
  percentOff: number;
  monthsRemaining: number;
}

interface CouponQuote {
  code: string;
  percentOff: number;
  durationMonths: number;
  discountedPrice: number;
}

interface SubscriptionClientProps {
  business: any;
  initialSubscription: any;
  basePrice: number;
  initialActiveDiscount: ActiveDiscount | null;
}

export default function SubscriptionClient({
  business,
  initialSubscription,
  basePrice,
  initialActiveDiscount,
}: SubscriptionClientProps) {
  const [sub, setSub] = useState(initialSubscription);
  const [activeDiscount, setActiveDiscount] = useState<ActiveDiscount | null>(initialActiveDiscount);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [gateway, setGateway] = useState<"PayTR" | "iyzico">("PayTR");
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  // Coupon entry (only when no discount is already running)
  const [couponInput, setCouponInput] = useState("");
  const [couponQuote, setCouponQuote] = useState<CouponQuote | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // What this payment will charge: a running discount wins, else a validated new code.
  const appliedPercent = activeDiscount?.percentOff ?? couponQuote?.percentOff ?? 0;
  const chargeAmount = appliedPercent ? applyPercentOff(basePrice, appliedPercent) : basePrice;
  const basePriceText = formatTL(basePrice);

  const handleApplyCoupon = async () => {
    const code = normalizeCouponCode(couponInput);
    if (!code) return;
    setCheckingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/subscription/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponQuote(null);
        setCouponError(data.error || "İndirim kodu uygulanamadı.");
        return;
      }
      setCouponQuote(data);
    } catch {
      setCouponError("Bağlantı hatası oluştu.");
    } finally {
      setCheckingCoupon(false);
    }
  };

  const clearCoupon = () => {
    setCouponQuote(null);
    setCouponInput("");
    setCouponError("");
  };

  // Card simulation fields
  const [cardNumber, setCardNumber] = useState("5428 •••• •••• 9012");
  const [cardHolder, setCardHolder] = useState(business.name);
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("342");

  const now = new Date();
  let daysRemaining = 0;
  if (sub?.status === "trial" && sub?.trialEndDate) {
    const diff = new Date(sub.trialEndDate).getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  } else if (sub?.status === "active" && sub?.subscriptionEndDate) {
    const diff = new Date(sub.subscriptionEndDate).getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Handle Pro Checkout (PayTR / iyzico mock)
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessNotice("");
    setCheckoutError("");

    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: gateway, planType: "PRO", couponCode: couponQuote?.code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || "Ödeme tamamlanamadı.");
        return;
      }
      if (data.subscription) {
        setSub(data.subscription);
        setActiveDiscount(data.activeDiscount);
        clearCoupon();
        setIsCheckoutOpen(false);
        setSuccessNotice(
          data.appliedCode
            ? `${gateway} 3D Secure doğrulaması onaylandı! ${data.appliedCode} kodu ile %${data.percentOff} indirimli ${formatTL(data.chargedAmount)} ödemeniz alındı.`
            : `${gateway} 3D Secure doğrulaması onaylandı! Aboneliğiniz ${formatTL(data.chargedAmount)} / ay olarak aktif edildi.`
        );
        confetti({ particleCount: 100, spread: 70 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Test status switcher
  const handleSimulateStatus = async (status: string) => {
    try {
      const res = await fetch("/api/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.subscription) {
        setSub(data.subscription);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isActive = sub?.status === "active";
  const isExpired = sub?.status === "expired";

  const statusBadge = isActive
    ? { label: "Aktif", cls: "bg-brand-soft text-brand-ink border-brand-line" }
    : isExpired
    ? { label: "Süresi doldu", cls: "bg-danger-soft text-danger border-danger-line" }
    : { label: "Deneme sürümü", cls: "bg-pending-soft text-pending border-pending-line" };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Abonelik"
        description="Planınızı, deneme sürenizi ve ödeme yöntemlerinizi yönetin."
      />

      {successNotice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-control border border-brand-line bg-brand-soft px-3 py-2 text-sm text-brand-ink"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {successNotice}
        </div>
      )}

      {/* Current plan */}
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-ink">
                {isActive ? "RandevuGo Pro" : "Ücretsiz deneme"}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center rounded-control border px-1.5 py-0.5 text-xs font-medium leading-4",
                  statusBadge.cls
                )}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-3">
              {isActive
                ? `Sınırsız randevu, çalışan yönetimi ve sayfa düzenleyici dahil. Yenilemeye ${daysRemaining} gün.`
                : isExpired
                ? "Deneme süreniz sona erdi. Rezervasyon almaya devam etmek için Pro'ya geçin."
                : `Deneme sürenizin bitmesine ${daysRemaining} gün kaldı.`}
            </p>
          </div>

          <Button variant="primary" onClick={() => setIsCheckoutOpen(true)}>
            {isActive ? "Planı yönet" : `Pro'ya geç · ${basePriceText}/ay`}
          </Button>
        </div>

        {activeDiscount && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-sm">
            <Tag className="h-4 w-4 text-brand" aria-hidden="true" />
            <span className="font-medium text-ink">{activeDiscount.code}</span>
            <span className="text-ink-3">
              · %{activeDiscount.percentOff} indirim · sonraki {activeDiscount.monthsRemaining} aylık ödemede{" "}
              {formatTL(applyPercentOff(basePrice, activeDiscount.percentOff))}
            </span>
          </div>
        )}

        {sub?.status === "trial" && (
          <div className="mt-5 space-y-1.5 border-t border-line pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-ink-3">Deneme süresi</span>
              <span className="tabular-nums text-ink">{daysRemaining} / 3 gün kaldı</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-pending"
                style={{ width: `${Math.max(4, (daysRemaining / 3) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Pro plan */}
        <Panel
          title="İşletme Pro"
          description="Randevu, müşteri ve web sayfası ihtiyaçlarınız için hepsi bir arada."
          action={
            <p className="text-right">
              <span className="text-xl font-semibold tabular-nums text-ink">{basePriceText}</span>
              <span className="text-sm text-ink-3"> / ay</span>
            </p>
          }
        >
          <ul className="space-y-2.5">
            {[
              "Sınırsız online rezervasyon",
              "Özel rezervasyon sayfası (randevugo.com/adiniz)",
              "Sürükle-bırak sayfa düzenleyici",
              "Sınırsız hizmet ve çalışan",
              "Müşteri yönetimi (CRM)",
              "WhatsApp bildirim bağlantısı",
              "Doğrulanmış müşteri yorumları",
              "Yapay zeka destekli yoğunluk analizi",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-ink-2">
                <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>

          <Button variant="primary" className="mt-5 w-full" onClick={() => setIsCheckoutOpen(true)}>
            Abone ol
          </Button>
        </Panel>

        <div className="space-y-5">
          <Panel title="Ödeme altyapısı" description="PayTR ve iyzico ile 3D Secure ödeme.">
            <ul className="divide-y divide-line rounded-control border border-line">
              {[
                ["PayTR", "Sanal POS ve 3D Secure"],
                ["iyzico", "Korumalı alışveriş"],
              ].map(([name, desc]) => (
                <li key={name} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink">{name}</p>
                    <p className="text-xs text-ink-3">{desc}</p>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-ink-3" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </Panel>

          {/* Test status simulator (developer / tester) */}
          <Panel
            title="Test simülatörü"
            description="Farklı abonelik durumlarını ve kısıtlamaları anında denemek için."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button size="sm" onClick={() => handleSimulateStatus("trial")}>
                Deneme yap
              </Button>
              <Button size="sm" onClick={() => handleSimulateStatus("active")}>
                Pro aktif yap
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleSimulateStatus("expired")}>
                Süresi doldur
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      {/* PayTR / iyzico Checkout Modal */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title={`Güvenli ödeme · ${basePriceText} / ay`}>
        <form onSubmit={handleCheckout} className="space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink-2">Ödeme altyapısı</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["PayTR", "iyzico"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={gateway === g}
                  onClick={() => setGateway(g)}
                  className={cn(
                    "h-10 rounded-control border text-sm font-medium transition-colors",
                    gateway === g
                      ? "border-brand bg-brand-soft text-brand-ink"
                      : "border-line-strong bg-surface text-ink-2 hover:bg-surface-muted"
                  )}
                >
                  {g === "PayTR" ? "PayTR Sanal POS" : "iyzico"}
                </button>
              ))}
            </div>
          </fieldset>

          <Field label="Kart numarası" htmlFor="card-number">
            <div className="relative">
              <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
              <Input
                id="card-number"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="pl-9 font-mono"
              />
            </div>
          </Field>

          <Field label="Kart üzerindeki isim" htmlFor="card-holder">
            <Input id="card-holder" type="text" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Son kullanma (AA/YY)" htmlFor="card-expiry">
              <Input
                id="card-expiry"
                type="text"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                className="font-mono"
              />
            </Field>
            <Field label="CVV" htmlFor="card-cvc">
              <Input
                id="card-cvc"
                type="text"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                className="font-mono"
              />
            </Field>
          </div>

          {activeDiscount ? (
            <p className="flex items-center gap-2 rounded-control border border-brand-line bg-brand-soft px-3 py-2 text-sm text-brand-ink">
              <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
              {activeDiscount.code} indiriminiz bu ödemeye otomatik uygulanır (%{activeDiscount.percentOff}, {activeDiscount.monthsRemaining} ay kaldı).
            </p>
          ) : couponQuote ? (
            <div className="flex items-center justify-between gap-2 rounded-control border border-brand-line bg-brand-soft px-3 py-2 text-sm text-brand-ink">
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-medium">{couponQuote.code}</span> · %{couponQuote.percentOff} indirim · ilk{" "}
                  {couponQuote.durationMonths} ay
                </span>
              </span>
              <button type="button" onClick={clearCoupon} className="rounded-control p-1 hover:bg-brand/10" aria-label="İndirim kodunu kaldır">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Field label="İndirim kodu" htmlFor="coupon-code">
              <div className="flex gap-2">
                <Input
                  id="coupon-code"
                  type="text"
                  autoComplete="off"
                  placeholder="Kodunuz varsa girin"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    setCouponError("");
                  }}
                  onKeyDown={(e) => {
                    // Enter here should apply the code, not submit the payment form.
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyCoupon();
                    }
                  }}
                  className="font-mono uppercase"
                />
                <Button type="button" onClick={handleApplyCoupon} disabled={checkingCoupon || !couponInput.trim()}>
                  {checkingCoupon ? "Kontrol..." : "Uygula"}
                </Button>
              </div>
              {couponError && <p className="text-xs text-danger">{couponError}</p>}
            </Field>
          )}

          <div className="space-y-1 rounded-control bg-surface-muted px-3 py-2 text-sm">
            {appliedPercent > 0 && (
              <div className="flex items-center justify-between text-ink-3">
                <span>Aylık ücret</span>
                <span className="tabular-nums line-through">{basePriceText}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-ink-3">Çekilecek tutar</span>
              <span className="font-semibold tabular-nums text-ink">{formatTL(chargeAmount)}</span>
            </div>
          </div>

          {checkoutError && <p className="text-sm text-danger">{checkoutError}</p>}

          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            <Lock className="w-4 h-4" aria-hidden="true" />
            {loading ? "3D Secure onaylanıyor..." : `${formatTL(chargeAmount)} ile abone ol (${gateway})`}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
