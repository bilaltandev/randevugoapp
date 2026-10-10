"use client";

import React from "react";
import { Sparkles, Check, Eye } from "lucide-react";
import { ThemeConfig } from "@/lib/themes/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface ThemeCardProps {
  theme: ThemeConfig;
  isActive: boolean;
  isRecommended: boolean;
  businessName: string;
  onPreview: (theme: ThemeConfig) => void;
  onApply: (theme: ThemeConfig) => void;
  isApplying?: boolean;
}

export function ThemeCard({
  theme,
  isActive,
  isRecommended,
  businessName,
  onPreview,
  onApply,
  isApplying = false,
}: ThemeCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-panel border bg-surface transition-colors",
        isActive ? "border-brand ring-1 ring-brand" : "border-line hover:border-line-strong"
      )}
    >
      {/* Badges */}
      <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5">
        {isRecommended && (
          <span className="inline-flex items-center gap-1 rounded-control bg-white/90 px-1.5 py-0.5 text-xs font-medium text-slate-800">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Önerilen
          </span>
        )}
        {theme.badge && !isRecommended && (
          <span className="rounded-control bg-white/90 px-1.5 py-0.5 text-xs font-medium text-slate-800">
            {theme.badge}
          </span>
        )}
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-control bg-brand px-1.5 py-0.5 text-xs font-medium text-white">
            <Check className="h-3 w-3" aria-hidden="true" />
            Aktif
          </span>
        )}
      </div>

      {/* Miniature mockup in the theme's own colors */}
      <button
        type="button"
        onClick={() => onPreview(theme)}
        aria-label={`${theme.name} temasını önizle`}
        className="relative h-44 w-full overflow-hidden border-b p-4 text-left"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        }}
      >
        {/* Mini Navbar */}
        <div
          className="mb-3 flex items-center justify-between rounded-lg border px-3 py-2"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold text-white"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {businessName.slice(0, 1)}
            </div>
            <span className="max-w-[110px] truncate text-[11px] font-bold" style={{ color: theme.colors.text }}>
              {businessName}
            </span>
          </div>
          <div
            className="rounded px-2 py-0.5 text-[9px] font-bold text-white"
            style={{ backgroundColor: theme.colors.primary }}
          >
            Randevu Al
          </div>
        </div>

        {/* Mini Hero */}
        <div className="px-1 py-1 text-center">
          <div
            className="mb-1 inline-block rounded-full border px-2 py-0.5 text-[8px] font-bold"
            style={{
              backgroundColor: theme.colors.badgeBg,
              color: theme.colors.badgeText,
              borderColor: theme.colors.borderLight,
            }}
          >
            ● {theme.tagline}
          </div>
          <h4
            className="truncate text-xs font-extrabold"
            style={{
              color: theme.colors.text,
              fontFamily: theme.typography.headingFont,
            }}
          >
            {businessName}
          </h4>
        </div>

        {/* Mini Cards Grid */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[12, 10].map((w, i) => (
            <div
              key={i}
              className="rounded-lg border p-2"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <div className="mb-1 h-1.5 rounded" style={{ width: `${w * 4}px`, backgroundColor: theme.colors.primary }} />
              <div
                className="h-1 rounded opacity-40"
                style={{ width: `${(w + 4) * 4}px`, backgroundColor: theme.colors.text }}
              />
            </div>
          ))}
        </div>

        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-control bg-white px-2.5 py-1 text-xs font-medium text-slate-900">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Önizle
          </span>
        </span>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">{theme.name}</h3>
            <div className="flex items-center gap-1">
              <span
                className="h-3.5 w-3.5 rounded-full border border-black/10"
                style={{ backgroundColor: theme.colors.primary }}
                title={`Vurgu rengi: ${theme.colors.primary}`}
              />
              <span
                className="h-3.5 w-3.5 rounded-full border border-black/10"
                style={{ backgroundColor: theme.colors.background }}
                title={`Arka plan: ${theme.colors.background}`}
              />
            </div>
          </div>

          <p className="mb-2.5 line-clamp-2 text-sm text-ink-3">{theme.description}</p>

          <div className="flex flex-wrap gap-1">
            {theme.categoryLabels.map((cat, i) => (
              <span key={i} className="rounded-control bg-surface-muted px-1.5 py-0.5 text-xs text-ink-2">
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line pt-3">
          <Button size="sm" className="flex-1" onClick={() => onPreview(theme)}>
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            Önizle
          </Button>
          <Button
            size="sm"
            variant={isActive ? "secondary" : "primary"}
            className="flex-1"
            onClick={() => onApply(theme)}
            disabled={isActive || isApplying}
          >
            {isActive ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Uygulandı
              </>
            ) : isApplying ? (
              "Uygulanıyor..."
            ) : (
              "Uygula"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
