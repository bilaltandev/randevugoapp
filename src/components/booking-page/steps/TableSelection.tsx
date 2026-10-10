"use client";

import React, { useState } from "react";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloorPlanCanvas } from "@/components/restaurant/FloorPlanCanvas";
import type { BookingState } from "../useBooking";
import { choice, focusRing } from "../ui";

/** Optional table pick for restaurants, shown once a time is chosen. */
export function TableSelection({ booking }: { booking: BookingState }) {
  const b = booking;
  const [view, setView] = useState<"list" | "plan">("list");
  const [area, setArea] = useState("ALL");

  const fitting = b.restaurantTables.filter((t) => t.isActive && !t.insufficientCapacity);
  const visible = fitting.filter((t) => area === "ALL" || t.areaId === area);

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-medium text-ink">
        Masa <span className="font-normal text-ink-3">(isteğe bağlı)</span>
      </legend>

      {!b.selectedTime ? (
        <p className="mt-1 text-sm text-ink-3">Uygun masaları görmek için önce bir saat seçin.</p>
      ) : b.loadingTables ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-ink-3" aria-busy="true">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Masaların durumu kontrol ediliyor...
        </p>
      ) : b.restaurantTables.length === 0 ? (
        <p className="mt-1 text-sm text-ink-3">
          Bu işletmede tanımlı masa yok; rezervasyonunuzu masa seçmeden tamamlayabilirsiniz.
        </p>
      ) : (
        <div className="mt-2 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {[{ id: "ALL", name: "Tüm alanlar" }, ...b.restaurantAreas].map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={area === a.id}
                  onClick={() => setArea(a.id)}
                  className={choice(area === a.id, "h-9 shrink-0 px-3 text-sm")}
                >
                  {a.name}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 self-start rounded-(--bk-r-ctl) border border-line p-0.5 sm:self-auto">
              {(
                [
                  { id: "list", label: "Liste", icon: List },
                  { id: "plan", label: "Masa planı", icon: LayoutGrid },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={view === v.id}
                  onClick={() => setView(v.id)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm",
                    focusRing,
                    view === v.id ? "bg-surface-muted font-medium text-ink" : "text-ink-3 hover:text-ink"
                  )}
                >
                  <v.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {view === "plan" ? (
            <FloorPlanCanvas
              tables={b.restaurantTables}
              areas={b.restaurantAreas}
              activeAreaId={area}
              mode="booking"
              selectedTableId={b.selectedTable?.id}
              onSelectTable={(tbl) => {
                if (tbl.isAvailable) b.setSelectedTable(tbl);
              }}
              readOnly={true}
            />
          ) : visible.length === 0 ? (
            <p className="text-sm text-ink-3">Bu alanda {b.guestCount} kişiye uygun masa yok.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {visible.map((tbl) => {
                const on = b.selectedTable?.id === tbl.id;
                return (
                  <button
                    key={tbl.id}
                    type="button"
                    disabled={!tbl.isAvailable}
                    aria-pressed={on}
                    onClick={() => b.setSelectedTable(on ? null : tbl)}
                    className={choice(on, "flex overflow-hidden disabled:cursor-not-allowed disabled:opacity-50")}
                  >
                    {tbl.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tbl.imageUrl} alt="" className="w-20 shrink-0 object-cover" />
                    )}
                    <span className="flex min-w-0 flex-1 items-start justify-between gap-2 p-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{tbl.name}</span>
                        <span className="block text-xs text-ink-3">
                          {[tbl.area?.name, `${tbl.capacity} kişilik`].filter(Boolean).join(" · ")}
                        </span>
                        {tbl.description && <span className="mt-0.5 line-clamp-1 block text-xs text-ink-3">{tbl.description}</span>}
                      </span>
                      <span className={cn("shrink-0 text-xs font-medium", tbl.isAvailable ? "text-brand-ink" : "text-danger")}>
                        {on ? "Seçildi" : tbl.isAvailable ? "Müsait" : "Dolu"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </fieldset>
  );
}
