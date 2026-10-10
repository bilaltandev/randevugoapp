"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, UserCheck, UserMinus } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { TicketThread, type ThreadMessage } from "@/components/support/TicketThread";
import { formatTicketDate, ticketCategoryLabel, TicketStatusBadge } from "@/components/support/TicketBadges";
import { InfoList, SubscriptionStatus } from "@/components/support/BusinessSummary";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/supportOptions";
import { formatPhoneNumber, SECTORS } from "@/lib/utils";

interface SupportTicketClientProps {
  agentId: string;
  ticket: {
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    assignedToId: string | null;
    assignedToName: string | null;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    sector: string;
    phone: string;
    isActive: boolean;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string | null;
    subscriptionStatus: string | null;
    subscriptionEnd: string | null;
  };
  messages: ThreadMessage[];
}

export default function SupportTicketClient({ agentId, ticket, business, messages }: SupportTicketClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isMine = ticket.assignedToId === agentId;

  const updateTicket = async (payload: Record<string, string>) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Talep güncellenemedi.");
        return;
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Link href="/support" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Talepler
        </Link>
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold tracking-tight text-ink sm:text-2xl">{ticket.subject}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-3">
            <TicketStatusBadge status={ticket.status} />
            <span>{ticketCategoryLabel(ticket.category)}</span>
            <span aria-hidden="true">·</span>
            <span>{business.name}</span>
            <span aria-hidden="true">·</span>
            <span>{formatTicketDate(ticket.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel flush className="min-w-0">
          <TicketThread
            messages={messages}
            viewerRole="SUPPORT"
            replyUrl={`/api/support/tickets/${ticket.id}/messages`}
            replyPlaceholder={`${business.ownerName} adlı işletme sahibine yanıt yazın...`}
            replyHint={!ticket.assignedToId ? "Yanıt gönderdiğinizde talep size atanır." : undefined}
          />
        </Panel>

        <div className="space-y-5">
          <Panel title="Talep yönetimi">
            <div className="space-y-4">
              <Field label="Durum" htmlFor="ticket-status">
                <Select
                  id="ticket-status"
                  value={ticket.status}
                  disabled={saving}
                  onChange={(e) => updateTicket({ status: e.target.value })}
                >
                  {TICKET_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Öncelik" htmlFor="ticket-priority">
                <Select
                  id="ticket-priority"
                  value={ticket.priority}
                  disabled={saving}
                  onChange={(e) => updateTicket({ priority: e.target.value })}
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </Select>
              </Field>

              <div className="space-y-2">
                <p className="text-sm font-medium text-ink-2">Atanan yetkili</p>
                <p className="text-sm text-ink">{isMine ? "Siz" : ticket.assignedToName ?? "Atanmamış"}</p>
                {isMine ? (
                  <Button size="sm" variant="ghost" disabled={saving} onClick={() => updateTicket({ assign: "none" })}>
                    <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                    Talebi bırak
                  </Button>
                ) : (
                  <Button size="sm" disabled={saving} onClick={() => updateTicket({ assign: "me" })}>
                    <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Üstüme al
                  </Button>
                )}
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}
            </div>
          </Panel>

          <Panel
            title="İşletme"
            action={
              <Button size="sm" variant="ghost" href={`/support/businesses/${business.id}`}>
                Detay
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            }
          >
            <InfoList
              items={[
                { label: "İşletme", value: business.name },
                { label: "Sektör", value: SECTORS.find((s) => s.id === business.sector)?.name ?? business.sector },
                { label: "Durum", value: business.isActive ? "Aktif" : <span className="text-danger">Pasif</span> },
                {
                  label: "Abonelik",
                  value: <SubscriptionStatus status={business.subscriptionStatus} endDate={business.subscriptionEnd} />,
                },
                { label: "Sahip", value: business.ownerName },
                {
                  label: "E-posta",
                  value: <a href={`mailto:${business.ownerEmail}`} className="text-brand hover:underline">{business.ownerEmail}</a>,
                },
                {
                  label: "Telefon",
                  value: (
                    <a href={`tel:${business.ownerPhone || business.phone}`} className="text-brand hover:underline">
                      {formatPhoneNumber(business.ownerPhone || business.phone)}
                    </a>
                  ),
                },
              ]}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
