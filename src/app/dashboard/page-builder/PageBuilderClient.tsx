"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Palette,
  MoveUp,
  MoveDown,
  Trash2,
  Plus,
  Eye,
  Check,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Layers,
  Edit3,
  Image as ImageIcon,
  Camera,
  Rocket,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Field, Input, Textarea } from "@/components/ui/Field";
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
  type MainTab = "overview" | "hero" | "themes" | "gallery" | "blocks";
  const tabFromParam = (value: string | null): MainTab | null =>
    value === "gallery" || value === "hero" || value === "themes" || value === "blocks" ? value : null;

  // ?tab=… (e.g. the sidebar's "Galeri" shortcut) selects a tab, also when already on this page.
  const tabParam = useSearchParams().get("tab");
  const [activeMainTab, setActiveMainTab] = useState<MainTab>(() => tabFromParam(tabParam) ?? "overview");
  const [lastTabParam, setLastTabParam] = useState(tabParam);
  if (tabParam !== lastTabParam) {
    setLastTabParam(tabParam);
    const next = tabFromParam(tabParam);
    if (next) setActiveMainTab(next);
  }
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
    // A new theme brings its own accent: drop the previous custom button color.
    const nextOverrides: ThemeOverrides = { ...(themeOverrides || {}), ctaColor: "theme" };
    delete nextOverrides.primaryColor;
    setThemeOverrides(nextOverrides);
    try {
      await fetch("/api/page-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId,
          themeOverrides: { ...nextOverrides, heroActions, instagramUsername, googleMapsUrl },
        }),
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
    <div className="space-y-5">
      <PageHeader
        title="Sayfa Düzenleyici"
        description="Online rezervasyon sayfanızın görünümünü ve içeriğini özelleştirin."
        actions={
          <>
            <a
              href={`/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("ghost", "md", "w-9 px-0")}
              title="Canlı sayfayı yeni sekmede aç"
              aria-label="Canlı sayfayı yeni sekmede aç"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <Button onClick={() => setIsPreviewOpen(true)}>
              <Eye className="w-4 h-4" aria-hidden="true" />
              Önizle
            </Button>
            <Button variant="primary" onClick={handleSavePage} disabled={isSaving}>
              {savedSuccess ? <Check className="w-4 h-4" aria-hidden="true" /> : <Rocket className="w-4 h-4" aria-hidden="true" />}
              {isSaving ? "Kaydediliyor..." : savedSuccess ? "Yayınlandı" : "Yayınla"}
            </Button>
          </>
        }
      />

      {savedSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-control border border-brand-line bg-brand-soft px-3 py-2 text-sm text-brand-ink"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Değişiklikler kaydedildi ve rezervasyon sayfanıza uygulandı.
        </div>
      )}

      <Segmented
        aria-label="Düzenleyici bölümleri"
        value={activeMainTab}
        onChange={setActiveMainTab}
        options={[
          { value: "overview", label: "Genel", icon: Sparkles },
          { value: "hero", label: "Hero butonları", icon: ImageIcon, count: heroActions.filter((i) => i.enabled).length },
          { value: "themes", label: "Temalar", icon: Palette },
          { value: "gallery", label: "Galeri", icon: Camera, count: galleryItems.length },
          { value: "blocks", label: "Bölümler", icon: Layers },
        ]}
      />

      {/* ────────────────── OVERVIEW TAB ────────────────── */}
      {activeMainTab === "overview" && (
        <PageBuilderOverviewTab
          business={businessState}
          themeOverrides={themeOverrides}
          onUpdateOverrides={(newOverrides) => {
            setThemeOverrides(newOverrides);
          }}
          gallery={gallery}
          galleryItems={galleryItems}
          onUpdateGallery={(newGallery) => {
            setGallery(newGallery);
          }}
          onSave={handleSavePage}
          isSaving={isSaving}
          savedSuccess={savedSuccess}
          onOpenLivePreviewModal={() => setIsPreviewOpen(true)}
          themePrimaryColor={activeThemeConfig.colors.primary}
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
        <div className="space-y-5">
          <Panel
            title="İşletme logosu"
            description="Sayfanızın üst menüsünde, kapak bölümünde ve altbilgide gösterilir."
          >
            <LogoUploader
              currentLogo={logo}
              businessName={businessState.name}
              onLogoChange={(newUrl) => {
                setLogo(newUrl);
                setBusinessState((prev: any) => ({ ...prev, logo: newUrl }));
              }}
            />
          </Panel>

          <Panel
            title="Sayfa bölümleri"
            description="Bölüm başlıklarını, metinlerini ve sırasını düzenleyin."
            action={
              <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Bölüm ekle
              </Button>
            }
            flush
          >
            <ol className="divide-y divide-line">
              {blocks.map((block, idx) => (
                <li key={block.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="w-5 shrink-0 text-right text-sm tabular-nums text-ink-3">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">{block.title || block.type}</span>
                      <span className="rounded-control bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-ink-3">
                        {block.type}
                      </span>
                    </div>
                    {block.subtitle && <p className="mt-0.5 truncate text-sm text-ink-3">{block.subtitle}</p>}
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 px-0"
                      onClick={() => moveBlockUp(idx)}
                      disabled={idx === 0}
                      title="Yukarı taşı"
                      aria-label="Yukarı taşı"
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 px-0"
                      onClick={() => moveBlockDown(idx)}
                      disabled={idx === blocks.length - 1}
                      title="Aşağı taşı"
                      aria-label="Aşağı taşı"
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 px-0"
                      onClick={() => setSelectedBlockForEdit(block)}
                      title="Düzenle"
                      aria-label="Düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 px-0 hover:text-danger"
                      onClick={() => deleteBlock(block.id)}
                      title="Sil"
                      aria-label="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      )}

      {/* MODAL: Add New Block */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Bölüm ekle">
        <ul className="divide-y divide-line rounded-control border border-line">
          {AVAILABLE_BLOCKS.map((ab) => (
            <li key={ab.type}>
              <button
                type="button"
                onClick={() => addBlock(ab.type)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted"
              >
                <span>
                  <span className="block text-sm font-medium text-ink">{ab.name}</span>
                  <span className="block text-sm text-ink-3">{ab.desc}</span>
                </span>
                <Plus className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      {/* MODAL: Edit Block Details */}
      {selectedBlockForEdit && (
        <Modal
          isOpen={!!selectedBlockForEdit}
          onClose={() => setSelectedBlockForEdit(null)}
          title={`${selectedBlockForEdit.type} bölümünü düzenle`}
        >
          <div className="space-y-4">
            <Field label="Başlık" htmlFor="block-title">
              <Input
                id="block-title"
                type="text"
                value={selectedBlockForEdit.title || ""}
                onChange={(e) =>
                  setSelectedBlockForEdit({
                    ...selectedBlockForEdit,
                    title: e.target.value,
                  })
                }
              />
            </Field>

            <Field label="Alt açıklama" htmlFor="block-subtitle">
              <Textarea
                id="block-subtitle"
                rows={3}
                value={selectedBlockForEdit.subtitle || selectedBlockForEdit.content || ""}
                onChange={(e) =>
                  setSelectedBlockForEdit({
                    ...selectedBlockForEdit,
                    subtitle: e.target.value,
                    content: e.target.value,
                  })
                }
              />
            </Field>

            {selectedBlockForEdit.type === "Hero" && (
              <Field label="Rozet metni" htmlFor="block-badge" hint="Örn: Beşiktaş'ın Öncü Kuaförü">
                <Input
                  id="block-badge"
                  type="text"
                  value={selectedBlockForEdit.badge || ""}
                  onChange={(e) =>
                    setSelectedBlockForEdit({
                      ...selectedBlockForEdit,
                      badge: e.target.value,
                    })
                  }
                />
              </Field>
            )}

            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                setBlocks((prev) =>
                  prev.map((b) => (b.id === selectedBlockForEdit.id ? selectedBlockForEdit : b))
                );
                setSelectedBlockForEdit(null);
              }}
            >
              Bölümü güncelle
            </Button>
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
