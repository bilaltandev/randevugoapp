"use client";

import React, { useMemo, useState } from "react";
import { Check, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingService } from "./types";
import { formatDuration, formatPrice } from "./time";
import { focusRing, SectionTitle } from "./ui";

interface ServiceCatalogProps {
  services: BookingService[];
  selectedId?: string | null;
  onSelect: (service: BookingService) => void;
  isRestaurant: boolean;
  /** Booking closed (e.g. expired subscription): list stays visible, selection is off. */
  readOnly?: boolean;
  phone?: string | null;
}

const OTHER = "Diğer";

/** Compact, comparable service list with optional category filter. */
export function ServiceCatalog({ services, selectedId, onSelect, isRestaurant, readOnly, phone }: ServiceCatalogProps) {
  const [category, setCategory] = useState<string>("ALL");

  const groups = useMemo(() => {
    const map = new Map<string, BookingService[]>();
    for (const s of services) {
      const key = s.category?.name || OTHER;
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }, [services]);
  const hasCategories = groups.length > 1 || (groups.length === 1 && groups[0].name !== OTHER);
  const visibleGroups = category === "ALL" ? groups : groups.filter((g) => g.name === category);

  const title = isRestaurant ? "Rezervasyon seçenekleri" : "Hizmetler";

  if (services.length === 0) {
    return (
      <section id="hizmetler" aria-labelledby="hizmetler-baslik" className="scroll-mt-28">
        <SectionTitle id="hizmetler-baslik">{title}</SectionTitle>
        <div className="rounded-(--bk-r-card) border border-dashed border-line-strong px-5 py-8 text-center">
          <p className="text-sm font-medium text-ink">Online randevuya açık hizmet bulunmuyor</p>
          <p className="mt-1 text-sm text-ink-3">
            {phone ? (
              <>
                Randevu için işletmeyi{" "}
                <a href={`tel:${phone}`} className="font-medium text-brand-ink underline-offset-2 hover:underline">
                  {phone}
                </a>{" "}
                numarasından arayabilirsiniz.
              </>
            ) : (
              "Lütfen daha sonra tekrar kontrol edin."
            )}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="hizmetler" aria-labelledby="hizmetler-baslik" className="scroll-mt-28">
      <SectionTitle id="hizmetler-baslik" aside={<span className="text-sm text-ink-3">{services.length} seçenek</span>}>
        {title}
      </SectionTitle>

      {hasCategories && (
        <div className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Kategoriler">
          {["ALL", ...groups.map((g) => g.name)].map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(c)}
                className={cn(
                  "h-9 shrink-0 rounded-(--bk-r-pill) border px-3.5 text-sm transition-colors",
                  focusRing,
                  active ? "border-ink bg-ink text-canvas" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
                )}
              >
                {c === "ALL" ? "Tümü" : c}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-6">
        {visibleGroups.map((group) => (
          <div key={group.name}>
            {hasCategories && category === "ALL" && (
              <h3 className="mb-2.5 text-sm font-semibold text-ink-2">{group.name}</h3>
            )}
            <ul className="divide-y divide-line overflow-hidden rounded-(--bk-r-card) border border-line bg-surface">
              {group.items.map((srv) => {
                const selected = srv.id === selectedId;
                return (
                  <li key={srv.id}>
                    <button
                      type="button"
                      disabled={readOnly}
                      aria-pressed={selected}
                      onClick={() => onSelect(srv)}
                      className={cn(
                        "relative flex w-full items-start gap-3 px-4 py-5 text-left transition-colors disabled:cursor-default sm:items-center sm:gap-5 sm:px-5",
                        focusRing,
                        "focus-visible:-outline-offset-2",
                        selected ? "bg-brand-soft" : "enabled:hover:bg-surface-muted"
                      )}
                    >
                      {selected && <span className="absolute inset-y-0 left-0 w-[3px] bg-brand" aria-hidden="true" />}
                      {srv.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={srv.image}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-(--bk-r-ctl) object-cover sm:h-20 sm:w-20"
                          loading="lazy"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold leading-snug text-ink">{srv.name}</span>
                        {srv.description && (
                          <span className="mt-0.5 line-clamp-2 block text-sm text-ink-3">{srv.description}</span>
                        )}
                        <span className="mt-1.5 inline-flex items-center gap-1 text-sm text-ink-3">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatDuration(srv.durationMinutes)}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <span className="text-base font-semibold tabular-nums text-ink">{formatPrice(srv.price)}</span>
                        {!readOnly && (
                          <span
                            className={cn(
                              "inline-flex h-8 items-center gap-1 rounded-(--bk-r-pill) border px-3 text-sm font-medium transition-colors",
                              selected ? "border-brand bg-brand text-(color:--bk-on-brand)" : "border-line-strong text-ink"
                            )}
                            aria-hidden="true"
                          >
                            {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" />}
                            {selected ? "Seçildi" : "Seç"}
                          </span>
                        )}
                      </span>
                      <span className="sr-only">{selected ? "Seçili" : "Seçmek için dokunun"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
