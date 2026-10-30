"use client";

import React, { useEffect, useState } from "react";
import { Headset, KeyRound, Loader2, Plus, Power, Trash2, UserPlus, X } from "lucide-react";
import { MIN_AGENT_PASSWORD_LENGTH, SUPPORT_MAX_TRIAL_EXTENSION_DAYS } from "@/lib/supportOptions";

interface SupportAgent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

interface AdminSupportAgentsProps {
  notify: (type: "success" | "error", text: string) => void;
}

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none";
const LABEL_CLASS = "text-[11px] font-semibold text-slate-400 block mb-1.5";
const CARD_CLASS = "rounded-3xl admin-glass p-5 sm:p-6 backdrop-blur-xl";
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-white hover:bg-white/85 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
const GHOST_BTN =
  "inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-60";

export function AdminSupportAgents({ notify }: AdminSupportAgentsProps) {
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Inline password reset / delete confirmation
  const [passwordFor, setPasswordFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteFor, setDeleteFor] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/support-agents")
      .then((res) => res.json())
      .then((data) => setAgents(data.agents ?? []))
      .catch(() => notify("error", "Yetkili listesi yüklenemedi."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/support-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify("error", data.error || "Yetkili oluşturulamadı.");
        return;
      }
      setAgents((prev) => [data.agent, ...prev]);
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setShowCreate(false);
      notify("success", `${data.agent.name} yetkili olarak eklendi. Giriş adresi: /support/login`);
    } catch {
      notify("error", "Bağlantı hatası oluştu.");
    } finally {
      setCreating(false);
    }
  };

  const updateAgent = async (id: string, payload: Record<string, unknown>, successText: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/support-agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        notify("error", data.error || "Yetkili güncellenemedi.");
        return false;
      }
      setAgents((prev) => prev.map((a) => (a.id === id ? data.agent : a)));
      notify("success", successText);
      return true;
    } catch {
      notify("error", "Bağlantı hatası oluştu.");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleSetPassword = async (e: React.FormEvent, agent: SupportAgent) => {
    e.preventDefault();
    const ok = await updateAgent(agent.id, { password: newPassword }, `${agent.name} için yeni şifre kaydedildi.`);
    if (ok) {
      setPasswordFor(null);
      setNewPassword("");
    }
  };

  const handleDelete = async (agent: SupportAgent) => {
    setBusyId(agent.id);
    try {
      const res = await fetch(`/api/admin/support-agents/${agent.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        notify("error", data.error || "Yetkili silinemedi.");
        return;
      }
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      notify("success", `${agent.name} silindi. Üzerindeki talepler ortak kuyruğa döndü.`);
    } catch {
      notify("error", "Bağlantı hatası oluştu.");
    } finally {
      setBusyId(null);
      setDeleteFor(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${CARD_CLASS} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Headset className="w-5 h-5 text-amber-400" />
            <span>Destek Yetkilileri</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Yetkililer <span className="font-mono text-slate-300">/support/login</span> adresinden giriş yapar; işletme
            taleplerini yanıtlar, deneme süresini en fazla {SUPPORT_MAX_TRIAL_EXTENSION_DAYS} gün uzatabilir ve işletme sahibi şifresini sıfırlayabilir.
          </p>
        </div>
        {!showCreate && (
          <button type="button" onClick={() => setShowCreate(true)} className={`${PRIMARY_BTN} self-start sm:self-auto shrink-0`}>
            <Plus className="w-3.5 h-3.5" />
            <span>Yetkili Ekle</span>
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className={`${CARD_CLASS} space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              Yeni Yetkili
            </h3>
            <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white" aria-label="Formu kapat">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="agent-name" className={LABEL_CLASS}>Ad Soyad</label>
              <input id="agent-name" required value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label htmlFor="agent-email" className={LABEL_CLASS}>E-posta</label>
              <input
                id="agent-email"
                type="email"
                required
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="agent-phone" className={LABEL_CLASS}>Telefon (isteğe bağlı)</label>
              <input id="agent-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label htmlFor="agent-password" className={LABEL_CLASS}>İlk şifre (en az {MIN_AGENT_PASSWORD_LENGTH} karakter; büyük harf, rakam, özel karakter)</label>
              <input
                id="agent-password"
                type="text"
                required
                minLength={MIN_AGENT_PASSWORD_LENGTH}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>
          </div>
          <button type="submit" disabled={creating} className={PRIMARY_BTN}>
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>{creating ? "Ekleniyor..." : "Yetkiliyi Oluştur"}</span>
          </button>
        </form>
      )}

      <div className="rounded-3xl admin-glass overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="p-12 flex justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : agents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">Henüz destek yetkilisi eklenmemiş.</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {agents.map((agent) => (
              <li key={agent.id} className="p-4 sm:px-6 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">{agent.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          agent.isActive
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-700/40 text-slate-400 border border-slate-600"
                        }`}
                      >
                        {agent.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 break-all">
                      {agent.email}
                      {agent.phone ? ` · ${agent.phone}` : ""} · Eklenme: {new Date(agent.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === agent.id}
                      onClick={() =>
                        updateAgent(
                          agent.id,
                          { isActive: !agent.isActive },
                          agent.isActive ? `${agent.name} pasife alındı.` : `${agent.name} aktifleştirildi.`
                        )
                      }
                      className={GHOST_BTN}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {agent.isActive ? "Pasife Al" : "Aktifleştir"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordFor(passwordFor === agent.id ? null : agent.id);
                        setNewPassword("");
                        setDeleteFor(null);
                      }}
                      className={GHOST_BTN}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Şifre Belirle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteFor(deleteFor === agent.id ? null : agent.id);
                        setPasswordFor(null);
                      }}
                      className={`${GHOST_BTN} hover:!bg-rose-500/20 hover:!text-rose-200`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Sil
                    </button>
                  </div>
                </div>

                {passwordFor === agent.id && (
                  <form onSubmit={(e) => handleSetPassword(e, agent)} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label htmlFor={`agent-new-password-${agent.id}`} className="sr-only">Yeni şifre</label>
                    <input
                      id={`agent-new-password-${agent.id}`}
                      type="text"
                      required
                      minLength={MIN_AGENT_PASSWORD_LENGTH}
                      autoComplete="new-password"
                      placeholder="Yeni şifre (büyük harf, rakam, özel karakter)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${INPUT_CLASS} font-mono sm:max-w-xs`}
                    />
                    <button type="submit" disabled={busyId === agent.id} className={PRIMARY_BTN}>
                      Kaydet
                    </button>
                  </form>
                )}

                {deleteFor === agent.id && (
                  <div className="flex flex-col gap-2 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-rose-200">
                      {agent.name} kalıcı olarak silinecek. Üzerindeki açık talepler ortak kuyruğa döner.
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => setDeleteFor(null)} className={GHOST_BTN}>
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        disabled={busyId === agent.id}
                        onClick={() => handleDelete(agent)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Kalıcı Olarak Sil
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
