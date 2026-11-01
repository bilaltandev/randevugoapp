"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Monitor, Tablet, Smartphone, X, Check, Lock } from "lucide-react";
import { ThemeConfig, ThemeOverrides } from "@/lib/themes/types";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { ThemedPageRenderer } from "./ThemedPageRenderer";

interface ThemeLivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig | null;
  overrides?: ThemeOverrides | null;
  sectionOrder?: string[] | null;
  hiddenSections?: string[] | null;
  business: any;
  services: any[];
  employees: any[];
  reviews: any[];
  gallery?: any;
  galleryItems?: any[];
  workingHours?: any[];
  appointments?: any[];
  onApply: (theme: ThemeConfig) => void;
  isActiveTheme: boolean;
  isApplying?: boolean;
  /** Premium theme on a free plan: can be previewed, not applied. */
  locked?: boolean;
}

export function ThemeLivePreviewModal({
  isOpen,
  onClose,
  theme,
  overrides,
  sectionOrder,
  hiddenSections,
  business,
  services,
  employees,
  reviews,
  gallery,
  galleryItems,
  workingHours = [],
  appointments = [],
  onApply,
  isActiveTheme,
  isApplying = false,
  locked = false,
}: ThemeLivePreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  if (!isOpen || !theme) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas" role="dialog" aria-modal="true" aria-label={`${theme.name} önizlemesi`}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-3 py-2.5 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{theme.name}</p>
          <p className="hidden truncate text-xs text-ink-3 sm:block">
            {business.name} verileriyle canlı önizleme
          </p>
        </div>

        <Segmented
          aria-label="Cihaz"
          value={device}
          onChange={setDevice}
          options={[
            { value: "desktop", label: <span className="hidden sm:inline">Masaüstü</span>, icon: Monitor },
            { value: "tablet", label: <span className="hidden sm:inline">Tablet</span>, icon: Tablet },
            { value: "mobile", label: <span className="hidden sm:inline">Mobil</span>, icon: Smartphone },
          ]}
        />

        <div className="flex items-center gap-1.5">
          {locked ? (
            <Link
              href="/dashboard/subscription"
              className="inline-flex h-8 items-center gap-1.5 rounded-control bg-brand px-3 text-sm font-medium text-on-brand hover:bg-brand-hover"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Paketi yükselt
            </Link>
          ) : (
          <Button
            size="sm"
            variant={isActiveTheme ? "secondary" : "primary"}
            onClick={() => onApply(theme)}
            disabled={isActiveTheme || isApplying}
          >
            {isActiveTheme ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Aktif tema</span>
              </>
            ) : isApplying ? (
              "Uygulanıyor..."
            ) : (
              "Uygula"
            )}
          </Button>
          )}
          <Button size="sm" variant="ghost" className="w-8 px-0" onClick={onClose} aria-label="Kapat" title="Kapat">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview canvas */}
      <div className="theme-live-preview-viewport flex flex-1 items-start justify-center overflow-y-auto bg-surface-muted p-2 sm:p-6">
        <ThemedPageRenderer
          business={business}
          services={services}
          employees={employees}
          reviews={reviews}
          gallery={gallery}
          galleryItems={galleryItems}
          workingHours={workingHours}
          appointments={appointments}
          themeId={theme.id}
          themeOverrides={overrides}
          sectionOrder={sectionOrder}
          hiddenSections={hiddenSections}
          previewDevice={device}
        />
      </div>
    </div>
  );
}
