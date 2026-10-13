import { CalendarX2, Phone } from "lucide-react";

/** Public page of a business whose trial or subscription is over: no booking form, only how to reach them. */
export function BookingClosed({ name, phone }: { name: string; phone: string | null }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 text-ink">
      <div className="w-full max-w-sm rounded-panel border border-line bg-surface p-6 text-center shadow-panel">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-3">
          <CalendarX2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-semibold">{name}</h1>
        <p className="mt-2 text-sm text-ink-3">Bu işletme şu an online randevu almıyor.</p>
        {phone && (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-control border border-line-strong bg-surface text-sm font-medium text-ink hover:bg-surface-muted"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {phone}
          </a>
        )}
      </div>
    </main>
  );
}
