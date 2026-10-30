"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LifeBuoy, Loader2, MessageSquare, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/Modal";
import {
  formatTicketDate,
  ticketCategoryLabel,
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/support/TicketBadges";
import {
  MAX_MESSAGE_LENGTH,
  MAX_SUBJECT_LENGTH,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "@/lib/supportOptions";

interface OwnerTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  updatedAt: string;
  messageCount: number;
  awaitingOwner: boolean;
}

export default function SupportClient({ tickets }: { tickets: OwnerTicket[] }) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState("NORMAL");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setSubject("");
    setCategory("GENERAL");
    setPriority("NORMAL");
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, priority, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Talep oluşturulamadı.");
        return;
      }
      setIsFormOpen(false);
      resetForm();
      router.push(`/dashboard/support/${data.ticket.id}`);
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const newTicketButton = (
    <Button variant="primary" onClick={() => setIsFormOpen(true)}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Yeni talep
    </Button>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Destek"
        actions={tickets.length > 0 ? newTicketButton : undefined}
      />

      <Panel flush>
        {tickets.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="Henüz destek talebiniz yok"
            description="Panelle ilgili soru ve sorunlarınız için destek ekibimize buradan ulaşabilirsiniz."
            actions={newTicketButton}
          />
        ) : (
          <ul className="ios-list [--ios-inset:20px]">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/dashboard/support/${t.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[15px] font-medium text-ink">{t.subject}</span>
                      {t.awaitingOwner && (
                        <span className="rounded-full bg-brand-soft px-2 py-px text-[11px] font-semibold text-brand-ink">
                          Yeni yanıt
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
                      <span>{ticketCategoryLabel(t.category)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" aria-hidden="true" />
                        {t.messageCount}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{formatTicketDate(t.updatedAt)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <TicketPriorityBadge priority={t.priority} className="hidden sm:inline-flex" />
                    <TicketStatusBadge status={t.status} />
                    <ChevronRight className="h-4 w-4 text-ink-3" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          resetForm();
        }}
        title="Yeni destek talebi"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Konu" htmlFor="ticket-subject">
            <Input
              id="ticket-subject"
              required
              maxLength={MAX_SUBJECT_LENGTH}
              placeholder="Örn. Randevu bildirimleri gelmiyor"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-base sm:text-sm"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategori" htmlFor="ticket-category">
              <Select id="ticket-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Öncelik" htmlFor="ticket-priority">
              <Select id="ticket-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Mesajınız" htmlFor="ticket-message" hint="Sorunu ve hangi sayfada yaşadığınızı mümkün olduğunca ayrıntılı anlatın.">
            <Textarea
              id="ticket-message"
              required
              rows={6}
              maxLength={MAX_MESSAGE_LENGTH}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-base sm:text-sm"
            />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Talebi gönder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
