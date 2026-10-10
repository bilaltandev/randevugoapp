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
        "inline-flex items-center rounded-control border px-1.5 py-0.5 text-xs font-medium leading-4 whitespace-nowrap",
        TONES[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
