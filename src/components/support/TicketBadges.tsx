import React from "react";
import { cn } from "@/lib/utils";
import { optionLabel, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/supportOptions";

const BADGE = "inline-flex items-center rounded-control border px-1.5 py-0.5 text-xs font-medium leading-4 whitespace-nowrap";

const STATUS_TONES: Record<string, string> = {
  OPEN: "bg-pending-soft text-pending border-pending-line",
  IN_PROGRESS: "bg-brand-soft text-brand-ink border-brand-line",
  RESOLVED: "bg-neutral-soft text-ink-2 border-line",
  CLOSED: "bg-surface-muted text-ink-3 border-line",
};

const PRIORITY_TONES: Record<string, string> = {
  LOW: "bg-surface-muted text-ink-3 border-line",
  NORMAL: "bg-surface text-ink-2 border-line",
  HIGH: "bg-pending-soft text-pending border-pending-line",
  URGENT: "bg-danger-soft text-danger border-danger-line",
};

export function TicketStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn(BADGE, STATUS_TONES[status] ?? STATUS_TONES.CLOSED, className)}>
      {optionLabel(TICKET_STATUSES, status)}
    </span>
  );
}

export function TicketPriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return (
    <span className={cn(BADGE, PRIORITY_TONES[priority] ?? PRIORITY_TONES.NORMAL, className)}>
      {optionLabel(TICKET_PRIORITIES, priority)}
    </span>
  );
}

export function ticketCategoryLabel(category: string) {
  return optionLabel(TICKET_CATEGORIES, category);
}

export function formatTicketDate(value: string | Date) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
