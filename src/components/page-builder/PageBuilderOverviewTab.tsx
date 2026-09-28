"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Video,
  Palette,
  ExternalLink,
  Trash2,
  Upload,
  Play,
  Maximize2,
  Layout,
  ArrowLeft,
  ArrowRight,
  Scissors,
  ShieldCheck,
  Users2,
  Star,
} from "lucide-react";
import { ThemeOverrides } from "@/lib/themes/types";

interface PageBuilderOverviewTabProps {
  business: any;
  themeOverrides: ThemeOverrides | null;
  onUpdateOverrides: (overrides: ThemeOverrides) => void;
  gallery: any;
  onUpdateGallery: (galleryConfig: any) => void;
  onSave: () => void;
  isSaving: boolean;
  savedSuccess: boolean;
  onOpenLivePreviewModal: () => void;
}

export function PageBuilderOverviewTab({
  business,
  themeOverrides,
  onUpdateOverrides,
  gallery,
  onUpdateGallery,
  onOpenLivePreviewModal,
}: PageBuilderOverviewTabProps) {
  // Hero fields state (synced with themeOverrides or business defaults)
  const [heroTitle, setHeroTitle] = useState(
    themeOverrides?.customTitle || business.name || "Ahmet Berber & Styling"
  );
  const [heroDesc, setHeroDesc] = useState(
    themeOverrides?.customSubtitle ||
      business.description ||
      "Modern stil, profesyonel dokunuş. Kendinize en iyi bakım, en iyi randevu ile başlar."
  );
  const [bgType, setBgType] = useState<"image" | "video" | "color">(
    themeOverrides?.heroBgType || "image"
  );
  const [coverImage, setCoverImage] = useState(
    themeOverrides?.coverImage ||
      business.coverImage ||
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&h=600&fit=crop"
  );
  const [showLogo, setShowLogo] = useState(themeOverrides?.showLogo !== false);
  const [showSlogan, setShowSlogan] = useState(themeOverrides?.showSlogan !== false);
  const [sloganText, setSloganText] = useState(
    themeOverrides?.sloganText ||
      (business.sector === "BERBER" ? "Erkek Kuaförü & Berber" : business.sector || "Özel Hizmet")
  );
  const [ctaText, setCtaText] = useState(
    themeOverrides?.customCtaText || "Hemen Randevu Al"
  );
  const [ctaColor, setCtaColor] = useState<"purple" | "green" | "custom">(
    themeOverrides?.ctaColor || "purple"
  );

  // Sync to parent themeOverrides
  const syncOverrides = (updates: Partial<ThemeOverrides>) => {
    const nextOverrides: ThemeOverrides = {
      ...(themeOverrides || {}),
      customTitle: heroTitle,
      customSubtitle: heroDesc,
      heroBgType: bgType,
      coverImage,
      showLogo,
      showSlogan,
      sloganText,
      customCtaText: ctaText,
      ctaColor,
      primaryColor:
        (updates.ctaColor || ctaColor) === "purple"
          ? "#6246EA"
          : (updates.ctaColor || ctaColor) === "green"
          ? "#00C98D"
          : themeOverrides?.primaryColor || "#6246EA",
      ...updates,
    };
    onUpdateOverrides(nextOverrides);
  };

  // Gallery layout change
  const currentLayout = gallery?.layout || "INFINITE_FLOW";
  const currentDirection = gallery?.direction || "right-to-left";
  const currentSpeed = gallery?.speed || "FAST";
  const currentSize = gallery?.imageSize || "MEDIUM";
  const currentAspect = gallery?.aspectRatio || "4:5";

  const handleLayoutChange = (layout: string) => {
    onUpdateGallery({ ...gallery, layout });
  };

  const handleDirectionChange = (direction: string) => {
    onUpdateGallery({ ...gallery, direction });
  };

  const handleSpeedSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    const speedMap: Record<number, string> = {
      1: "VERY_SLOW",
      2: "SLOW",
      3: "NORMAL",
      4: "FAST",
      5: "VERY_FAST",
    };
    onUpdateGallery({ ...gallery, speed: speedMap[val] || "NORMAL" });
  };

  const getSpeedSliderValue = (spd: string) => {
    switch (spd) {
      case "VERY_SLOW":
        return 1;
      case "SLOW":
        return 2;
      case "NORMAL":
        return 3;
      case "FAST":
        return 4;
      case "VERY_FAST":
        return 5;
      default:
        return 4;
    }
  };

  const getSpeedLabel = (spd: string) => {
    switch (spd) {
      case "VERY_SLOW":
        return "Çok Yavaş";
      case "SLOW":
        return "Yavaş";
      case "NORMAL":
        return "Normal";
      case "FAST":
        return "Hızlı";
      case "VERY_FAST":
        return "Çok Hızlı";
      default:
        return "Hızlı";
    }
  };

  const handleSizeChange = (imageSize: string) => {
    onUpdateGallery({ ...gallery, imageSize });
  };

  const handleAspectChange = (aspectRatio: string) => {
    onUpdateGallery({ ...gallery, aspectRatio });
  };

  // Sample covers to choose from
  const sampleCovers = [
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&h=600&fit=crop",
  ];

  const handleToggleCoverModal = () => {
    const nextIdx = (sampleCovers.indexOf(coverImage) + 1) % sampleCovers.length;
    const nextCover = sampleCovers[nextIdx];
    setCoverImage(nextCover);
    syncOverrides({ coverImage: nextCover });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ────────────────── LEFT COLUMN (HERO & GALLERY LAYOUT) ────────────────── */}
      <div className="lg:col-span-7 space-y-6">
        {/* 1. HERO AYARLARI CARD */}
        <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#1E2742] bg-white dark:bg-[#0E1528] p-5 sm:p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6246EA]/10 text-[#6246EA]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white">
                Hero Ayarları
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Sayfanızın üst bölümünü özelleştirin.
              </p>
            </div>
          </div>

          {/* Form Content: 2 Subcolumns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Subcol: Title, Description, Background */}
            <div className="space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1.5">
                  Başlık
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={heroTitle}
                  onChange={(e) => {
                    setHeroTitle(e.target.value);
                    syncOverrides({ customTitle: e.target.value });
                  }}
                  className="w-full rounded-xl border border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] px-3.5 py-2.5 text-xs sm:text-sm text-[#111827] dark:text-white placeholder-[#98A2B3] focus:border-[#6246EA] focus:outline-none focus:ring-2 focus:ring-[#6246EA]/15 transition-all"
                  placeholder="İşletme Adınız"
                />
                <div className="text-[11px] text-[#98A2B3] text-right mt-1 font-medium">
                  {heroTitle.length}/60
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1.5">
                  Açıklama
                </label>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={heroDesc}
                  onChange={(e) => {
                    setHeroDesc(e.target.value);
                    syncOverrides({ customSubtitle: e.target.value });
                  }}
                  className="w-full rounded-xl border border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] p-3 text-xs sm:text-sm text-[#111827] dark:text-white placeholder-[#98A2B3] focus:border-[#6246EA] focus:outline-none focus:ring-2 focus:ring-[#6246EA]/15 transition-all resize-none"
                  placeholder="İşletmenizi tanıtan kısa bir karşılama metni..."
                />
                <div className="text-[11px] text-[#98A2B3] text-right mt-1 font-medium">
                  {heroDesc.length}/160
                </div>
              </div>

              {/* Arka Plan Türü */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1.5">
                  Arka Plan Türü
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F8F9FC] dark:bg-[#151D36] border border-[#E4E7EC] dark:border-[#263152]">
                  <button
                    type="button"
                    onClick={() => {
                      setBgType("image");
                      syncOverrides({ heroBgType: "image" });
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      bgType === "image"
                        ? "bg-[#ECE8FF] text-[#6246EA] shadow-xs"
                        : "text-[#667085] dark:text-slate-400 hover:text-[#111827]"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Görsel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBgType("video");
                      syncOverrides({ heroBgType: "video" });
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      bgType === "video"
                        ? "bg-[#ECE8FF] text-[#6246EA] shadow-xs"
                        : "text-[#667085] dark:text-slate-400 hover:text-[#111827]"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBgType("color");
                      syncOverrides({ heroBgType: "color" });
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      bgType === "color"
                        ? "bg-[#ECE8FF] text-[#6246EA] shadow-xs"
                        : "text-[#667085] dark:text-slate-400 hover:text-[#111827]"
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Renk</span>
                  </button>
                </div>

                {/* Arka Plan Görsel Önizlemesi & Butonları */}
                <div className="relative mt-2.5 h-28 rounded-xl overflow-hidden border border-[#E4E7EC] dark:border-[#263152] group">
                  <img
                    src={coverImage}
                    alt="Hero Arka Plan"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={handleToggleCoverModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium border border-white/20 backdrop-blur-md transition-all shadow-md active:scale-95"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Görseli Değiştir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const fallback = sampleCovers[0];
                        setCoverImage(fallback);
                        syncOverrides({ coverImage: fallback });
                      }}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-900/60 text-white hover:text-rose-300 text-xs border border-white/20 backdrop-blur-md transition-colors"
                      title="Sıfırla"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Subcol: Logo, Slogan, CTA */}
            <div className="space-y-4">
              {/* Logo Göster */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#344054] dark:text-slate-300">
                    Logo Göster
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showLogo;
                      setShowLogo(next);
                      syncOverrides({ showLogo: next });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showLogo ? "bg-[#00C98D]" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        showLogo ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E4E7EC] dark:border-[#263152] bg-[#F8F9FC] dark:bg-[#151D36]">
                  {business.logo ? (
                    <img
                      src={business.logo}
                      alt="Logo"
                      className="w-10 h-10 rounded-lg object-cover border border-[#E4E7EC] dark:border-[#263152] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#6246EA]/15 text-[#6246EA] flex items-center justify-center font-bold text-sm shrink-0">
                      {business.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-[#6246EA] hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Logo Yükle</span>
                    </span>
                    <p className="text-[11px] text-[#98A2B3] mt-0.5">PNG, JPG (max 2MB)</p>
                  </div>
                </div>
              </div>

              {/* Slogan Göster & Metni */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#344054] dark:text-slate-300">
                    Slogan Göster
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showSlogan;
                      setShowSlogan(next);
                      syncOverrides({ showSlogan: next });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showSlogan ? "bg-[#00C98D]" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        showSlogan ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={60}
                  value={sloganText}
                  disabled={!showSlogan}
                  onChange={(e) => {
                    setSloganText(e.target.value);
                    syncOverrides({ sloganText: e.target.value });
                  }}
                  className="w-full rounded-xl border border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] px-3.5 py-2.5 text-xs sm:text-sm text-[#111827] dark:text-white placeholder-[#98A2B3] focus:border-[#6246EA] focus:outline-none focus:ring-2 focus:ring-[#6246EA]/15 transition-all disabled:opacity-50"
                  placeholder="Slogan / Sektör Etiketi"
                />
                <div className="text-[11px] text-[#98A2B3] text-right mt-1 font-medium">
                  {sloganText.length}/60
                </div>
              </div>

              {/* CTA Buton Metni */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1.5">
                  CTA Buton Metni
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={ctaText}
                  onChange={(e) => {
                    setCtaText(e.target.value);
                    syncOverrides({ customCtaText: e.target.value });
                  }}
                  className="w-full rounded-xl border border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] px-3.5 py-2.5 text-xs sm:text-sm text-[#111827] dark:text-white placeholder-[#98A2B3] focus:border-[#6246EA] focus:outline-none focus:ring-2 focus:ring-[#6246EA]/15 transition-all"
                  placeholder="Hemen Randevu Al"
                />
                <div className="text-[11px] text-[#98A2B3] text-right mt-1 font-medium">
                  {ctaText.length}/30
                </div>
              </div>

              {/* CTA Buton Rengi */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1.5">
                  CTA Buton Rengi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Mor */}
                  <button
                    type="button"
                    onClick={() => {
                      setCtaColor("purple");
                      syncOverrides({ ctaColor: "purple", primaryColor: "#6246EA" });
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      ctaColor === "purple"
                        ? "border-[#6246EA] bg-[#ECE8FF]/60 dark:bg-[#6246EA]/15"
                        : "border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] hover:bg-[#F8F9FC]"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-[#6246EA] flex items-center justify-center mb-1">
                      {ctaColor === "purple" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-[11px] font-semibold text-[#111827] dark:text-white">
                      Mor
                    </span>
                    <span className="text-[9px] text-[#6246EA] font-medium">(Önerilen)</span>
                  </button>

                  {/* Yeşil */}
                  <button
                    type="button"
                    onClick={() => {
                      setCtaColor("green");
                      syncOverrides({ ctaColor: "green", primaryColor: "#00C98D" });
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      ctaColor === "green"
                        ? "border-[#00C98D] bg-emerald-50 dark:bg-emerald-950/20"
                        : "border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] hover:bg-[#F8F9FC]"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-[#00C98D] flex items-center justify-center mb-1">
                      {ctaColor === "green" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-[11px] font-semibold text-[#111827] dark:text-white">
                      RandevuGo
                    </span>
                    <span className="text-[9px] text-emerald-600 font-medium">Yeşili</span>
                  </button>

                  {/* Özel Renk */}
                  <button
                    type="button"
                    onClick={() => {
                      setCtaColor("custom");
                      syncOverrides({ ctaColor: "custom" });
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      ctaColor === "custom"
                        ? "border-[#6246EA] bg-[#ECE8FF]/60 dark:bg-[#6246EA]/15"
                        : "border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] hover:bg-[#F8F9FC]"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-slate-400 flex items-center justify-center mb-1" />
                    <span className="text-[11px] font-semibold text-[#111827] dark:text-white mt-1">
                      Özel Renk
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. GALERİ DÜZENİ (LAYOUT) CARD */}
        <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#1E2742] bg-white dark:bg-[#0E1528] p-5 sm:p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6246EA]/10 text-[#6246EA]">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white">
                Galeri Düzeni (Layout)
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Hizmet ve portföy görsellerinizin nasıl görüneceğini seçin.
              </p>
            </div>
          </div>

          {/* 4 Layout Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Infinite Flow */}
            <div
              onClick={() => handleLayoutChange("INFINITE_FLOW")}
              className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col justify-between ${
                currentLayout === "INFINITE_FLOW"
                  ? "border-2 border-[#6246EA] bg-[#F4F3FF] dark:bg-[#6246EA]/10 shadow-sm"
                  : "border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] hover:border-slate-300"
              }`}
            >
              <div>
                {/* Mini thumbnail */}
                <div className="h-16 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center gap-1 p-1 mb-2">
                  <div className="w-1/3 h-full rounded bg-slate-700/80" />
                  <div className="w-1/3 h-full rounded bg-slate-600/80" />
                  <div className="w-1/3 h-full rounded bg-slate-700/80" />
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#111827] dark:text-white">
                  <span className="text-[#6246EA]">∞</span>
                  <span>Infinite Flow</span>
                </div>
                <p className="text-[10px] text-[#667085] dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                  Kesintisiz sağdan sola kayan sonsuz marquee
                </p>
              </div>
            </div>

            {/* 2. Dual Flow */}
            <div
              onClick={() => handleLayoutChange("DUAL_FLOW")}
              className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col justify-between ${
                currentLayout === "DUAL_FLOW"
                  ? "border-2 border-[#6246EA] bg-[#F4F3FF] dark:bg-[#6246EA]/10 shadow-sm"
                  : "border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] hover:border-slate-300"
              }`}
            >
              <div>
                {/* Mini thumbnail */}
                <div className="h-16 rounded-lg bg-slate-900 overflow-hidden flex flex-col justify-center gap-1 p-1 mb-2">
                  <div className="w-full h-1/2 rounded bg-slate-700/80 flex gap-0.5">
                    <div className="w-1/2 h-full bg-slate-600/80 rounded" />
                    <div className="w-1/2 h-full bg-slate-700/80 rounded" />
                  </div>
                  <div className="w-full h-1/2 rounded bg-slate-700/80 flex gap-0.5">
                    <div className="w-1/2 h-full bg-slate-700/80 rounded" />
                    <div className="w-1/2 h-full bg-slate-600/80 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#111827] dark:text-white">
                  <span className="text-[#6246EA]">↔</span>
                  <span>Dual Flow</span>
                </div>
                <p className="text-[10px] text-[#667085] dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                  Çift şeritli, zıt yönlere akan lüks görsel şölen
                </p>
              </div>
            </div>

            {/* 3. Cinematic Strip */}
            <div
              onClick={() => handleLayoutChange("CINEMATIC_STRIP")}
              className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col justify-between ${
                currentLayout === "CINEMATIC_STRIP"
                  ? "border-2 border-[#6246EA] bg-[#F4F3FF] dark:bg-[#6246EA]/10 shadow-sm"
                  : "border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] hover:border-slate-300"
              }`}
            >
              <div>
                {/* Mini thumbnail */}
                <div className="h-16 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center p-1 mb-2">
                  <div className="w-full h-full rounded bg-slate-700/90 flex items-center justify-center text-[9px] text-slate-300 font-serif">
                    Cinematic
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#111827] dark:text-white">
                  <span className="text-[#6246EA]">🎬</span>
                  <span>Cinematic Strip</span>
                </div>
                <p className="text-[10px] text-[#667085] dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                  Geniş sinematik kartlar ve zarif tipografi
                </p>
              </div>
            </div>

            {/* 4. Cards */}
            <div
              onClick={() => handleLayoutChange("CARDS")}
              className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col justify-between ${
                currentLayout === "CARDS"
                  ? "border-2 border-[#6246EA] bg-[#F4F3FF] dark:bg-[#6246EA]/10 shadow-sm"
                  : "border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] hover:border-slate-300"
              }`}
            >
              <div>
                {/* Mini thumbnail */}
                <div className="h-16 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center gap-1 p-1 mb-2">
                  <div className="w-1/2 h-full rounded bg-slate-600/80" />
                  <div className="w-1/2 h-full rounded bg-slate-700/80" />
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#111827] dark:text-white">
                  <span className="text-[#6246EA]">🗂️</span>
                  <span>Cards</span>
                </div>
                <p className="text-[10px] text-[#667085] dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                  Gezilebilir, kart yapısında yatay carousel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── RIGHT COLUMN (PREVIEW, SPEED, SIZE) ────────────────── */}
      <div className="lg:col-span-5 space-y-6">
        {/* 1. SAYFA ÖNİZLEMESİ CARD */}
        <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#1E2742] bg-white dark:bg-[#0E1528] p-5 sm:p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6246EA]/10 text-[#6246EA]">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#111827] dark:text-white">
                  Sayfa Önizlemesi
                </h2>
                <p className="text-xs text-[#667085] dark:text-slate-400">
                  Yaptığınız değişiklikleri anında görüntüleyin.
                </p>
              </div>
            </div>

            <Link
              href={`/${business.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E7EC] dark:border-[#263152] bg-[#F8F9FC] dark:bg-[#151D36] text-xs font-semibold text-[#344054] dark:text-slate-200 hover:bg-[#F2F4F7] transition-colors"
            >
              <span>Yeni Sekmede Aç</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Live Mockup Screen */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#0B0F19] text-white shadow-2xl">
            {/* Top Bar of Mockup */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/60 border-b border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px]">
                  ✂
                </div>
                <span className="text-xs font-bold tracking-tight text-white truncate max-w-[120px]">
                  RandevuGo
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-300">
                <span className="hover:text-white cursor-pointer">Hizmetler</span>
                <span className="hover:text-white cursor-pointer">Çalışanlarımız</span>
                <span className="hover:text-white cursor-pointer">Yorumlar</span>
              </div>
              <button
                type="button"
                onClick={onOpenLivePreviewModal}
                className="px-2.5 py-1 rounded-lg bg-[#00C98D] text-slate-950 font-bold text-[10px] hover:bg-[#00b57e] transition-colors"
              >
                Randevu Al
              </button>
            </div>

            {/* Mockup Hero Content */}
            <div className="relative p-5 sm:p-6 min-h-[220px] flex flex-col justify-center overflow-hidden">
              {/* Background with overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                style={{ backgroundImage: `url(${coverImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/80 to-[#0B0F19]/60" />

              {/* Foreground content */}
              <div className="relative z-10 space-y-2.5 max-w-sm">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  {heroTitle}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed drop-shadow-sm">
                  {heroDesc}
                </p>

                {showSlogan && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                    <Scissors className="w-3 h-3 text-amber-400" />
                    <span>{sloganText}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenLivePreviewModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-transform active:scale-95"
                    style={{
                      backgroundColor: ctaColor === "green" ? "#00C98D" : "#6246EA",
                      color: ctaColor === "green" ? "#0A0E1A" : "#FFFFFF",
                    }}
                  >
                    <span>{ctaText}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Trust Badges Bar inside mockup */}
            <div className="p-3 bg-black/40 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-300">
              <div className="flex items-center gap-1.5 truncate">
                <Users2 className="w-3 h-3 text-[#00C98D] shrink-0" />
                <span className="truncate">Profesyonel Ekip</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3 h-3 text-[#00C98D] shrink-0" />
                <span className="truncate">Hijyenik Ortam</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Scissors className="w-3 h-3 text-[#00C98D] shrink-0" />
                <span className="truncate">Modern Ekipmanlar</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Star className="w-3 h-3 text-[#00C98D] shrink-0" />
                <span className="truncate">%100 Memnuniyet</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. HAREKET & HIZ AYARLARI CARD */}
        <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#1E2742] bg-white dark:bg-[#0E1528] p-5 sm:p-6 shadow-sm space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6246EA]/10 text-[#6246EA]">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white">
                Hareket & Hız Ayarları
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Sayfa geçişleri, animasyonlar ve galeri akış hızını ayarlayın.
              </p>
            </div>
          </div>

          {/* Hareket Yönü */}
          <div>
            <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-2">
              Hareket Yönü
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDirectionChange("right-to-left")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  currentDirection === "right-to-left"
                    ? "border-[#6246EA] bg-[#ECE8FF] text-[#6246EA] dark:bg-[#6246EA]/20 dark:text-[#a89af8]"
                    : "border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] text-[#344054] dark:text-slate-300 hover:bg-[#F8F9FC]"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Sağdan Sola (Varsayılan)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDirectionChange("left-to-right")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  currentDirection === "left-to-right"
                    ? "border-[#6246EA] bg-[#ECE8FF] text-[#6246EA] dark:bg-[#6246EA]/20 dark:text-[#a89af8]"
                    : "border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] text-[#344054] dark:text-slate-300 hover:bg-[#F8F9FC]"
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>Soldan Sağa</span>
              </button>
            </div>
          </div>

          {/* Akış Hızı Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#344054] dark:text-slate-300">
                Akış Hızı
              </label>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                {getSpeedLabel(currentSpeed)}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={getSpeedSliderValue(currentSpeed)}
              onChange={handleSpeedSliderChange}
              className="w-full accent-[#6246EA] cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-[#98A2B3] font-medium mt-1.5">
              <span>Çok Yavaş</span>
              <span>Yavaş</span>
              <span>Normal</span>
              <span className="font-bold text-[#6246EA]">Hızlı</span>
              <span>Çok Hızlı</span>
            </div>
          </div>
        </div>

        {/* 3. GÖRSEL BOYUTU & ORANI CARD */}
        <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#1E2742] bg-white dark:bg-[#0E1528] p-5 sm:p-6 shadow-sm space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6246EA]/10 text-[#6246EA]">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white">
                Görsel Boyutu & Oranı
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Galeri ve portföy görsellerinin ekranda nasıl görüneceğini ayarlayın.
              </p>
            </div>
          </div>

          {/* Görsel Boyutu */}
          <div>
            <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-2">
              Görsel Boyutu
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "SMALL", label: "Küçük", hint: "~200px" },
                { id: "MEDIUM", label: "Orta", hint: "~280px" },
                { id: "LARGE", label: "Büyük", hint: "~360px" },
                { id: "XLARGE", label: "XL", hint: "~450px" },
                { id: "FULL", label: "Tam Ekran", hint: "" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSizeChange(s.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    currentSize === s.id
                      ? "border-[#6246EA] bg-[#ECE8FF] text-[#6246EA] dark:bg-[#6246EA]/20 dark:text-[#a89af8]"
                      : "border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] text-[#667085] dark:text-slate-300 hover:bg-[#F8F9FC]"
                  }`}
                >
                  <span>{s.label}</span>
                  {s.hint && <span className="opacity-60 ml-1 text-[10px]">{s.hint}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Görsel En/Boy Oranı */}
          <div>
            <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-2">
              Görsel En/Boy Oranı
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "4:5", label: "4:5", hint: "Dikey Portre" },
                { id: "1:1", label: "1:1", hint: "Kare" },
                { id: "3:2", label: "3:2", hint: "Klasik Foto" },
                { id: "16:9", label: "16:9", hint: "Geniş Ekran" },
                { id: "21:9", label: "21:9", hint: "Panoramik" },
              ].map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleAspectChange(a.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    currentAspect === a.id
                      ? "border-[#6246EA] bg-[#ECE8FF] text-[#6246EA] dark:bg-[#6246EA]/20 dark:text-[#a89af8]"
                      : "border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#151D36] text-[#667085] dark:text-slate-300 hover:bg-[#F8F9FC]"
                  }`}
                >
                  <span className="font-bold">{a.label}</span>
                  <span className="opacity-70 ml-1 text-[10px]">{a.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
