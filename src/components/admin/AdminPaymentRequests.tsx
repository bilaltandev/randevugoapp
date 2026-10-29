"use client";

import React, { useState } from "react";
import { Check, Clock, Copy, Eye, Inbox, Loader2, Mail, Phone, X } from "lucide-react";
import { formatTL as formatCurrencyTry } from "@/lib/couponOptions";
import { PERIOD_NAMES, PLAN_NAMES, formatUSD, paymentReference, periodOf, planOf } from "@/lib/plans";

/** A business with an open bank transfer request (owner chose a plan and said they'll pay by havale/EFT). */
export function hasPendingPayment(b: any): boolean {
  return b.subscription?.paymentStatus === "pending" && !!b.subscription?.paymentRequestedAt;
}

interface Props {
  businesses: any[];
  /** Runs an admin action (ACTIVATE_SUBSCRIPTION / REJECT_PAYMENT) and refreshes the data. */
  onAction: (payload: { action: string; businessId: string }) => Promise<void>;
  /** "<action>:<businessId>" of the request in flight, if any. */
  busyKey: string | null;
  onOpenBusiness: (b: any) => void;
}

/**
 * "Ödeme talepleri": every open havale/EFT request in one list, oldest first, so the admin can match the
 * bank statement against the reference codes and confirm or reject each one right here.
 */
export function AdminPaymentRequests({ businesses, onAction, busyKey, onOpenBusiness }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const requests = businesses
    .filter(hasPendingPayment)
    .sort((a, b) => new Date(a.subscription.paymentRequestedAt).getTime() - new Date(b.subscription.paymentRequestedAt).getTime());

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const confirm = (b: any) => {
    const sub = b.subscription;
    const period = periodOf(sub) === "YEARLY" ? "1 yıl" : "1 ay";
    if (window.confirm(`${b.name} için ödeme onaylansın mı?\n\nReferans: ${paymentReference(b.id)}\nAbonelik ${period} uzayacak.`)) {
      onAction({ action: "ACTIVATE_SUBSCRIPTION", businessId: b.id });
    }
  };

  const reject = (b: any) => {
    if (window.confirm(`${b.name} için ödeme talebi reddedilsin mi?\n\nHesaba bu referansla para gelmediyse reddedin; işletme yeniden talep oluşturabilir.`)) {
      onAction({ action: "REJECT_PAYMENT", businessId: b.id });
    }
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <Inbox className="h-6 w-6" />
        </span>
        <p className="text-sm font-bold text-slate-200">Bekleyen ödeme talebi yok</p>
        <p className="max-w-sm text-xs text-slate-400">
          Bir işletme paket seçip havale/EFT ile ödeyeceğini bildirdiğinde burada görünür.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400">
          Banka hesabınızdaki havale açıklamasındaki <span className="font-bold text-amber-400">CG-…</span> koduyla eşleştirip onaylayın.
          En eski talep en üstte.
        </p>
        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">{requests.length} talep bekliyor</span>
      </div>

      <ul className="space-y-3">
        {requests.map((b) => {
          const sub = b.subscription;
          const ref = paymentReference(b.id);
          const confirming = busyKey === `ACTIVATE_SUBSCRIPTION:${b.id}`;
          const rejecting = busyKey === `REJECT_PAYMENT:${b.id}`;
          const busy = confirming || rejecting;
          const requested = new Date(sub.paymentRequestedAt);
          const waitingDays = Math.floor((Date.now() - requested.getTime()) / 86_400_000);
          return (
            <li key={b.id} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                {/* Business and owner */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-black text-slate-100">{b.name}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                      {PLAN_NAMES[planOf(sub)]} · {PERIOD_NAMES[periodOf(sub)]}
                    </span>
                    {sub.pendingCouponCode && (
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-300">{sub.pendingCouponCode} kodu</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    <span>{b.user?.name}</span>
                    {b.user?.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {b.user.email}
                      </span>
                    )}
                    {(b.user?.phone || b.phone) && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {b.user?.phone || b.phone}
                      </span>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    {requested.toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    {waitingDays > 0 && <span className={waitingDays >= 3 ? "font-bold text-rose-400" : "text-slate-400"}> · {waitingDays} gündür bekliyor</span>}
                  </div>
                </div>

                {/* Amount and reference */}
                <div className="flex items-center gap-3 lg:w-[300px]">
                  <div className="flex-1">
                    <p className="text-lg font-black text-slate-100">{formatUSD(sub.pendingAmount ?? sub.monthlyPrice)}</p>
                    {sub.pendingAmountTry ? (
                      <p className="text-[11px] text-slate-400">
                        {formatCurrencyTry(sub.pendingAmountTry)} · kur {sub.pendingRate}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500">TL tutarı hesaplanamadı</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(ref)}
                    title="Referans kodunu kopyala"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 font-mono text-xs font-bold text-amber-300 hover:bg-amber-500/20"
                  >
                    {ref}
                    {copied === ref ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirm(b)}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 px-4 text-xs font-black text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-60 lg:flex-none"
                  >
                    {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {confirming ? "Onaylanıyor…" : "Ödemeyi onayla"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => reject(b)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    Reddet
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenBusiness(b)}
                    title="İşletme detayı"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
