"use client";

import React from "react";
import { CalendarDays, ChevronRight, Loader2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingState } from "./useBooking";
import type { Stage } from "./types";
import { formatDateKey, formatDuration, formatPrice } from "./time";
import { btn, focusRing } from "./ui";

export interface PrimaryAction {
  label: string;
  disabled?: boolean;
  /** When set, the button submits this form instead of calling onClick. */
  formId?: string;
  onClick?: () => void;
  busy?: boolean;
}

interface SummaryProps {
  booking: BookingState;
  stage: Stage;
  action: PrimaryAction | null;
  onEdit: (stage: Stage) => void;
  phone?: string | null;
}

function ActionButton({ action, className }: { action: PrimaryAction; className?: string }) {
  return (
    <button
      type={action.formId ? "submit" : "button"}
      form={action.formId}
      onClick={action.formId ? undefined : action.onClick}
      disabled={action.disabled || action.busy}
      className={btn("primary", "lg", className)}
    >
      {action.busy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Gönderiliyor...
        </>
      ) : (
        <>
          {action.label}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </>
      )}
    </button>
  );
}

function EditLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("shrink-0 rounded text-sm font-medium text-brand-ink hover:underline", focusRing)}
      aria-label={label}
    >
      Değiştir
    </button>
  );
}

/** Desktop: sticky card next to the content. */
export function SummaryCard({ booking, stage, action, onEdit, phone }: SummaryProps) {
  const b = booking;
  const inFlow = stage !== "browse";
  const srv = b.selectedService;
  const emptySteps = [
    "Listeden bir hizmet seçin",
    ...(b.staffSelectionEnabled ? ["Uzmanınızı seçin"] : []),
    "Tarih ve saat seçin",
    "Bilgilerinizi girip onaylayın",
  ];

  return (
    <aside aria-label="Randevu özeti" className="rounded-(--bk-r-card) border border-line bg-surface">
      <h2 className="border-b border-line px-5 py-4 text-base font-semibold text-ink">Randevu özeti</h2>

      {b.isExpired ? (
        <div className="px-5 py-5 text-sm">
          <p className="font-medium text-ink">Online randevu şu an kapalı</p>
          <p className="mt-1 text-ink-3">Randevu için işletmeyi arayabilirsiniz.</p>
          {phone && (
            <a href={`tel:${phone}`} className={btn("secondary", "md", "mt-4 w-full")}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              {phone}
            </a>
          )}
        </div>
      ) : !srv ? (
        // Empty state doubles as a guide: the real steps of this business's booking flow.
        <div className="px-5 py-5">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            <CalendarDays className="h-4 w-4 text-ink-3" aria-hidden="true" />
            {emptySteps.length} adımda randevunuz hazır
          </p>
          <ol className="mt-4 space-y-3">
            {emptySteps.map((step, i) => (
              <li key={step} className={cn("flex items-center gap-3 text-sm", i === 0 ? "font-medium text-ink" : "text-ink-3")}>
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums",
                    i === 0 ? "bg-brand text-(color:--bk-on-brand)" : "border border-line-strong"
                  )}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <>
          <dl className="divide-y divide-line text-sm">
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <dt className="sr-only">Hizmet</dt>
                <dd className="font-medium text-ink">{srv.name}</dd>
                <dd className="text-ink-3">{formatDuration(srv.durationMinutes)}</dd>
              </div>
              <dd className="shrink-0 font-medium tabular-nums text-ink">{formatPrice(srv.price)}</dd>
              {inFlow && <EditLink onClick={() => onEdit("browse")} label="Hizmeti değiştir" />}
            </div>

            {inFlow && b.staffSelectionEnabled && (
              <div className="flex items-center gap-3 px-5 py-3">
                <dt className="w-16 shrink-0 text-ink-3">Uzman</dt>
                <dd className="min-w-0 flex-1 truncate text-ink">{b.selectedStaffMember?.name ?? "Fark etmez"}</dd>
                {stage !== "staff" && <EditLink onClick={() => onEdit("staff")} label="Uzmanı değiştir" />}
              </div>
            )}

            {inFlow && (
              <div className="flex items-center gap-3 px-5 py-3">
                <dt className="w-16 shrink-0 text-ink-3">Tarih</dt>
                <dd className={cn("min-w-0 flex-1", b.selectedTime ? "text-ink" : "text-ink-3")}>
                  {b.selectedTime
                    ? `${formatDateKey(b.selectedDate, { weekday: "short", day: "numeric", month: "long" })} · ${b.selectedTime}`
                    : "Seçilmedi"}
                </dd>
                {stage === "details" && <EditLink onClick={() => onEdit("datetime")} label="Tarih ve saati değiştir" />}
              </div>
            )}

            {inFlow && b.isRestaurant && (
              <>
                <div className="flex items-center gap-3 px-5 py-3">
                  <dt className="w-16 shrink-0 text-ink-3">Kişi</dt>
                  <dd className="flex-1 text-ink">{b.guestCount} kişi</dd>
                </div>
                <div className="flex items-center gap-3 px-5 py-3">
                  <dt className="w-16 shrink-0 text-ink-3">Masa</dt>
                  <dd className={cn("min-w-0 flex-1 truncate", b.selectedTable ? "text-ink" : "text-ink-3")}>
                    {b.selectedTable
                      ? `${b.selectedTable.name}${b.selectedTable.area?.name ? ` · ${b.selectedTable.area.name}` : ""}`
                      : "Seçilmedi"}
                  </dd>
                </div>
              </>
            )}
          </dl>

          <div className="flex items-baseline justify-between border-t border-line px-5 py-4">
            <span className="text-sm font-medium text-ink">Toplam</span>
            <span className="text-lg font-semibold tabular-nums text-ink">{formatPrice(srv.price)}</span>
          </div>
        </>
      )}

      {action && !b.isExpired && (
        <div className="px-5 pb-5">
          <ActionButton action={action} className="w-full" />
        </div>
      )}
    </aside>
  );
}

/** Phones: compact summary + primary action pinned to the bottom. */
export function MobileActionBar({
  booking,
  action,
  sticky,
}: {
  booking: BookingState;
  action: PrimaryAction;
  /** Inside the dashboard preview the bar sticks to its scroll container instead of the viewport. */
  sticky?: boolean;
}) {
  const srv = booking.selectedService;
  const detail = [
    srv ? formatDuration(srv.durationMinutes) : null,
    booking.selectedTime
      ? `${formatDateKey(booking.selectedDate, { day: "numeric", month: "short" })} ${booking.selectedTime}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        sticky ? "sticky" : "fixed inset-x-0",
        "bottom-0 z-40 border-t border-line bg-surface px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden"
      )}
    >
      <div className="flex items-center gap-3">
        {srv && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{srv.name}</p>
            <p className="truncate text-xs text-ink-3">
              <span className="font-medium tabular-nums text-ink">{formatPrice(srv.price)}</span>
              {detail && ` · ${detail}`}
            </p>
          </div>
        )}
        <ActionButton action={action} className={srv ? "shrink-0" : "w-full"} />
      </div>
    </div>
  );
}
