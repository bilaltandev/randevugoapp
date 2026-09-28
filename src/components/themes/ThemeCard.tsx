"use client";

import React from "react";
import { Sparkles, Check, Eye, ShieldCheck, Star } from "lucide-react";
import { ThemeConfig } from "@/lib/themes/types";

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
      className={`group relative flex flex-col justify-between rounded-3xl border transition-all duration-300 overflow-hidden ${
        isActive
          ? "border-emerald-500 bg-slate-900/90 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/50"
          : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-2xl"
      }`}
    >
      {/* Top Banner Badges */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {isRecommended && (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-1 text-[11px] font-bold text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Sektörünüze Özel</span>
          </span>
        )}
        {theme.badge && !isRecommended && (
          <span className="rounded-full bg-slate-800/90 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-700 backdrop-blur-md">
            {theme.badge}
          </span>
        )}
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md shadow-emerald-500/30">
            <Check className="w-3 h-3" />
            <span>Aktif Tema</span>
          </span>
        )}
      </div>

      {/* Interactive Miniature Mockup Preview */}
      <div
        onClick={() => onPreview(theme)}
        className="cursor-pointer relative h-48 w-full p-4 overflow-hidden border-b transition-transform duration-500 group-hover:scale-[1.01]"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        }}
      >
        {/* Glow sphere */}
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl opacity-40 pointer-events-none"
          style={{ backgroundColor: theme.colors.primary }}
        />

        {/* Mini Navbar */}
        <div
          className="rounded-xl px-3 py-2 border mb-3 flex items-center justify-between shadow-sm"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {businessName.slice(0, 1)}
            </div>
            <span
              className="text-[11px] font-bold truncate max-w-[110px]"
              style={{ color: theme.colors.text }}
            >
              {businessName}
            </span>
          </div>
          <div
            className="px-2 py-0.5 rounded text-[9px] font-bold text-white"
            style={{ backgroundColor: theme.colors.primary }}
          >
            Randevu Al
          </div>
        </div>

        {/* Mini Hero */}
        <div className="text-center py-2 px-1">
          <div
            className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold mb-1 border"
            style={{
              backgroundColor: theme.colors.badgeBg,
              color: theme.colors.badgeText,
              borderColor: theme.colors.borderLight,
            }}
          >
            ● {theme.tagline}
          </div>
          <h4
            className="text-xs font-extrabold truncate"
            style={{
              color: theme.colors.text,
              fontFamily: theme.typography.headingFont,
            }}
          >
            {businessName}
          </h4>
        </div>

        {/* Mini Cards Grid */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div
            className="p-2 rounded-lg border text-left"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            <div
              className="w-12 h-1.5 rounded mb-1"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div
              className="w-16 h-1 rounded opacity-40"
              style={{ backgroundColor: theme.colors.text }}
            />
          </div>
          <div
            className="p-2 rounded-lg border text-left"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            <div
              className="w-10 h-1.5 rounded mb-1"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div
              className="w-14 h-1 rounded opacity-40"
              style={{ backgroundColor: theme.colors.text }}
            />
          </div>
        </div>

        {/* Hover Overlay Hint */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="rounded-xl bg-white/20 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg">
            <Eye className="w-3.5 h-3.5" />
            <span>Canlı Önizle</span>
          </span>
        </div>
      </div>

      {/* Body Info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-base font-bold text-slate-100 group-hover:text-white">
              {theme.name}
            </h3>
            {/* Color preview dots */}
            <div className="flex items-center gap-1.5">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: theme.colors.primary }}
                title={`Vurgu Rengi: ${theme.colors.primary}`}
              />
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: theme.colors.background }}
                title={`Arka Plan: ${theme.colors.background}`}
              />
            </div>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {theme.description}
          </p>

          {/* Suitable Sectors */}
          <div className="flex flex-wrap gap-1.5">
            {theme.categoryLabels.map((cat, i) => (
              <span
                key={i}
                className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
          <button
            onClick={() => onPreview(theme)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Önizle</span>
          </button>

          <button
            onClick={() => onApply(theme)}
            disabled={isActive || isApplying}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
              isActive
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 shadow-md shadow-indigo-600/20"
            }`}
          >
            {isActive ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Uygulandı</span>
              </>
            ) : isApplying ? (
              <span>Uygulanıyor...</span>
            ) : (
              <span>Temayı Uygula</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
