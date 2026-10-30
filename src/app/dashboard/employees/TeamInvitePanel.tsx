"use client";

import React, { useState } from "react";
import { ArrowRight, Check, Copy, KeyRound, Link2, Mail, MessageCircle, ShieldCheck, UserPlus } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";

/** Reads an API answer; a refused action throws the server's message. */
export async function teamRequest<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "İşlem tamamlanamadı. Lütfen tekrar deneyin.");
  return data as T;
}

export const untilLabel = (date: string | Date) =>
  new Date(date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

export function whatsAppUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Copies to the clipboard and shows a tick on the button for a moment. */
export function CopyButton({ text, label, primary }: { text: string; label: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Kopyalamak için seçin:", text);
    }
  };
  return (
    <Button variant={primary ? "primary" : "secondary"} onClick={copy}>
      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      {copied ? "Kopyalandı" : label}
    </Button>
  );
}

interface Props {
  businessName: string;
  members: number;
  memberLimit: number;
  openCodes: number;
  onOpenCodesChange: (count: number) => void;
}

/**
 * TEAM plan: single-use invites. Whoever signs up with a code or link gets a member account and a staff record
 * of their own here; a member only sees their own bookings. A new code is shown once (the server keeps its hash).
 */
export function TeamInvitePanel({ businessName, members, memberLimit, openCodes, onOpenCodesChange }: Props) {
  const [fresh, setFresh] = useState<{ code: string; expiresAt: string; link: string } | null>(null);
  const [busy, setBusy] = useState<"create" | "mail" | "revoke" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const full = members >= memberLimit;

  const create = async () => {
    setBusy("create");
    setError(null);
    try {
      const { code, expiresAt } = await teamRequest<{ code: string; expiresAt: string }>("/api/team/codes", { method: "POST" });
      setFresh({ code, expiresAt, link: `${window.location.origin}/davet/${encodeURIComponent(code)}` });
      onOpenCodesChange(openCodes + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const sendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    const to = email.trim();
    if (!to) return;
    setBusy("mail");
    setError(null);
    setSentTo(null);
    try {
      await teamRequest("/api/team/invites/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: to }),
      });
      setSentTo(to);
      setEmail("");
      onOpenCodesChange(openCodes + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const revokeAll = async () => {
    if (!confirm("Henüz kullanılmamış tüm davet kodları geçersiz olacak. Devam edilsin mi?")) return;
    setBusy("revoke");
    setError(null);
    try {
      await teamRequest("/api/team/codes", { method: "DELETE" });
      setFresh(null);
      onOpenCodesChange(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const shareMessage = fresh
    ? `${businessName} ekibine katılmak için bu bağlantıdan hesabınızı oluşturun: ${fresh.link}\n\nYa da kayıt olurken "Hazır ekibe katıl" seçeneğine bu kodu yazın: ${fresh.code}`
    : "";

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-violet" aria-hidden="true" />
          Ekibe davet et
        </span>
      }
      description="Kod veya bağlantıyla kayıt olan kişi, çalışan olarak buraya kendiliğinden eklenir."
      action={
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold tabular-nums",
            full ? "bg-pending-soft text-pending" : "bg-violet-soft text-violet"
          )}
        >
          {members} / {memberLimit} üye
        </span>
      }
    >
      <div className="space-y-4">
        {fresh && (
          <div className="rounded-[16px] border border-violet/30 bg-violet-soft p-4 text-center">
            <p className="text-xs font-semibold text-ink-2">Tek kullanımlık davet kodu</p>
            <p className="my-1 select-all font-mono text-[28px] font-extrabold tracking-[0.12em] text-ink">{fresh.code}</p>
            <p className="text-xs text-ink-3">{untilLabel(fresh.expiresAt)} tarihine kadar geçerli. Bu kod bir daha gösterilmez.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <CopyButton text={fresh.code} label="Kodu kopyala" primary />
              <CopyButton text={fresh.link} label="Bağlantıyı kopyala" />
              <a href={whatsAppUrl(shareMessage)} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary")}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
          </div>
        )}

        {full ? (
          <p className="rounded-control bg-pending-soft px-3 py-2 text-sm text-pending">
            Ekip üyesi sınırına ulaştınız. Sınırı artırmak için destek ekibine yazın.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-ink-2">Kodu veya bağlantıyı WhatsApp gibi bir yerden ekip arkadaşınıza gönderin.</p>
              <Button variant={fresh ? "secondary" : "primary"} onClick={create} disabled={busy !== null}>
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                {busy === "create" ? "Oluşturuluyor..." : fresh ? "Yeni kod oluştur" : "Davet kodu oluştur"}
              </Button>
            </div>

            <form onSubmit={sendMail} className="space-y-2">
              <Field label="E-posta ile davet et" htmlFor="invite-email">
                <div className="flex gap-2">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="ornek@mail.com"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button type="submit" disabled={busy !== null || !email.trim()} aria-label="Daveti gönder">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{busy === "mail" ? "Gönderiliyor..." : "Gönder"}</span>
                  </Button>
                </div>
              </Field>
              {sentTo && <p className="text-xs text-brand">Davet {sentTo} adresine gönderildi.</p>}
            </form>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <p className="flex items-start gap-2 text-xs text-ink-3">
            <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            Ekip üyeleri mobil uygulamada yalnızca kendi randevularını ve takvimini görür. Ayarlar, ödeme, müşteri listesi ve diğer çalışanlar onlara kapalıdır.
          </p>
          {openCodes > 0 && (
            <button type="button" onClick={revokeAll} disabled={busy !== null} className="text-xs font-semibold text-danger hover:underline disabled:opacity-50">
              Kullanılmamış {openCodes} kodu iptal et
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}

/** PERSON plan: one person takes the bookings, so inviting needs the TEAM plan. */
export function TeamPlanNotice() {
  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-violet-soft text-violet" aria-hidden="true">
            <Link2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ink">Person planı: tek kişi</p>
            <p className="mt-0.5 text-sm text-ink-3">Ekip arkadaşlarınızı davet etmek ve randevuların onlara düşmesi için Team planına geçin.</p>
          </div>
        </div>
        <Button href="/dashboard/subscription" variant="primary" className="shrink-0">
          Team planına geç
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Panel>
  );
}
