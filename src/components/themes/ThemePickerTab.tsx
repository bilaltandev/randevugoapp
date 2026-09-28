"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Palette,
  CheckCircle2,
  RotateCcw,
  Eye,
  Sliders,
  Layers,
  ArrowUp,
  ArrowDown,
  Lock,
  EyeOff,
  AlertCircle,
  Check,
} from "lucide-react";
import { ThemeConfig, ThemeOverrides, SectorType } from "@/lib/themes/types";
import { THEME_REGISTRY, getThemeConfig, getSectorRecommendations } from "@/lib/themes/registry";
import { checkContrastSafety, mergeThemeWithOverrides } from "@/lib/themes/utils";
import { ThemeCard } from "./ThemeCard";
import { ThemeLivePreviewModal } from "./ThemeLivePreviewModal";

interface ThemePickerTabProps {
  business: any;
  services: any[];
  employees: any[];
  reviews: any[];
  workingHours?: any[];
  appointments?: any[];
  gallery?: any;
  galleryItems?: any[];
  activeThemeId: string;
  themeOverrides: ThemeOverrides | null;
  sectionOrder: string[];
  hiddenSections: string[];
  onApplyTheme: (themeId: string) => Promise<void>;
  onUpdateOverrides: (newOverrides: ThemeOverrides | null) => Promise<void>;
  onUpdateSections: (newOrder: string[], newHidden: string[]) => Promise<void>;
  onResetToDefault: () => Promise<void>;
}

const FILTER_TAGS = [
  { id: "ALL", label: "Tümü" },
  { id: "BERBER", label: "Berber" },
  { id: "GUZELLIK", label: "Güzellik" },
  { id: "RESTORAN", label: "Restoran" },
  { id: "KLINIK", label: "Klinik" },
  { id: "OTO_SERVIS", label: "Oto Servis" },
  { id: "DARK", label: "Koyu (Dark)" },
  { id: "LIGHT", label: "Açık (Light)" },
  { id: "LUXURY", label: "Lüks & Gold" },
  { id: "MINIMAL", label: "Minimal" },
];

const AVAILABLE_SECTIONS = [
  { id: "Hero", name: "Kapak / Hero", isCritical: true, desc: "Karşılama ve ana başlık" },
  { id: "Services", name: "Hizmetler & Menü", isCritical: true, desc: "Fiyat ve hizmet listesi (Zorunlu)" },
  { id: "Staff", name: "Çalışanlar & Ekip", isCritical: false, desc: "Uzman kadro ve çalışma arkadaşları" },
  { id: "Gallery", name: "Fotoğraf Galerisi", isCritical: false, desc: "Portföy ve çalışma fotoğrafları" },
  { id: "Reviews", name: "Müşteri Değerlendirmeleri", isCritical: false, desc: "Puanlar ve gerçek müşteri yorumları" },
  { id: "Booking", name: "Rezervasyon Motoru", isCritical: true, desc: "Online randevu takvimi ve saat seçimi" },
  { id: "Location", name: "Konum & İletişim", isCritical: false, desc: "Harita, telefon ve adres bilgileri" },
];

export function ThemePickerTab({
  business,
  services,
  employees,
  reviews,
  workingHours = [],
  appointments = [],
  gallery,
  galleryItems,
  activeThemeId,
  themeOverrides,
  sectionOrder,
  hiddenSections,
  onApplyTheme,
  onUpdateOverrides,
  onUpdateSections,
  onResetToDefault,
}: ThemePickerTabProps) {
  const [subTab, setSubTab] = useState<"catalog" | "customize">("catalog");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [previewTheme, setPreviewTheme] = useState<ThemeConfig | null>(null);
  const [isApplyingId, setIsApplyingId] = useState<string | null>(null);
  const [customPrimaryColor, setCustomPrimaryColor] = useState(
    themeOverrides?.primaryColor || ""
  );
  const [isSavingCustomizer, setIsSavingCustomizer] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const currentTheme = getThemeConfig(activeThemeId);
  const recommendedIds = getSectorRecommendations(business.sector);

  // Filter themes
  const allThemes = Object.values(THEME_REGISTRY);
  const filteredThemes = allThemes.filter((t) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "DARK") return t.styleCategory === "dark";
    if (activeFilter === "LIGHT") return t.styleCategory === "light";
    if (activeFilter === "LUXURY") return t.styleCategory === "luxury";
    if (activeFilter === "MINIMAL") return t.styleCategory === "minimal";
    return t.supportedCategories.includes(activeFilter as SectorType);
  });

  const recommendedThemes = allThemes.filter((t) => recommendedIds.includes(t.id));

  // Contrast check
  const activeBg = currentTheme.colors.background;
  const currentAccent = customPrimaryColor || currentTheme.colors.primary;
  const contrastResult = checkContrastSafety(currentAccent, activeBg);

  const handleApply = async (theme: ThemeConfig) => {
    setIsApplyingId(theme.id);
    try {
      await onApplyTheme(theme.id);
      setSavedMessage(`"${theme.name}" teması başarıyla uygulandı!`);
      setTimeout(() => setSavedMessage(null), 3500);
      if (previewTheme) setPreviewTheme(null);
    } finally {
      setIsApplyingId(null);
    }
  };

  const handleSaveAccent = async (colorHex: string) => {
    setIsSavingCustomizer(true);
    try {
      setCustomPrimaryColor(colorHex);
      await onUpdateOverrides({
        ...(themeOverrides || {}),
        primaryColor: colorHex,
      });
      setSavedMessage("Tema vurgu rengi güncellendi!");
      setTimeout(() => setSavedMessage(null), 3000);
    } finally {
      setIsSavingCustomizer(false);
    }
  };

  const handleToggleSectionVisibility = async (secId: string) => {
    const isHidden = hiddenSections.includes(secId);
    let nextHidden: string[];
    if (isHidden) {
      nextHidden = hiddenSections.filter((s) => s !== secId);
    } else {
      nextHidden = [...hiddenSections, secId];
    }
    await onUpdateSections(sectionOrder, nextHidden);
  };

  const handleMoveSection = async (index: number, direction: "up" | "down") => {
    const newOrder = [...sectionOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    await onUpdateSections(newOrder, hiddenSections);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Sub-header navigation (Catalog vs Customizer) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">Hazır Tema Sistemi</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Aktif: {currentTheme.name}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Sektörünüze özel hazırlanmış profesyonel temalardan birini seçin. Mevcut randevu ve hizmet verileriniz korunur.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setSubTab("catalog")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              subTab === "catalog"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Hazır Temalar ({allThemes.length})</span>
          </button>

          <button
            onClick={() => setSubTab("customize")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              subTab === "customize"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Özelleştir & Sırala</span>
          </button>
        </div>
      </div>

      {savedMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* ────────────────── CATALOG VIEW ────────────────── */}
      {subTab === "catalog" && (
        <div className="space-y-10">
          {/* Size Önerilen Temalar Banner */}
          {recommendedThemes.length > 0 && activeFilter === "ALL" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Size Önerilen Temalar ({business.sector} Sektörü)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedThemes.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isActive={activeThemeId === theme.id}
                    isRecommended={true}
                    businessName={business.name}
                    onPreview={setPreviewTheme}
                    onApply={handleApply}
                    isApplying={isApplyingId === theme.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Filter Pills */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
              {FILTER_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setActiveFilter(tag.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeFilter === tag.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={activeThemeId === theme.id}
                  isRecommended={recommendedIds.includes(theme.id)}
                  businessName={business.name}
                  onPreview={setPreviewTheme}
                  onApply={handleApply}
                  isApplying={isApplyingId === theme.id}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── CUSTOMIZE & REORDER VIEW ────────────────── */}
      {subTab === "customize" && (
        <div className="space-y-8">
          {/* Accent Color Customizer */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <span>İşletmeye Özel Vurgu Rengi ({currentTheme.name})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Seçili temanın buton, rozet ve vurgu rengini işletmenizin kurumsal rengiyle değiştirin.
                </p>
              </div>

              {/* Reset to Default Button */}
              <button
                onClick={async () => {
                  setCustomPrimaryColor("");
                  await onResetToDefault();
                  setSavedMessage("Tema ayarları ve renkler varsayılana sıfırlandı!");
                  setTimeout(() => setSavedMessage(null), 3000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors self-start sm:self-auto"
                title="İçerikler silinmez, sadece tema varsayılanına döner"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Temayı Varsayılana Döndür</span>
              </button>
            </div>

            {/* Suggested Theme Accents */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-3">
                Bu Tema İçin Tavsiye Edilen Palet:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentTheme.suggestedAccents.map((acc) => {
                  const isSelected = (customPrimaryColor || currentTheme.colors.primary) === acc.hex;
                  return (
                    <button
                      key={acc.hex}
                      onClick={() => handleSaveAccent(acc.hex)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-slate-800/80 ring-2 ring-indigo-500/30"
                          : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shrink-0 shadow-sm"
                        style={{ backgroundColor: acc.hex }}
                      />
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-200 block truncate">
                          {acc.name}
                        </span>
                        <span className="text-[10px] text-slate-400">{acc.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hex Input & Contrast Checker */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-300">Özel Renk Kodu:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customPrimaryColor || currentTheme.colors.primary}
                    onChange={(e) => handleSaveAccent(e.target.value)}
                    className="w-9 h-9 rounded-xl bg-transparent border border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customPrimaryColor || currentTheme.colors.primary}
                    onChange={(e) => handleSaveAccent(e.target.value)}
                    className="w-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                    placeholder="#00C98D"
                  />
                </div>
              </div>

              {/* Contrast feedback badge */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                  contrastResult.isSafe
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                }`}
              >
                {contrastResult.isSafe ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{contrastResult.message}</span>
              </div>
            </div>
          </div>

          {/* Section Visibility and Order */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Sayfa Bölümlerinin Görünürlüğü ve Sıralaması
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Sürükleme ve butonlarla sırayı değiştirin, istenmeyen bölümleri gizleyin.
              </span>
            </div>

            <div className="space-y-3">
              {sectionOrder.map((secId, idx) => {
                const sectionDef = AVAILABLE_SECTIONS.find((s) => s.id === secId) || {
                  id: secId,
                  name: secId,
                  isCritical: false,
                  desc: "Sayfa Bölümü",
                };
                const isHidden = hiddenSections.includes(secId);

                return (
                  <div
                    key={secId}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isHidden
                        ? "border-slate-800/40 bg-slate-950/30 opacity-60"
                        : "border-slate-800 bg-slate-950/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100 text-sm">
                            {sectionDef.name}
                          </span>
                          {sectionDef.isCritical && (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-amber-300 font-medium">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Zorunlu</span>
                            </span>
                          )}
                          {isHidden && (
                            <span className="rounded bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-400">
                              Gizlendi
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{sectionDef.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Move Up/Down */}
                      <button
                        onClick={() => handleMoveSection(idx, "up")}
                        disabled={idx === 0}
                        className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-20 transition-colors"
                        title="Yukarı Taşı"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(idx, "down")}
                        disabled={idx === sectionOrder.length - 1}
                        className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-20 transition-colors"
                        title="Aşağı Taşı"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Visibility Toggle */}
                      {sectionDef.isCritical ? (
                        <div
                          className="px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-500 flex items-center gap-1"
                          title="Bu bölüm işletmeniz için kritik olduğu için kapatılamaz."
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Kilitli</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleToggleSectionVisibility(secId)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            isHidden
                              ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                              : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                          }`}
                        >
                          {isHidden ? "Göster" : "Gizle"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── LIVE PREVIEW MODAL ────────────────── */}
      <ThemeLivePreviewModal
        isOpen={!!previewTheme}
        onClose={() => setPreviewTheme(null)}
        theme={previewTheme}
        overrides={themeOverrides}
        sectionOrder={sectionOrder}
        hiddenSections={hiddenSections}
        business={business}
        services={services}
        employees={employees}
        reviews={reviews}
        gallery={gallery}
        galleryItems={galleryItems}
        workingHours={workingHours}
        appointments={appointments}
        onApply={handleApply}
        isActiveTheme={previewTheme ? activeThemeId === previewTheme.id : false}
        isApplying={previewTheme ? isApplyingId === previewTheme.id : false}
      />
    </div>
  );
}
