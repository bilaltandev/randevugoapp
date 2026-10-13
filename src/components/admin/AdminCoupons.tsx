"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, Loader2, Plus, Power, Shuffle, Ticket, Trash2, X } from "lucide-react";
import {
  applyPercentOff,
  DEFAULT_MONTHLY_PRICE,
  MAX_COUPON_DURATION_MONTHS,
  normalizeCouponCode,
} from "@/lib/couponOptions";
import { formatUSD } from "@/lib/plans";

interface CouponRedemptionRow {
  id: string;
  percentOff: number;
  monthsRemaining: number;
  createdAt: string;
  business: { id: string; name: string };
}

interface Coupon {
  id: string;
  code: string;
  percentOff: number;
  durationMonths: number;
  expiresAt: string | null;
  maxRedemptions: number | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  redemptions: CouponRedemptionRow[];
}

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none";
const LABEL_CLASS = "text-[11px] font-semibold text-slate-400 block mb-1.5";
const CARD_CLASS = "rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl";
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
const GHOST_BTN =
  "inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-60";

function couponState(c: Coupon): { label: string; cls: string } {
  if (!c.isActive) return { label: "Pasif", cls: "bg-slate-700/40 text-slate-400 border-slate-600" };
  if (c.expiresAt && new Date(c.expiresAt) < new Date())
    return { label: "Süresi doldu", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" };
  if (c.maxRedemptions !== null && c.redemptions.length >= c.maxRedemptions)
    return { label: "Limit doldu", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
  return { label: "Aktif", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
}

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return "RG-" + Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function AdminCoupons({ notify }: { notify: (type: "success" | "error", text: string) => void }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteFor, setDeleteFor] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("20");
  const [durationMonths, setDurationMonths] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/coupons")
      .then((res) => res.json())
      .then((data) => setCoupons(data.coupons ?? []))
      .catch(() => notify("error", "Kuponlar yüklenemedi."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setCode("");
    setPercentOff("20");
    setDurationMonths("1");
    setExpiresAt("");
    setMaxRedemptions("");
    setDescription("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, percentOff, durationMonths, expiresAt, maxRedemptions, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify("error", data.error || "Kupon oluşturulamadı.");
        return;
      }
      setCoupons((prev) => [data.coupon, ...prev]);
      resetForm();
      setShowCreate(false);
      notify("success", `${data.coupon.code} kuponu oluşturuldu.`);
    } catch {
      notify("error", "Bağlantı hatası oluştu.");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify("error", data.error || "Kupon güncellenemedi.");
        return;
      }
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? data.coupon : x)));
      notify("success", c.isActive ? `${c.code} pasife alındı.` : `${c.code} aktifleştirildi.`);
    } catch {
      notify("error", "Bağlantı hatası oluştu.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (c: Coupon) => {
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        notify("error", data.error || "Kupon silinemedi.");
        return;
      }
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
      notify("success", `${c.code} silindi.`);
    } catch {
      notify("error", "Bağlantı hatası oluştu.");
    } finally {
      setBusyId(null);
      setDeleteFor(null);
    }
  };

  const percentNum = Number(percentOff);
  const previewValid = Number.isInteger(percentNum) && percentNum >= 1 && percentNum <= 100;
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <div className={`${CARD_CLASS} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-400" />
            <span>İndirim Kuponları</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            İşletmeler kodu abonelik ödemesinde girer. İndirim, kodu kullandıkları aydan itibaren belirlenen ay sayısı
            kadar her aylık ödemeye otomatik uygulanır. Her işletme bir kodu yalnızca bir kez kullanabilir.
          </p>
        </div>
        {!showCreate && (
          <button type="button" onClick={() => setShowCreate(true)} className={`${PRIMARY_BTN} self-start sm:self-auto shrink-0`}>
            <Plus className="w-3.5 h-3.5" />
            <span>Kupon Oluştur</span>
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className={`${CARD_CLASS} space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-400" />
              Yeni Kupon
            </h3>
            <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white" aria-label="Formu kapat">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="coupon-code" className={LABEL_CLASS}>Kupon kodu</label>
              <div className="flex gap-2">
                <input
                  id="coupon-code"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[A-Za-z0-9_\-]{3,30}"
                  title="3-30 karakter; harf, rakam, - ve _"
                  placeholder="HOSGELDIN25"
                  value={code}
                  onChange={(e) => setCode(normalizeCouponCode(e.target.value))}
                  className={`${INPUT_CLASS} font-mono uppercase`}
                />
                <button type="button" onClick={() => setCode(randomCode())} className={GHOST_BTN} title="Rastgele kod üret">
                  <Shuffle className="w-3.5 h-3.5" />
                  <span className="sr-only">Rastgele kod üret</span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="coupon-percent" className={LABEL_CLASS}>İndirim yüzdesi (%)</label>
              <input
                id="coupon-percent"
                type="number"
                required
                min={1}
                max={100}
                step={1}
                value={percentOff}
                onChange={(e) => setPercentOff(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="coupon-duration" className={LABEL_CLASS}>İndirim süresi</label>
              <select
                id="coupon-duration"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className={INPUT_CLASS}
              >
                {Array.from({ length: MAX_COUPON_DURATION_MONTHS }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>İlk {m} ay</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="coupon-expires" className={LABEL_CLASS}>Son kullanım tarihi (boş = süresiz)</label>
              <input
                id="coupon-expires"
                type="date"
                min={today}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={`${INPUT_CLASS} [color-scheme:dark]`}
              />
            </div>

            <div>
              <label htmlFor="coupon-limit" className={LABEL_CLASS}>Toplam kullanım limiti (boş = sınırsız)</label>
              <input
                id="coupon-limit"
                type="number"
                min={1}
                step={1}
                placeholder="Sınırsız"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="coupon-description" className={LABEL_CLASS}>Açıklama (yalnızca admin görür)</label>
              <input
                id="coupon-description"
                maxLength={200}
                placeholder="Yeni üye kampanyası"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {previewValid && (
            <p className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
              Örnek: Person {formatUSD(DEFAULT_MONTHLY_PRICE)} yerine ilk {durationMonths} ödemede{" "}
              <span className="font-bold">{formatUSD(applyPercentOff(DEFAULT_MONTHLY_PRICE, percentNum))}</span> / ay
              {expiresAt && <> · {new Date(expiresAt).toLocaleDateString("tr-TR")} tarihine kadar kullanılabilir</>}
            </p>
          )}

          <button type="submit" disabled={creating} className={PRIMARY_BTN}>
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{creating ? "Oluşturuluyor..." : "Kuponu Oluştur"}</span>
          </button>
        </form>
      )}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="p-12 flex justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">Henüz indirim kuponu oluşturulmamış.</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {coupons.map((c) => {
              const state = couponState(c);
              const running = c.redemptions.filter((r) => r.monthsRemaining > 0).length;
              return (
                <li key={c.id} className="p-4 sm:px-6 space-y-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black text-amber-300 tracking-wide">{c.code}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${state.cls}`}>
                          {state.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        <span className="font-bold">%{c.percentOff} indirim</span> · ilk {c.durationMonths} ay ·{" "}
                        {c.expiresAt ? `Son kullanım: ${new Date(c.expiresAt).toLocaleDateString("tr-TR")}` : "Süresiz"} ·{" "}
                        Kullanım: {c.redemptions.length}
                        {c.maxRedemptions !== null ? ` / ${c.maxRedemptions}` : ""}
                        {running > 0 && ` (${running} devam ediyor)`}
                      </p>
                      {c.description && <p className="text-[11px] text-slate-500 mt-0.5">{c.description}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                        className={GHOST_BTN}
                        aria-expanded={expandedId === c.id}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedId === c.id ? "rotate-180" : ""}`} />
                        Kullananlar ({c.redemptions.length})
                      </button>
                      <button type="button" disabled={busyId === c.id} onClick={() => toggleActive(c)} className={GHOST_BTN}>
                        <Power className="w-3.5 h-3.5" />
                        {c.isActive ? "Pasife Al" : "Aktifleştir"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteFor(deleteFor === c.id ? null : c.id)}
                        className={`${GHOST_BTN} hover:!bg-rose-500/20 hover:!text-rose-200`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Sil
                      </button>
                    </div>
                  </div>

                  {expandedId === c.id && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
                      {c.redemptions.length === 0 ? (
                        <p className="p-4 text-center text-xs text-slate-500">Bu kupon henüz kullanılmadı.</p>
                      ) : (
                        <ul className="divide-y divide-slate-800">
                          {c.redemptions.map((r) => (
                            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs">
                              <span className="font-semibold text-slate-200">{r.business.name}</span>
                              <span className="text-slate-400">
                                {new Date(r.createdAt).toLocaleDateString("tr-TR")} ·{" "}
                                {r.monthsRemaining > 0 ? (
                                  <span className="text-emerald-300">{r.monthsRemaining} ay indirim kaldı</span>
                                ) : (
                                  "İndirim tamamlandı"
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {deleteFor === c.id && (
                    <div className="flex flex-col gap-2 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-rose-200">
                        {c.code} kalıcı olarak silinecek. İndirimi devam eden işletme varsa silme engellenir; o durumda
                        pasife alın.
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={() => setDeleteFor(null)} className={GHOST_BTN}>
                          Vazgeç
                        </button>
                        <button
                          type="button"
                          disabled={busyId === c.id}
                          onClick={() => handleDelete(c)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Kalıcı Olarak Sil
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
