import React from "react";
import { CheckCircle2, MessageSquare } from "lucide-react";
import type { BookingState } from "../useBooking";
import { formatDateKey, formatDuration, formatPrice } from "../time";
import { btn, headingCls } from "../ui";

/** Shown after the appointment request was created (status starts as pending on the server). */
export function Confirmation({
  booking,
  businessName,
  onNewBooking,
}: {
  booking: BookingState;
  businessName: string;
  onNewBooking: () => void;
}) {
  const b = booking;
  const srv = b.selectedService;

  const rows: [string, string][] = [
    ["Tarih", formatDateKey(b.selectedDate)],
    ["Saat", b.selectedTime],
    ...(srv ? ([["Hizmet", `${srv.name} · ${formatDuration(srv.durationMinutes)}`]] as [string, string][]) : []),
    ...(b.staffSelectionEnabled
      ? ([["Uzman", b.selectedStaffMember?.name ?? "İlk müsait uzman"]] as [string, string][])
      : []),
    ...(b.isRestaurant ? ([["Kişi", `${b.guestCount} kişi`]] as [string, string][]) : []),
    ...(b.selectedTable
      ? ([["Masa", [b.selectedTable.name, b.selectedTable.area?.name].filter(Boolean).join(" · ")]] as [string, string][])
      : []),
    ...(b.isAutoService && b.plateNumber ? ([["Araç", b.plateNumber]] as [string, string][]) : []),
    ["Ad soyad", b.customerName],
    ["Telefon", b.customerPhone],
    ...(srv ? ([["Tutar", formatPrice(srv.price)]] as [string, string][]) : []),
  ];

  return (
    <div className="mx-auto max-w-lg py-4 sm:py-10" role="status">
      <CheckCircle2 className="h-10 w-10 text-brand" aria-hidden="true" />
      <h1 className={`mt-4 text-2xl text-ink ${headingCls}`}>Randevu talebiniz alındı</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
        Talebiniz <span className="font-medium text-ink">{businessName}</span> işletmesine iletildi. İşletme onayladığında
        randevunuz kesinleşir.
      </p>

      <dl className="mt-6 divide-y divide-line rounded-(--bk-r-card) border border-line bg-surface text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-ink-3">{label}</dt>
            <dd className="text-right font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {b.bookingResult?.whatsappUrl && (
          <a href={b.bookingResult.whatsappUrl} target="_blank" rel="noopener noreferrer" className={btn("primary", "lg", "sm:flex-1")}>
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            WhatsApp ile işletmeye bildir
          </a>
        )}
        <button type="button" onClick={onNewBooking} className={btn("secondary", "lg", "sm:flex-1")}>
          Yeni randevu al
        </button>
      </div>
      {b.bookingResult?.whatsappUrl && (
        <p className="mt-2 text-xs text-ink-3">WhatsApp mesajı randevu bilgilerinizle hazır açılır; göndermek size kalmış.</p>
      )}
    </div>
  );
}
