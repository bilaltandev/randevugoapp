"use client";

import React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LAYOUTS, type LayoutId } from "@/lib/themes/layouts";

/** Tiny wireframes that show each layout's structure, not its colors. */
function Wireframe({ id, accent }: { id: LayoutId; accent: string }) {
  const bar = "rounded-[2px] bg-ink-3/35";
  if (id === "editorial") {
    return (
      <div className="flex h-full flex-col gap-2 bg-surface p-3">
        <div className="flex items-center justify-between">
          <div className={cn(bar, "h-1.5 w-10")} />
          <div className="h-2 w-6" style={{ backgroundColor: accent }} />
        </div>
        <div className="grid flex-1 grid-cols-12 gap-2">
          <div className="col-span-7 flex flex-col justify-end gap-1">
            <div className="h-3.5 w-full rounded-[2px] bg-ink/80" />
            <div className="h-3.5 w-3/4 rounded-[2px] bg-ink/80" />
            <div className={cn(bar, "mt-1 h-1 w-2/3")} />
            <div className="mt-1 h-2 w-8" style={{ backgroundColor: accent }} />
          </div>
          <div className="col-span-5 bg-ink-3/45" />
        </div>
        <div className="space-y-1 border-t border-line pt-1.5">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={cn(bar, "h-1 w-8")} />
              <div className="flex-1 border-b border-dotted border-ink-3/50" />
              <div className={cn(bar, "h-1 w-3")} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (id === "cinematic") {
    return (
      <div className="flex h-full flex-col bg-surface">
        <div className="relative flex flex-[1.4] flex-col justify-end gap-1 bg-gradient-to-t from-black to-black/40 p-3">
          <div className="h-3.5 w-3/4 rounded-[2px] bg-white/90" />
          <div className="h-1 w-1/2 rounded-[2px] bg-white/50" />
          <div className="mt-1 h-2 w-8 rounded-full" style={{ backgroundColor: accent }} />
        </div>
        <div className="flex flex-1 gap-1.5 overflow-hidden p-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex w-1/3 shrink-0 flex-col overflow-hidden rounded-[3px] border border-line">
              <div className="flex-1 bg-ink-3/35" />
              <div className="h-2 bg-surface" />
            </div>
          ))}
        </div>
        <div className="h-3" style={{ backgroundColor: accent }} />
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col gap-1.5 bg-surface p-3">
      <div className="grid h-8 grid-cols-3 gap-1">
        <div className="col-span-2 rounded-[3px] bg-ink-3/40" />
        <div className="grid grid-rows-2 gap-1">
          <div className="rounded-[3px] bg-ink-3/30" />
          <div className="rounded-[3px] bg-ink-3/30" />
        </div>
      </div>
      <div className={cn(bar, "h-2 w-1/2 bg-ink/70")} />
      <div className="grid flex-1 grid-cols-3 gap-1.5">
        <div className="col-span-2 space-y-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-[3px] border border-line px-1 py-1">
              <div className={cn(bar, "h-1 w-8")} />
              <div className="h-1.5 w-3 rounded-full" style={{ backgroundColor: i === 0 ? accent : undefined }} />
            </div>
          ))}
        </div>
        <div className="rounded-[3px] border border-line p-1">
          <div className="mt-auto h-2 w-full rounded-[2px]" style={{ backgroundColor: accent }} />
        </div>
      </div>
    </div>
  );
}

interface LayoutPickerProps {
  activeLayout: LayoutId;
  accent: string;
  savingId: LayoutId | null;
  onSelect: (id: LayoutId) => void;
}

export function LayoutPicker({ activeLayout, accent, savingId, onSelect }: LayoutPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Sayfa düzeni">
      {LAYOUTS.map((layout) => {
        const active = layout.id === activeLayout;
        return (
          <button
            key={layout.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={savingId !== null}
            onClick={() => onSelect(layout.id)}
            className={cn(
              "group overflow-hidden rounded-panel border text-left transition-colors disabled:cursor-wait",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              active ? "border-brand ring-1 ring-brand" : "border-line hover:border-line-strong"
            )}
          >
            <div className="aspect-[16/10] border-b border-line" aria-hidden="true">
              <Wireframe id={layout.id} accent={accent} />
            </div>
            <div className="space-y-1 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{layout.name}</span>
                {savingId === layout.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-ink-3" aria-hidden="true" />
                ) : active ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-ink">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Kullanılıyor
                  </span>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-ink-3">{layout.description}</p>
              <p className="text-xs text-ink-2">Uygun: {layout.bestFor}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
