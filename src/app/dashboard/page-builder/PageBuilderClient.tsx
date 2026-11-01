"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Palette,
  Eye,
  Check,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Camera,
  Rocket,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { LogoUploader } from "@/components/LogoUploader";
import { ThemePickerTab } from "@/components/themes/ThemePickerTab";
import { ThemeLivePreviewModal } from "@/components/themes/ThemeLivePreviewModal";
import { GallerySettingsPanel } from "@/components/gallery/GallerySettingsPanel";
import { HeroSettingsPanel } from "@/components/hero/HeroSettingsPanel";
import { PageBuilderOverviewTab } from "@/components/page-builder/PageBuilderOverviewTab";
import { LogoStyleEditor, PageTextsPanel, SectionOrderPanel } from "@/components/page-builder/PageContentEditor";
import { getThemeConfig } from "@/lib/themes/registry";
import { ThemeOverrides } from "@/lib/themes/types";
import { HeroActionItem, DEFAULT_HERO_ACTION_ITEMS } from "@/lib/hero/types";

interface PageBuilderClientProps {
  business: any;
  initialBlocks: any[];
  initialTheme: string;
  initialFont: string;
  initialThemeId?: string;
  /** Whether this business's plan includes the premium themes. */
  premiumUnlocked?: boolean;
  initialThemeOverrides?: ThemeOverrides | null;
  initialSectionOrder?: string[];
  initialHiddenSections?: string[];
  initialGallery?: any;
  initialGalleryItems?: any[];
  workingHours?: any[];
  appointments?: any[];
}

export default function PageBuilderClient({
  business,
  initialBlocks,
  initialTheme,
  initialFont,
  initialThemeId = "premium-dark",
  premiumUnlocked = false,
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
  const [blocks] = useState(initialBlocks);
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

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeThemeConfig = getThemeConfig(activeThemeId);

  // Apply Theme Handler
  const handleApplyTheme = async (themeId: string) => {
    const previousThemeId = activeThemeId;
    setActiveThemeId(themeId);
    // A new theme brings its own accent: drop the previous custom button color.
    const nextOverrides: ThemeOverrides = { ...(themeOverrides || {}), ctaColor: "theme" };
    delete nextOverrides.primaryColor;
    setThemeOverrides(nextOverrides);
    try {
      const res = await fetch("/api/page-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId,
          themeOverrides: { ...nextOverrides, heroActions, instagramUsername, googleMapsUrl },
        }),
      });
      if (!res.ok) {
        setActiveThemeId(previousThemeId);
        return;
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Hero actions and contact links live in their own state; every save has to carry them.
  const mergedOverrides: ThemeOverrides = { ...(themeOverrides || {}), heroActions, instagramUsername, googleMapsUrl };

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
        accent="violet"
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
          { value: "blocks", label: "Logo ve bölümler", icon: Layers },
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
          premiumUnlocked={premiumUnlocked}
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
          onBusinessChange={setBusinessState}
          onOpenGallery={() => setActiveMainTab("gallery")}
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
            <LogoStyleEditor
              logo={logo}
              businessName={businessState.name}
              theme={activeThemeConfig}
              themeOverrides={mergedOverrides}
              onUpdateOverrides={handleUpdateOverrides}
            />
          </Panel>

          <PageTextsPanel themeOverrides={mergedOverrides} sectorLine={[businessState.sector, businessState.city].filter(Boolean).join(", ")} onUpdateOverrides={handleUpdateOverrides} />

          <SectionOrderPanel
            sectionOrder={sectionOrder}
            hiddenSections={hiddenSections}
            themeOverrides={mergedOverrides}
            onUpdateSections={handleUpdateSections}
            onUpdateOverrides={handleUpdateOverrides}
          />
        </div>
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
