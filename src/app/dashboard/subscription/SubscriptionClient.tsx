"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { formatCurrency } from "@/lib/utils";

interface SubscriptionClientProps {
  business: any;
  initialSubscription: any;
}

export default function SubscriptionClient({
  business,
  initialSubscription,
}: SubscriptionClientProps) {
  const [sub, setSub] = useState(initialSubscription);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [gateway, setGateway] = useState<"PayTR" | "iyzico">("PayTR");
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");

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

    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: gateway, planType: "PRO" }),
      });
      const data = await res.json();
      if (data.subscription) {
        setSub(data.subscription);
        setIsCheckoutOpen(false);
        setSuccessNotice(
          `${gateway} 3D Secure doğrulaması onaylandı! Aboneliğiniz 89 TL / Ay olarak aktif edildi.`
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Abonelik & Fatura Yönetimi
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          RandevuGo SaaS planınızı, deneme sürenizi ve ödeme yöntemlerinizi buradan yönetin.
        </p>
      </div>

      {successNotice && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Current Plan Overview Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">
                  {sub?.status === "active" ? "RandevuGo Pro Plan" : "3 Gün Ücretsiz Deneme"}
                </h3>
                {sub?.status === "active" ? (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    Aktif
                  </span>
                ) : sub?.status === "expired" ? (
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    Süresi Doldu
                  </span>
                ) : (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    Deneme Sürümü
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {sub?.status === "active"
                  ? "Sınırsız randevu, çalışan yönetimi ve sayfa tasarlayıcı dahil."
                  : `Deneme sürenizin bitmesine ${daysRemaining} gün kaldı.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-indigo-500/25 hover:opacity-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{sub?.status === "active" ? "Planı Yenile / Değiştir" : "Pro'ya Yükselt (89 TL / Ay)"}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar for Trial */}
        {sub?.status === "trial" && (
          <div className="pt-6 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Deneme Süresi Durumu</span>
              <span className="font-semibold text-amber-400">{daysRemaining} / 3 Gün Kaldı</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-500"
                style={{ width: `${Math.max(10, (daysRemaining / 3) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Plan Details & Features Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pro Plan Card */}
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Aylık Abonelik
              </span>
              <h4 className="text-xl font-bold text-slate-100 mt-1">İşletme Pro Paketi</h4>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-slate-100">89 TL</span>
              <span className="text-xs text-slate-400 block">/ ay</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            Küçük ve orta ölçekli işletmelerin tüm randevu, müşteri ve web sayfası ihtiyaçlarını karşılayan hepsi bir arada çözüm.
          </p>

          <ul className="space-y-3 text-xs text-slate-300 mb-6">
            {[
              "Sınırsız Online Rezervasyon Kabulü",
              "Özel Web Rezervasyon Sayfası (randevugo.com/adiniz)",
              "Görsel Sürükle-Bırak Sayfa Tasarlayıcı",
              "Sınırsız Hizmet & Çalışan Tanımlama",
              "Müşteri İlişkileri Yönetimi (CRM)",
              "WhatsApp Rezervasyon Bildirim Bağlantısı",
              "Doğrulanmış Müşteri Yorum ve Puanlama Motoru",
              "Yapay Zeka Destekli Yoğun Saat Analizi",
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            Hemen Abone Ol (89 TL / Ay)
          </button>
        </div>

        {/* Payment Gateways & Sandbox Testing Card */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
            <h4 className="text-sm font-bold text-slate-100 mb-2">Ödeme Entegrasyonları</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              RandevuGo, Türkiye'nin lider ödeme sağlayıcıları PayTR ve iyzico ile tam uyumlu 3D Secure altyapısına sahiptir.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">PayTR</span>
                  <span className="text-[10px] text-slate-400">Sanal POS & 3D Secure</span>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">iyzico</span>
                  <span className="text-[10px] text-slate-400">Korumalı Alışveriş</span>
                </div>
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Test Status Simulator (For developer / tester) */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              SaaS Test Simülatörü
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Platformun kısıtlamalarını ve farklı abonelik durumlarını anında test etmek için aşağıdaki butonları kullanabilirsiniz:
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => handleSimulateStatus("trial")}
                className="rounded-xl border border-slate-700 bg-slate-800/80 py-2 font-medium text-amber-300 hover:bg-slate-700"
              >
                Deneme Yap
              </button>
              <button
                onClick={() => handleSimulateStatus("active")}
                className="rounded-xl border border-slate-700 bg-slate-800/80 py-2 font-medium text-emerald-300 hover:bg-slate-700"
              >
                Pro Aktif Yap
              </button>
              <button
                onClick={() => handleSimulateStatus("expired")}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 py-2 font-medium text-rose-400 hover:bg-rose-500/20"
              >
                Süresi Doldur
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PayTR / iyzico Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Güvenli Ödeme Ekranı (89 TL / Ay)"
      >
        <form onSubmit={handleCheckout} className="space-y-4 text-xs">
          {/* Gateway selector */}
          <div>
            <label className="block font-semibold text-slate-300 mb-2">Ödeme Altyapısı</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGateway("PayTR")}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  gateway === "PayTR"
                    ? "border-indigo-500 bg-indigo-950/40 text-indigo-300 ring-2 ring-indigo-500"
                    : "border-slate-800 bg-slate-950/40 text-slate-400"
                }`}
              >
                PayTR Sanal POS
              </button>
              <button
                type="button"
                onClick={() => setGateway("iyzico")}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  gateway === "iyzico"
                    ? "border-indigo-500 bg-indigo-950/40 text-indigo-300 ring-2 ring-indigo-500"
                    : "border-slate-800 bg-slate-950/40 text-slate-400"
                }`}
              >
                iyzico Ödeme
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Kart Numarası</label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2.5 text-sm text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Kart Üzerindeki İsim</label>
            <input
              type="text"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Son Kullanma (AA/YY)</label>
              <input
                type="text"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">CVV / Güvenlik Kodu</label>
              <input
                type="text"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Çekilecek Tutar:</span>
            <span className="text-base font-extrabold text-emerald-400">89,00 TL</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-95 disabled:opacity-50 transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? "3D Secure Onaylanıyor..." : `89 TL ile Abone Ol (${gateway})`}</span>
          </button>
        </form>
      </Modal>
    </div>
  );
}
