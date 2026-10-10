import React from "react";
import { cn } from "@/lib/utils";

export const SUBSCRIPTION_LABELS: Record<string, string> = {
  trial: "Deneme",
  active: "Aktif abonelik",
  expired: "Süresi dolmuş",
  cancelled: "İptal edilmiş",
};

/** Label/value rows for the business info cards in the support panel. */
export function InfoList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="space-y-2.5 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-ink-3">{item.label}</dt>
          <dd className="min-w-0 break-words text-right text-ink">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SubscriptionStatus({ status, endDate }: { status: string | null; endDate: string | null }) {
  const expiredOrCancelled = status === "expired" || status === "cancelled";
  return (
    <span className={cn(expiredOrCancelled && "text-danger")}>
      {status ? SUBSCRIPTION_LABELS[status] ?? status : "Yok"}
      {endDate && (
        <span className="block text-xs text-ink-3">
          Bitiş: {new Date(endDate).toLocaleDateString("tr-TR")}
        </span>
      )}
    </span>
  );
}
