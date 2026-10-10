"use client";

import React, { useState } from "react";
import {
  Palette,
  CheckCircle2,
  RotateCcw,
  Eye,
  Sliders,
  ArrowUp,
  ArrowDown,
  Lock,
  EyeOff,
  AlertCircle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { inputClasses } from "@/components/ui/Field";
import { choiceClasses } from "@/components/ui/choice";
import { ThemeConfig, ThemeOverrides, SectorType } from "@/lib/themes/types";
import { THEME_REGISTRY, getThemeConfig, getSectorRecommendations } from "@/lib/themes/registry";
import { checkContrastSafety, getCustomAccent } from "@/lib/themes/utils";
import { ThemeCard } from "./ThemeCard";
import { ThemeLivePreviewModal } from "./ThemeLivePreviewModal";
import { LayoutPicker } from "./LayoutPicker";
import { getLayoutId, LAYOUTS, type LayoutId } from "@/lib/themes/layouts";

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
  // Read from the saved overrides so it resets when a new theme is applied.
  const customPrimaryColor = getCustomAccent(themeOverrides) || "";
  const [isSavingCustomizer, setIsSavingCustomizer] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const currentTheme = getThemeConfig(activeThemeId);
  const activeLayout = getLayoutId(themeOverrides?.layoutId);
  const [savingLayout, setSavingLayout] = useState<LayoutId | null>(null);

  const handleSelectLayout = async (layoutId: LayoutId) => {
    if (layoutId === activeLayout) return;
    setSavingLayout(layoutId);
    try {
      await onUpdateOverrides({ ...(themeOverrides || {}), layoutId });
      setSavedMessage(`"${LAYOUTS.find((l) => l.id === layoutId)?.name}" düzeni uygulandı.`);
      setTimeout(() => setSavedMessage(null), 3000);
    } finally {
      setSavingLayout(null);
    }
  };
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
      await onUpdateOverrides({
        ...(themeOverrides || {}),
        primaryColor: colorHex,
        ctaColor: "custom",
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

  const sectorLabel = FILTER_TAGS.find((t) => t.id === business.sector)?.label ?? business.sector;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-ink-2">
            Düzen: <span className="font-medium text-ink">{LAYOUTS.find((l) => l.id === activeLayout)?.name}</span>
            <span className="text-ink-3">, </span>
            renk paleti: <span className="font-medium text-ink">{currentTheme.name}</span>
          </p>
          <p className="text-sm text-ink-3">
            Tema değiştirmek randevu, hizmet ve müşteri verilerinizi etkilemez.
          </p>
        </div>
        <Segmented
          aria-label="Tema görünümü"
          value={subTab}
          onChange={setSubTab}
          options={[
            { value: "catalog", label: "Düzen ve renkler", icon: Palette },
            { value: "customize", label: "Özelleştir ve sırala", icon: Sliders },
          ]}
        />
      </div>

      {savedMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-control border border-brand-line bg-brand-soft px-3 py-2 text-sm text-brand-ink"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {savedMessage}
        </div>
      )}

      {/* ────────────────── CATALOG VIEW ────────────────── */}
      {subTab === "catalog" && (
        <div className="space-y-8">
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Sayfa düzeni</h3>
              <p className="text-sm text-ink-3">
                Sayfanızın yapısı. Renk paletinden bağımsızdır; düzeni değiştirince renkleriniz korunur.
              </p>
            </div>
            <LayoutPicker
              activeLayout={activeLayout}
              accent={customPrimaryColor || currentTheme.colors.primary}
              savingId={savingLayout}
              onSelect={handleSelectLayout}
            />
          </section>

          {recommendedThemes.length > 0 && activeFilter === "ALL" && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-ink">{sectorLabel} için önerilen renk paletleri</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink">Renk paletleri ({allThemes.length})</h3>
            </div>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap">
              {FILTER_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={activeFilter === tag.id}
                  onClick={() => setActiveFilter(tag.id)}
                  className={choiceClasses(activeFilter === tag.id, "h-8 shrink-0 px-3 text-xs font-medium")}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          </section>
        </div>
      )}

      {/* ────────────────── CUSTOMIZE & REORDER VIEW ────────────────── */}
      {subTab === "customize" && (
        <div className="space-y-5">
          <Panel
            title="Vurgu rengi"
            description={`${currentTheme.name} temasının buton, rozet ve vurgu rengini kurumsal renginizle değiştirin.`}
            action={
              <Button
                size="sm"
                variant="ghost"
                title="İçerikler silinmez, yalnızca tema varsayılanına döner"
                onClick={async () => {
                  await onResetToDefault();
                  setSavedMessage("Tema ayarları ve renkler varsayılana döndürüldü.");
                  setTimeout(() => setSavedMessage(null), 3000);
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Varsayılana dön
              </Button>
            }
          >
            <div className="space-y-5">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-ink-2">Bu tema için önerilen renkler</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {currentTheme.suggestedAccents.map((acc) => {
                    const isSelected = (customPrimaryColor || currentTheme.colors.primary) === acc.hex;
                    return (
                      <button
                        key={acc.hex}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={isSavingCustomizer}
                        onClick={() => handleSaveAccent(acc.hex)}
                        className={choiceClasses(isSelected, "flex items-center gap-2.5 p-2.5 text-left")}
                      >
                        <span
                          className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                          style={{ backgroundColor: acc.hex }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-ink">{acc.name}</span>
                          <span className="block truncate text-xs text-ink-3">{acc.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <label htmlFor="accent-hex" className="text-sm font-medium text-ink-2">
                    Özel renk
                  </label>
                  <input
                    type="color"
                    aria-label="Renk seçici"
                    value={customPrimaryColor || currentTheme.colors.primary}
                    onChange={(e) => handleSaveAccent(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-control border border-line-strong bg-surface p-0.5"
                  />
                  <input
                    id="accent-hex"
                    type="text"
                    value={customPrimaryColor || currentTheme.colors.primary}
                    onChange={(e) => handleSaveAccent(e.target.value)}
                    className={inputClasses("w-28 font-mono")}
                    placeholder="#00C98D"
                  />
                </div>

                <p
                  className={cn(
                    "flex items-center gap-1.5 text-sm",
                    contrastResult.isSafe ? "text-brand-ink" : "text-pending"
                  )}
                >
                  {contrastResult.isSafe ? (
                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  {contrastResult.message}
                </p>
              </div>
            </div>
          </Panel>

          <Panel
            title="Bölümlerin görünürlüğü ve sırası"
            description="Sırayı değiştirin, istemediğiniz bölümleri gizleyin."
            flush
          >
            <ol className="divide-y divide-line">
              {sectionOrder.map((secId, idx) => {
                const sectionDef = AVAILABLE_SECTIONS.find((s) => s.id === secId) || {
                  id: secId,
                  name: secId,
                  isCritical: false,
                  desc: "Sayfa bölümü",
                };
                const isHidden = hiddenSections.includes(secId);

                return (
                  <li key={secId} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="w-5 shrink-0 text-right text-sm tabular-nums text-ink-3">{idx + 1}</span>
                    <div className={cn("min-w-0 flex-1", isHidden && "opacity-60")}>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-ink">{sectionDef.name}</span>
                        {sectionDef.isCritical && (
                          <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            Zorunlu
                          </span>
                        )}
                        {isHidden && <span className="text-xs text-ink-3">· Gizli</span>}
                      </div>
                      <p className="truncate text-sm text-ink-3">{sectionDef.desc}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 px-0"
                        onClick={() => handleMoveSection(idx, "up")}
                        disabled={idx === 0}
                        title="Yukarı taşı"
                        aria-label={`${sectionDef.name}: yukarı taşı`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 px-0"
                        onClick={() => handleMoveSection(idx, "down")}
                        disabled={idx === sectionOrder.length - 1}
                        title="Aşağı taşı"
                        aria-label={`${sectionDef.name}: aşağı taşı`}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      {sectionDef.isCritical ? (
                        <span
                          className="ml-1 inline-flex w-[4.5rem] items-center justify-center text-xs text-ink-3"
                          title="Bu bölüm kritik olduğu için gizlenemez."
                        >
                          Kilitli
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          className="ml-1 w-[4.5rem]"
                          onClick={() => handleToggleSectionVisibility(secId)}
                        >
                          {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {isHidden ? "Göster" : "Gizle"}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Panel>
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
