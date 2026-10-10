"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TicketThread, type ThreadMessage } from "@/components/support/TicketThread";
import {
  formatTicketDate,
  ticketCategoryLabel,
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/support/TicketBadges";

interface OwnerTicketClientProps {
  ticket: {
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    assignedToName: string | null;
  };
  messages: ThreadMessage[];
}

export default function OwnerTicketClient({ ticket, messages }: OwnerTicketClientProps) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const isFinished = ticket.status === "RESOLVED" || ticket.status === "CLOSED";

  const handleClose = async () => {
    setClosing(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Destek talepleri
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-xl font-semibold tracking-tight text-ink sm:text-2xl">{ticket.subject}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-3">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              <span>{ticketCategoryLabel(ticket.category)}</span>
              <span aria-hidden="true">·</span>
              <span>{formatTicketDate(ticket.createdAt)}</span>
              {ticket.assignedToName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>İlgilenen: {ticket.assignedToName}</span>
                </>
              )}
            </div>
          </div>
          {ticket.status !== "CLOSED" && (
            <Button onClick={handleClose} disabled={closing} className="self-start">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Talebi kapat
            </Button>
          )}
        </div>
      </div>

      <Panel flush>
        <TicketThread
          messages={messages}
          viewerRole="OWNER"
          replyUrl={`/api/tickets/${ticket.id}`}
          replyPlaceholder="Destek ekibine yanıt yazın..."
          replyHint={isFinished ? "Bu talep kapatıldı. Yeni bir mesaj gönderirseniz talep yeniden açılır." : undefined}
        />
      </Panel>
    </div>
  );
}
