"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarPlus, Check, Copy, ExternalLink, KeyRound, Loader2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/Modal";
import { formatTicketDate, TicketPriorityBadge, TicketStatusBadge } from "@/components/support/TicketBadges";
import { InfoList, SubscriptionStatus } from "@/components/support/BusinessSummary";
import { SUPPORT_MAX_TRIAL_EXTENSION_DAYS } from "@/lib/supportOptions";
import { formatPhoneNumber, SECTORS } from "@/lib/utils";

interface SupportBusinessClientProps {
  business: {
    id: string;
    name: string;
    slug: string;
    sector: string;
    phone: string;
    address: string;
    city: string;
    isActive: boolean;
    createdAt: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string | null;
    subscriptionStatus: string | null;
    subscriptionPlan: string | null;
    trialEnd: string | null;
    subscriptionEnd: string | null;
    counts: { appointments: number; services: number; employees: number; customers: number };
  };
  tickets: { id: string; subject: string; status: string; priority: string; updatedAt: string }[];
  recentAppointments: {
    id: string;
    customerName: string;
    date: string;
    startTime: string;
    status: string;
    serviceName: string | null;
  }[];
}

export default function SupportBusinessClient({ business, tickets, recentAppointments }: SupportBusinessClientProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Trial extension
  const [trialDays, setTrialDays] = useState("3");
  const [trialNote, setTrialNote] = useState("");
  const [extending, setExtending] = useState(false);
  const canExtendTrial = business.subscriptionStatus !== "active";

  // Password reset
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const runAction = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/support/businesses/${business.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "İşlem başarısız oldu.");
    return data;
  };

  const handleExtendTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtending(true);
    setFeedback(null);
    try {
      await runAction({ action: "EXTEND_TRIAL", days: Number(trialDays), note: trialNote });
      setTrialNote("");
      setFeedback({ type: "success", text: `Deneme süresi ${trialDays} gün uzatıldı.` });
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "İşlem başarısız oldu." });
    } finally {
      setExtending(false);
    }
  };

  const handleResetPassword = async () => {
    setResetting(true);
    setFeedback(null);
    try {
      const data = await runAction({ action: "RESET_OWNER_PASSWORD" });
      setTemporaryPassword(data.temporaryPassword);
    } catch (err) {
      setConfirmReset(false);
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "İşlem başarısız oldu." });
    } finally {
      setResetting(false);
    }
  };

  const closeResetModal = () => {
    setConfirmReset(false);
    setTemporaryPassword("");
    setCopied(false);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
    } catch {
      // Clipboard can be blocked; the password stays visible for manual copy.
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Link href="/support/businesses" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          İşletmeler
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-xl font-semibold tracking-tight text-ink sm:text-2xl">{business.name}</h1>
            <p className="mt-1 text-sm text-ink-3">
              {SECTORS.find((s) => s.id === business.sector)?.name ?? business.sector} · {business.city} · Kayıt:{" "}
              {new Date(business.createdAt).toLocaleDateString("tr-TR")}
            </p>
          </div>
          <Button href={`/${business.slug}`} target="_blank" rel="noopener noreferrer" size="sm">
            Rezervasyon sayfası
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {feedback && (
        <p
          role="status"
          className={
            feedback.type === "success"
              ? "rounded-panel border border-brand-line bg-brand-soft px-4 py-2.5 text-sm text-brand-ink"
              : "rounded-panel border border-danger-line bg-danger-soft px-4 py-2.5 text-sm text-danger"
          }
        >
          {feedback.text}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="İşletme sahibi">
          <InfoList
            items={[
              { label: "Ad soyad", value: business.ownerName },
              {
                label: "E-posta",
                value: <a href={`mailto:${business.ownerEmail}`} className="text-brand hover:underline">{business.ownerEmail}</a>,
              },
              {
                label: "Telefon",
                value: business.ownerPhone ? (
                  <a href={`tel:${business.ownerPhone}`} className="text-brand hover:underline">{formatPhoneNumber(business.ownerPhone)}</a>
                ) : null,
              },
              {
                label: "İşletme telefonu",
                value: <a href={`tel:${business.phone}`} className="text-brand hover:underline">{formatPhoneNumber(business.phone)}</a>,
              },
              { label: "Adres", value: business.address },
            ]}
          />
        </Panel>

        <Panel title="Hesap durumu">
          <InfoList
            items={[
              { label: "İşletme", value: business.isActive ? "Aktif" : <span className="text-danger">Pasif</span> },
              { label: "Plan", value: business.subscriptionPlan },
              {
                label: "Abonelik",
                value: <SubscriptionStatus status={business.subscriptionStatus} endDate={business.subscriptionEnd} />,
              },
              { label: "Randevu", value: business.counts.appointments },
              { label: "Müşteri", value: business.counts.customers },
              { label: "Hizmet / Çalışan", value: `${business.counts.services} / ${business.counts.employees}` },
            ]}
          />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Deneme süresini uzat"
          description={`Tek seferde en fazla ${SUPPORT_MAX_TRIAL_EXTENSION_DAYS} gün. Daha uzun süreler ve ücretli abonelik yöneticiye aittir.`}
        >
          {canExtendTrial ? (
            <form onSubmit={handleExtendTrial} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <Field label="Gün" htmlFor="trial-days">
                  <Select id="trial-days" value={trialDays} onChange={(e) => setTrialDays(e.target.value)}>
                    {Array.from({ length: SUPPORT_MAX_TRIAL_EXTENSION_DAYS }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d} gün</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Not (isteğe bağlı)" htmlFor="trial-note">
                  <Input
                    id="trial-note"
                    maxLength={300}
                    placeholder="Örn. kurulum sorunu yaşadı"
                    value={trialNote}
                    onChange={(e) => setTrialNote(e.target.value)}
                    className="text-base sm:text-sm"
                  />
                </Field>
              </div>
              <Button type="submit" variant="primary" disabled={extending}>
                {extending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarPlus className="h-4 w-4" aria-hidden="true" />}
                Süreyi uzat
              </Button>
            </form>
          ) : (
            <p className="text-sm text-ink-3">Bu işletmenin aktif ücretli aboneliği var; deneme süresi uzatılamaz.</p>
          )}
        </Panel>

        <Panel
          title="Şifre sıfırlama"
          description="İşletme sahibi hesabına giremiyorsa geçici bir şifre oluşturun ve kendisine iletin."
        >
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Geçici şifre oluştur
          </Button>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Destek talepleri" flush>
          {tickets.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-3 sm:px-5">Bu işletmenin destek talebi yok.</p>
          ) : (
            <ul className="divide-y divide-line">
              {tickets.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/support/tickets/${t.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{t.subject}</p>
                      <p className="text-xs text-ink-3">{formatTicketDate(t.updatedAt)}</p>
                    </div>
                    <TicketPriorityBadge priority={t.priority} className="hidden sm:inline-flex" />
                    <TicketStatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Son randevular" flush>
          {recentAppointments.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-3 sm:px-5">Henüz randevu yok.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentAppointments.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{a.customerName}</p>
                    <p className="truncate text-xs text-ink-3">
                      {[a.serviceName, `${new Date(a.date).toLocaleDateString("tr-TR")} ${a.startTime}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Modal isOpen={confirmReset} onClose={closeResetModal} title="Geçici şifre oluştur" maxWidth="md">
        {temporaryPassword ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-2">
              <span className="font-medium text-ink">{business.ownerName}</span> için yeni geçici şifre aşağıda. Bu
              şifre yalnızca şimdi gösterilir; işletme sahibine güvenli bir kanaldan iletin.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-control border border-line bg-surface-muted px-3 py-2 font-mono text-base tracking-wider text-ink">
                {temporaryPassword}
              </code>
              <Button onClick={copyPassword} aria-label="Şifreyi kopyala">
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? "Kopyalandı" : "Kopyala"}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" onClick={closeResetModal}>Tamam</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-2">
              <span className="font-medium text-ink">{business.ownerEmail}</span> hesabının mevcut şifresi geçersiz
              olacak ve yeni bir geçici şifre oluşturulacak. İşlem denetim kaydına adınızla yazılır.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeResetModal}>Vazgeç</Button>
              <Button variant="danger" onClick={handleResetPassword} disabled={resetting}>
                {resetting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Şifreyi sıfırla
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
