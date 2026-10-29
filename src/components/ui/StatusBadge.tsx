import React from "react";
import { cn } from "@/lib/utils";
import { getAppointmentStatus, type StatusTone } from "@/lib/appointmentStatus";

const TONES: Record<StatusTone, string> = {
  pending: "bg-pending-soft text-pending border-pending-line",
  confirmed: "bg-brand-soft text-brand-ink border-brand-line",
  completed: "bg-neutral-soft text-ink-2 border-line",
  cancelled: "bg-danger-soft text-danger border-danger-line",
  blocked: "bg-surface-muted text-ink-3 border-line",
};

const DOTS: Record<StatusTone, string> = {
  pending: "bg-pending",
  confirmed: "bg-brand",
  completed: "bg-ink-3",
  cancelled: "bg-danger",
  blocked: "bg-ink-3",
};

interface StatusBadgeProps {
  status?: string | null;
  /** Renders the "closed slot" badge instead of a booking status. */
  blocked?: boolean;
  className?: string;
}

export function StatusBadge({ status, blocked, className }: StatusBadgeProps) {
  const { label, tone } = blocked
    ? { label: "Kapalı saat", tone: "blocked" as const }
    : getAppointmentStatus(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold leading-4 whitespace-nowrap",
        TONES[tone],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[tone])} aria-hidden="true" />
      {label}
    </span>
  );
}
