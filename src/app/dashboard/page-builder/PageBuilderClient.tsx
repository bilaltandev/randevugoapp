"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Palette,
  MoveUp,
  MoveDown,
  Trash2,
  Plus,
  Eye,
  Save,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Layers,
  Edit3,
  Image as ImageIcon,
  Camera,
  RotateCcw,
  Rocket,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { LogoUploader } from "@/components/LogoUploader";
import { ThemePickerTab } from "@/components/themes/ThemePickerTab";
import { ThemeLivePreviewModal } from "@/components/themes/ThemeLivePreviewModal";
import { GallerySettingsPanel } from "@/components/gallery/GallerySettingsPanel";
import { HeroSettingsPanel } from "@/components/hero/HeroSettingsPanel";
import { PageBuilderOverviewTab } from "@/components/page-builder/PageBuilderOverviewTab";
import { getThemeConfig } from "@/lib/themes/registry";
import { ThemeOverrides } from "@/lib/themes/types";
import { HeroActionItem, DEFAULT_HERO_ACTION_ITEMS } from "@/lib/hero/types";

interface PageBuilderClientProps {
  business: any;
  initialBlocks: any[];
  initialTheme: string;
  initialFont: string;
  initialThemeId?: string;
  initialThemeOverrides?: ThemeOverrides | null;
  initialSectionOrder?: string[];
  initialHiddenSections?: string[];
  initialGallery?: any;
  initialGalleryItems?: any[];
  workingHours?: any[];
  appointments?: any[];
}

const AVAILABLE_BLOCKS = [
  { type: "Hero", name: "Kapak / Hero", desc: "Büyük karşılama başlığı ve randevu butonu" },
  { type: "About", name: "Hakkımızda", desc: "İşletme hikayesi, görsel ve istatistikler" },
  { type: "Services", name: "Hizmetlerimiz", desc: "Tüm hizmetlerin fiyat ve süre listesi" },
  { type: "Staff", name: "Uzmanlarımız", desc: "Ekip üyeleri ve uzmanlık alanları" },
  { type: "Gallery", name: "Fotoğraf Galerisi", desc: "İşletmeden kareler ve çalışmalar" },
  { type: "Booking", name: "Rezervasyon Motoru", desc: "Müşterinin gün ve saat seçtiği sihirbaz" },
  { type: "Reviews", name: "Müşteri Yorumları", desc: "Doğrulanmış randevu değerlendirmeleri" },
  { type: "Location", name: "Konum & İletişim", desc: "Adres, telefon ve WhatsApp bilgisi" },
];

export default function PageBuilderClient({
  business,
  initialBlocks,
  initialTheme,
  initialFont,
  initialThemeId = "premium-dark",
  initialThemeOverrides = null,
  initialSectionOrder = ["Hero", "Services", "Staff", "Gallery", "Reviews", "Booking", "Location"],
  initialHiddenSections = [],
  initialGallery = null,
  initialGalleryItems = [],
  workingHours = [],
  appointments = [],
}: PageBuilderClientProps) {
  const [activeMainTab, setActiveMainTab] = useState<"overview" | "hero" | "themes" | "gallery" | "blocks">("overview");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "gallery") {
        setActiveMainTab("gallery");
      } else if (params.get("tab") === "hero") {
        setActiveMainTab("hero");
      } else if (params.get("tab") === "themes") {
        setActiveMainTab("themes");
      } else if (params.get("tab") === "blocks") {
        setActiveMainTab("blocks");
      }
    }
  }, []);
  const [businessState, setBusinessState] = useState(business);
  const [logo, setLogo] = useState(business.logo || null);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [themeColor, setThemeColor] = useState(initialTheme);
  const [activeThemeId, setActiveThemeId] = useState(initialThemeId);
  const [themeOverrides, setThemeOverrides] = useState<ThemeOverrides | null>(initialThemeOverrides);
  const [sectionOrder, setSectionOrder] = useState<string[]>(initialSectionOrder);
  const [hiddenSections, setHiddenSections] = useState<string[]>(initialHiddenSections);

  // Hero Actions state
  const [heroActions, setHeroActions] = useState<HeroActionItem[]>(
    initialThemeOverrides?.heroActions || DEFAULT_HERO_ACTION_ITEMS
  );
  const [instagramUsername, setInstagramUsername] = useState<string>(
    initialThemeOverrides?.instagramUsername || ""
  );
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>(
    initialThemeOverrides?.googleMapsUrl || ""
  );

  const handleUpdateHeroActions = (newActions: HeroActionItem[]) => {
    setHeroActions(newActions);
    const updated = {
      ...(themeOverrides || {}),
      heroActions: newActions,
      instagramUsername,
      googleMapsUrl,
    };
    setThemeOverrides(updated);
  };

  const handleUpdateInstagram = (username: string) => {
    setInstagramUsername(username);
    const updated = {
      ...(themeOverrides || {}),
      heroActions,
      instagramUsername: username,
      googleMapsUrl,
    };
    setThemeOverrides(updated);
  };

  const handleUpdateGoogleMaps = (url: string) => {
    setGoogleMapsUrl(url);
    const updated = {
      ...(themeOverrides || {}),
      heroActions,
      instagramUsername,
      googleMapsUrl: url,
    };
    setThemeOverrides(updated);
  };

  // Gallery state
  const [gallery, setGallery] = useState<any>(
    initialGallery || {
      enabled: true,
      showTitle: true,
      title: "Galerimiz & Çalışmalarımız",
      subtitle: "Özenle hazırladığımız hizmet ve çalışmalarımızdan öne çıkan kareler.",
      layout: "INFINITE_FLOW",
      direction: "right-to-left",
      speed: "NORMAL",
      pauseOnHover: true,
      imageSize: "MEDIUM",
      aspectRatio: "4:5",
      borderRadius: "rounded",
      scrollAnimation: "Fade Up",
      parallaxEnabled: false,
      scrollReactive: false,
      scrollDirectionTracking: false,
      clickAction: "LIGHTBOX",
    }
  );
  const [galleryItems, setGalleryItems] = useState<any[]>(initialGalleryItems || []);

  const [selectedBlockForEdit, setSelectedBlockForEdit] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeThemeConfig = getThemeConfig(activeThemeId);

  // Apply Theme Handler
  const handleApplyTheme = async (themeId: string) => {
    setActiveThemeId(themeId);
    try {
      await fetch("/api/page-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Update Theme Overrides (e.g. custom primary color)
  const handleUpdateOverrides = async (newOverrides: ThemeOverrides | null) => {
    setThemeOverrides(newOverrides);
    try {
      await fetch("/api/page-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeOverrides: newOverrides }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Update Section Order & Hidden Sections
  const handleUpdateSections = async (newOrder: string[], newHidden: string[]) => {
    setSectionOrder(newOrder);
    setHiddenSections(newHidden);
    try {
      await fetch("/api/page-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionOrder: newOrder,
          hiddenSections: newHidden,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Reset Theme to Default
  const handleResetToDefault = async () => {
    setThemeOverrides(null);
    setSectionOrder(["Hero", "Services", "Staff", "Reviews", "Booking", "Location"]);
    setHiddenSections([]);
    try {
      await fetch("/api/page-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetOverrides: true,
          sectionOrder: ["Hero", "Services", "Staff", "Reviews", "Booking", "Location"],
          hiddenSections: [],
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Move Block Up
  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...blocks];
    const temp = newArr[index];
    newArr[index] = newArr[index - 1];
    newArr[index - 1] = temp;
    setBlocks(newArr);
  };

  // Move Block Down
  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const newArr = [...blocks];
    const temp = newArr[index];
    newArr[index] = newArr[index + 1];
    newArr[index + 1] = temp;
    setBlocks(newArr);
  };

  // Delete Block
  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  // Add Block
  const addBlock = (type: string) => {
    const newId = `${type.toLowerCase()}-${Date.now()}`;
    const newBlock = {
      id: newId,
      type,
      title: `${type} Bölümü`,
      subtitle: "Bölüm açıklaması buraya gelecek.",
    };
    setBlocks((prev) => [...prev, newBlock]);
    setIsAddModalOpen(false);
  };

  // Save gallery explicitly
  const handleSaveGallery = async (galleryToSave?: any) => {
    setIsSaving(true);
    try {
      const data = galleryToSave || gallery;
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Save changes to DB
  const handleSavePage = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      const pagePromise = fetch("/api/page-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocksJson: blocks,
          themeColor,
          font: initialFont,
          themeId: activeThemeId,
          themeOverrides: {
            ...(themeOverrides || {}),
            heroActions,
            instagramUsername,
            googleMapsUrl,
          },
          sectionOrder,
          hiddenSections,
        }),
      });

      const galleryPromise = gallery
        ? fetch("/api/gallery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(gallery),
          })
        : Promise.resolve();

      const [res] = await Promise.all([pagePromise, galleryPromise]);
      if (res && res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6246EA] text-white shadow-lg shadow-[#6246EA]/25 shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-white">
              Sayfa & Tema Düzenleyici
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 mt-0.5">
              Online rezervasyon sayfanızın görünümünü ve davranışını kolayca özelleştirin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#0E1528] px-4 py-2.5 text-xs font-semibold text-[#344054] dark:text-slate-200 hover:bg-[#F8F9FC] transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4 text-[#6246EA]" />
            <span>Canlı Önizleme</span>
          </button>

          <button
            onClick={handleSavePage}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6246EA] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#6246EA]/30 hover:bg-[#5136D6] disabled:opacity-50 transition-all active:scale-95"
          >
            <Rocket className="w-4 h-4" />
            <span>{isSaving ? "Kaydediliyor..." : savedSuccess ? "Yayınlandı! ✓" : "Değişiklikleri Yayınla"}</span>
          </button>

          <Link
            href={`/${business.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E7EC] dark:border-[#263152] bg-white dark:bg-[#0E1528] px-3.5 py-2.5 text-xs font-medium text-[#667085] dark:text-slate-400 hover:text-[#111827] hover:border-slate-300 transition-colors"
            title="Canlı Sayfayı Aç"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Sayfa ve tema ayarları kaydedildi ve canlı randevu sayfanıza anında uygulandı!</span>
        </div>
      )}

      {/* Main Tabs (Overview vs Hero Actions vs Hazır Temalar vs Galeri vs Manuel Bloklar) */}
      <div className="flex items-center gap-1.5 border-b border-[#E4E7EC] dark:border-slate-800 pb-3 flex-wrap">
        <button
          onClick={() => setActiveMainTab("overview")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === "overview"
              ? "bg-[#6246EA] text-white shadow-md shadow-[#6246EA]/25"
              : "text-[#667085] dark:text-slate-400 hover:text-[#111827] hover:bg-white dark:hover:bg-[#0E1528]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ana Düzenleyici</span>
        </button>

        <button
          onClick={() => setActiveMainTab("hero")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === "hero"
              ? "bg-[#6246EA] text-white shadow-md shadow-[#6246EA]/25"
              : "text-[#667085] dark:text-slate-400 hover:text-[#111827] hover:bg-white dark:hover:bg-[#0E1528]"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Hero Aksiyon Butonları ({heroActions.filter((i) => i.enabled).length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab("themes")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === "themes"
              ? "bg-[#6246EA] text-white shadow-md shadow-[#6246EA]/25"
              : "text-[#667085] dark:text-slate-400 hover:text-[#111827] hover:bg-white dark:hover:bg-[#0E1528]"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Hazır Temalar (8)</span>
        </button>

        <button
          onClick={() => setActiveMainTab("gallery")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === "gallery"
              ? "bg-[#6246EA] text-white shadow-md shadow-[#6246EA]/25"
              : "text-[#667085] dark:text-slate-400 hover:text-[#111827] hover:bg-white dark:hover:bg-[#0E1528]"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Fotoğraf Galerisi Yükle ({galleryItems.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab("blocks")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === "blocks"
              ? "bg-[#6246EA] text-white shadow-md shadow-[#6246EA]/25"
              : "text-[#667085] dark:text-slate-400 hover:text-[#111827] hover:bg-white dark:hover:bg-[#0E1528]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Bölüm Sıralaması & Bloklar</span>
        </button>
      </div>

      {/* ────────────────── OVERVIEW TAB (DEFAULT MATCHING SCREENSHOT) ────────────────── */}
      {activeMainTab === "overview" && (
        <PageBuilderOverviewTab
          business={businessState}
          themeOverrides={themeOverrides}
          onUpdateOverrides={(newOverrides) => {
            setThemeOverrides(newOverrides);
          }}
          gallery={gallery}
          onUpdateGallery={(newGallery) => {
            setGallery(newGallery);
          }}
          onSave={handleSavePage}
          isSaving={isSaving}
          savedSuccess={savedSuccess}
          onOpenLivePreviewModal={() => setIsPreviewOpen(true)}
        />
      )}

      {/* ────────────────── THEMES TAB ────────────────── */}
      {activeMainTab === "themes" && (
        <ThemePickerTab
          business={businessState}
          services={businessState.services || []}
          employees={businessState.employees || []}
          reviews={businessState.reviews || []}
          workingHours={workingHours.length > 0 ? workingHours : businessState.workingHours || []}
          appointments={appointments.length > 0 ? appointments : businessState.appointments || []}
          gallery={gallery}
          galleryItems={galleryItems}
          activeThemeId={activeThemeId}
          themeOverrides={{
            ...(themeOverrides || {}),
            heroActions,
            instagramUsername,
            googleMapsUrl,
          }}
          sectionOrder={sectionOrder}
          hiddenSections={hiddenSections}
          onApplyTheme={handleApplyTheme}
          onUpdateOverrides={handleUpdateOverrides}
          onUpdateSections={handleUpdateSections}
          onResetToDefault={handleResetToDefault}
        />
      )}

      {/* ────────────────── HERO ACTIONS TAB ────────────────── */}
      {activeMainTab === "hero" && (
        <HeroSettingsPanel
          business={businessState}
          services={businessState.services || []}
          employees={businessState.employees || []}
          workingHours={workingHours.length > 0 ? workingHours : businessState.workingHours || []}
          appointments={appointments.length > 0 ? appointments : businessState.appointments || []}
          heroActions={heroActions}
          instagramUsername={instagramUsername}
          googleMapsUrl={googleMapsUrl}
          onChangeHeroActions={handleUpdateHeroActions}
          onChangeInstagram={handleUpdateInstagram}
          onChangeGoogleMapsUrl={handleUpdateGoogleMaps}
          onSave={handleSavePage}
          isSaving={isSaving}
          savedSuccess={savedSuccess}
        />
      )}

      {/* ────────────────── GALLERY TAB ────────────────── */}
      {activeMainTab === "gallery" && (
        <GallerySettingsPanel
          business={businessState}
          gallery={gallery}
          items={galleryItems}
          onGalleryChange={(newG) => setGallery(newG)}
          onItemsChange={(newI) => setGalleryItems(newI)}
          onSave={handleSaveGallery}
          isSaving={isSaving}
          savedSuccess={savedSuccess}
        />
      )}

      {/* ────────────────── BLOCKS TAB (MANUAL CUSTOMIZATION) ────────────────── */}
      {activeMainTab === "blocks" && (
        <div className="space-y-6">
          {/* Brand Identity & Logo Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  İşletme Logosu
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Web sitenizin üst gezinme çubuğunda (header), kapak bölümünde ve altbilgide gösterilir.
              </p>
              <LogoUploader
                currentLogo={logo}
                businessName={businessState.name}
                onLogoChange={(newUrl) => {
                  setLogo(newUrl);
                  setBusinessState((prev: any) => ({ ...prev, logo: newUrl }));
                }}
              />
            </div>
          </div>

          {/* Blocks Reordering and Customizer List */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Sayfa Blokları Başlık ve Metinleri</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Blok Ekle</span>
              </button>
            </div>

            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-colors hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">
                          {block.title || block.type}
                        </span>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 uppercase font-mono">
                          {block.type}
                        </span>
                      </div>
                      {block.subtitle && (
                        <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                          {block.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => moveBlockUp(idx)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                      title="Yukarı Taşı"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveBlockDown(idx)}
                      disabled={idx === blocks.length - 1}
                      className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                      title="Aşağı Taşı"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedBlockForEdit(block)}
                      className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                      title="Düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Block */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Sayfaya Yeni Blok Ekle"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_BLOCKS.map((ab) => (
            <button
              key={ab.type}
              onClick={() => addBlock(ab.type)}
              className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 text-left hover:border-indigo-500 hover:bg-indigo-950/20 transition-all"
            >
              <h4 className="font-semibold text-slate-100 text-sm mb-1">{ab.name}</h4>
              <p className="text-[11px] text-slate-400">{ab.desc}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* MODAL: Edit Block Details */}
      {selectedBlockForEdit && (
        <Modal
          isOpen={!!selectedBlockForEdit}
          onClose={() => setSelectedBlockForEdit(null)}
          title={`${selectedBlockForEdit.type} Bloğunu Düzenle`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Başlık</label>
              <input
                type="text"
                value={selectedBlockForEdit.title || ""}
                onChange={(e) =>
                  setSelectedBlockForEdit({
                    ...selectedBlockForEdit,
                    title: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Alt Açıklama</label>
              <textarea
                rows={3}
                value={selectedBlockForEdit.subtitle || selectedBlockForEdit.content || ""}
                onChange={(e) =>
                  setSelectedBlockForEdit({
                    ...selectedBlockForEdit,
                    subtitle: e.target.value,
                    content: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {selectedBlockForEdit.type === "Hero" && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Rozet Metni (Örn: Beşiktaş'ın Öncü Kuaförü)
                </label>
                <input
                  type="text"
                  value={selectedBlockForEdit.badge || ""}
                  onChange={(e) =>
                    setSelectedBlockForEdit({
                      ...selectedBlockForEdit,
                      badge: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={() => {
                setBlocks((prev) =>
                  prev.map((b) =>
                    b.id === selectedBlockForEdit.id ? selectedBlockForEdit : b
                  )
                );
                setSelectedBlockForEdit(null);
              }}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Bloğu Güncelle
            </button>
          </div>
        </Modal>
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      <ThemeLivePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        theme={activeThemeConfig}
        overrides={{
          ...(themeOverrides || {}),
          heroActions,
          instagramUsername,
          googleMapsUrl,
        }}
        sectionOrder={sectionOrder}
        hiddenSections={hiddenSections}
        business={businessState}
        services={businessState.services || []}
        employees={businessState.employees || []}
        reviews={businessState.reviews || []}
        gallery={gallery}
        galleryItems={galleryItems}
        workingHours={workingHours.length > 0 ? workingHours : businessState.workingHours || []}
        appointments={appointments.length > 0 ? appointments : businessState.appointments || []}
        onApply={async (t) => {
          await handleApplyTheme(t.id);
          setIsPreviewOpen(false);
        }}
        isActiveTheme={true}
      />
    </div>
  );
}
