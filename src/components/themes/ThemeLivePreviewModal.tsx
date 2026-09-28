"use client";

import React, { useState } from "react";
import { Monitor, Tablet, Smartphone, X, Check, Sparkles, ExternalLink } from "lucide-react";
import { ThemeConfig, ThemeOverrides } from "@/lib/themes/types";
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
}: ThemeLivePreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  if (!isOpen || !theme) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col animate-fade-in">
      {/* Top Controller Bar */}
      <div className="px-4 py-3 sm:px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100">{theme.name}</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                {theme.id}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              Gerçek işletme verileriniz ({business.name}) ile canlı önizleme
            </p>
          </div>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setDevice("desktop")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              device === "desktop"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Masaüstü</span>
          </button>

          <button
            onClick={() => setDevice("tablet")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              device === "tablet"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            onClick={() => setDevice("mobile")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              device === "mobile"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobil</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onApply(theme)}
            disabled={isActiveTheme || isApplying}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              isActiveTheme
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 active:scale-95"
            }`}
          >
            {isActiveTheme ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Aktif Tema</span>
              </>
            ) : isApplying ? (
              <span>Uygulanıyor...</span>
            ) : (
              <span>Temayı Uygula</span>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Viewport Canvas */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-2 sm:p-6 flex justify-center items-start theme-live-preview-viewport">
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
