"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Inbox, MessageSquare, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatStrip } from "@/components/ui/StatStrip";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import {
  formatTicketDate,
  ticketCategoryLabel,
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/support/TicketBadges";

interface QueueTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  updatedAt: string;
  businessName: string;
  ownerName: string;
  assignedToId: string | null;
  assignedToName: string | null;
  messageCount: number;
  awaitingSupport: boolean;
}

type Filter = "active" | "unassigned" | "mine" | "done" | "all";

const PRIORITY_RANK: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
const isActive = (t: QueueTicket) => t.status === "OPEN" || t.status === "IN_PROGRESS";

export default function TicketQueueClient({ agentId, tickets }: { agentId: string; tickets: QueueTicket[] }) {
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");

  const counts = useMemo(
    () => ({
      active: tickets.filter(isActive).length,
      unassigned: tickets.filter((t) => isActive(t) && !t.assignedToId).length,
      mine: tickets.filter((t) => isActive(t) && t.assignedToId === agentId).length,
      waiting: tickets.filter((t) => t.awaitingSupport).length,
      urgent: tickets.filter((t) => isActive(t) && t.priority === "URGENT").length,
      done: tickets.filter((t) => !isActive(t)).length,
    }),
    [tickets, agentId]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");
    const filtered = tickets.filter((t) => {
      if (filter === "active" && !isActive(t)) return false;
      if (filter === "unassigned" && (!isActive(t) || t.assignedToId)) return false;
      if (filter === "mine" && (!isActive(t) || t.assignedToId !== agentId)) return false;
      if (filter === "done" && isActive(t)) return false;
      if (!q) return true;
      return [t.subject, t.businessName, t.ownerName].some((v) => v.toLocaleLowerCase("tr-TR").includes(q));
    });
    // Active queues: most urgent first, then oldest activity first so nothing waits forever.
    if (filter === "done" || filter === "all") return filtered;
    return [...filtered].sort(
      (a, b) =>
        (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2) ||
        Number(b.awaitingSupport) - Number(a.awaitingSupport) ||
        a.updatedAt.localeCompare(b.updatedAt)
    );
  }, [tickets, filter, search, agentId]);

  return (
    <div className="space-y-5">
      <PageHeader title="Destek talepleri" description="İşletme sahiplerinden gelen talepleri yanıtlayın ve takip edin." />

      <StatStrip
        stats={[
          { label: "Açık talepler", value: counts.active },
          { label: "Atanmamış", value: counts.unassigned, attention: counts.unassigned > 0 },
          { label: "Yanıt bekleyen", value: counts.waiting, attention: counts.waiting > 0, hint: "Son mesaj işletmeden" },
          { label: "Acil", value: counts.urgent, attention: counts.urgent > 0 },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<Filter>
          aria-label="Talep filtresi"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "active", label: "Açık", count: counts.active },
            { value: "unassigned", label: "Atanmamış", count: counts.unassigned },
            { value: "mine", label: "Bana atanan", count: counts.mine },
            { value: "done", label: "Çözülen", count: counts.done },
            { value: "all", label: "Tümü" },
          ]}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Talep ara"
            placeholder="Konu, işletme veya sahip ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-base sm:text-sm"
          />
        </div>
      </div>

      <Panel flush>
        {visible.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={tickets.length === 0 ? "Henüz destek talebi yok" : "Bu filtrede talep yok"}
            description={tickets.length === 0 ? "İşletmeler panellerindeki Destek sayfasından talep oluşturduğunda burada görünür." : undefined}
          />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/support/tickets/${t.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted sm:px-5"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${t.awaitingSupport ? "bg-pending" : "bg-transparent"}`}
                    aria-label={t.awaitingSupport ? "Yanıt bekliyor" : undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{t.subject}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
                      <span className="font-medium text-ink-2">{t.businessName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ticketCategoryLabel(t.category)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" aria-hidden="true" />
                        {t.messageCount}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{formatTicketDate(t.updatedAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{t.assignedToId === agentId ? "Sizde" : t.assignedToName ?? "Atanmamış"}</span>
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
    </div>
  );
}
