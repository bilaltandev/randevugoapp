"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Palette,
  ExternalLink,
  RotateCcw,
  Upload,
  ArrowLeft,
  ArrowRight,
  Scissors,
  ShieldCheck,
  Users2,
  Star,
} from "lucide-react";
import { ThemeOverrides } from "@/lib/themes/types";
import { getContrastRatio, getCustomAccent } from "@/lib/themes/utils";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui/Panel";
import { buttonClasses } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { choiceClasses } from "@/components/ui/choice";
import { CoverImagePicker, SAMPLE_COVERS } from "./CoverImagePicker";

interface PageBuilderOverviewTabProps {
  business: any;
  themeOverrides: ThemeOverrides | null;
  onUpdateOverrides: (overrides: ThemeOverrides) => void;
  gallery: any;
  /** Gallery photos the owner can reuse as the hero background. */
  galleryItems: { id: string; imageUrl: string; title?: string | null }[];
  onUpdateGallery: (galleryConfig: any) => void;
  onSave: () => void;
  isSaving: boolean;
  savedSuccess: boolean;
  onOpenLivePreviewModal: () => void;
  /** Accent of the active theme; the booking button uses it unless a custom color is set. */
  themePrimaryColor: string;
}

export function PageBuilderOverviewTab({
  business,
  themeOverrides,
  onUpdateOverrides,
  gallery,
  galleryItems,
  onUpdateGallery,
  onOpenLivePreviewModal,
  themePrimaryColor,
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
  const [bgType, setBgType] = useState<"image" | "color">(
    themeOverrides?.heroBgType === "color" ? "color" : "image"
  );
  const [coverImage, setCoverImage] = useState(
    themeOverrides?.coverImage || business.coverImage || SAMPLE_COVERS[0]
  );
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [showLogo, setShowLogo] = useState(themeOverrides?.showLogo !== false);
  const [showSlogan, setShowSlogan] = useState(themeOverrides?.showSlogan !== false);
  const [sloganText, setSloganText] = useState(
    themeOverrides?.sloganText ||
      (business.sector === "BERBER" ? "Erkek Kuaförü & Berber" : business.sector || "Özel Hizmet")
  );
  const [ctaText, setCtaText] = useState(
    themeOverrides?.customCtaText || "Hemen Randevu Al"
  );
  // Button color: the theme's accent unless the owner picked a custom one.
  const customAccent = getCustomAccent(themeOverrides);
  const ctaMode: "theme" | "custom" = customAccent ? "custom" : "theme";
  const ctaPreviewColor = customAccent || themePrimaryColor;
  const ctaPreviewText =
    getContrastRatio("#FFFFFF", ctaPreviewColor) >= getContrastRatio("#0F172A", ctaPreviewColor) ? "#FFFFFF" : "#0F172A";

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

  // Picking a photo also switches the backdrop to "Görsel" so the choice shows up.
  const handleSelectCover = (url: string) => {
    setCoverImage(url);
    setBgType("image");
    syncOverrides({ coverImage: url, heroBgType: "image" });
  };

  const counter = (value: string, max: number) => (
    <span className="tabular-nums">
      {value.length}/{max}
    </span>
  );

  // Mini wireframes for the four gallery layouts.
  const block = "rounded-[3px] bg-line-strong";
  const LAYOUTS: { id: string; name: string; desc: string; thumb: React.ReactNode }[] = [
    {
      id: "INFINITE_FLOW",
      name: "Infinite Flow",
      desc: "Kesintisiz kayan sonsuz şerit",
      thumb: (
        <div className="flex h-full gap-1">
          <div className={cn(block, "flex-1")} />
          <div className={cn(block, "flex-1 opacity-70")} />
          <div className={cn(block, "flex-1")} />
        </div>
      ),
    },
    {
      id: "DUAL_FLOW",
      name: "Dual Flow",
      desc: "Zıt yönlere akan çift şerit",
      thumb: (
        <div className="flex h-full flex-col gap-1">
          <div className="flex flex-1 gap-1">
            <div className={cn(block, "flex-1")} />
            <div className={cn(block, "flex-1 opacity-70")} />
          </div>
          <div className="flex flex-1 gap-1">
            <div className={cn(block, "flex-1 opacity-70")} />
            <div className={cn(block, "flex-1")} />
          </div>
        </div>
      ),
    },
    {
      id: "CINEMATIC_STRIP",
      name: "Cinematic Strip",
      desc: "Geniş sinematik kartlar",
      thumb: <div className={cn(block, "h-full w-full")} />,
    },
    {
      id: "CARDS",
      name: "Cards",
      desc: "Kart yapısında yatay carousel",
      thumb: (
        <div className="flex h-full gap-1">
          <div className={cn(block, "flex-1")} />
          <div className={cn(block, "flex-1 opacity-70")} />
        </div>
      ),
    },
  ];

  const setCtaMode = (mode: "theme" | "custom") => {
    if (mode === "theme") {
      // Dropping primaryColor lets the theme's accent show again.
      const next: ThemeOverrides = { ...(themeOverrides || {}), ctaColor: "theme" };
      delete next.primaryColor;
      onUpdateOverrides(next);
    } else {
      syncOverrides({ ctaColor: "custom", primaryColor: ctaPreviewColor });
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
      {/* ────────────────── LEFT COLUMN (HERO & GALLERY LAYOUT) ────────────────── */}
      <div className="space-y-5 lg:col-span-7">
        <Panel title="Hero alanı" description="Sayfanızın en üstünde görünen karşılama bölümü.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Title, description, background */}
            <div className="space-y-4">
              <Field label="Başlık" htmlFor="hero-title" hint={counter(heroTitle, 60)}>
                <Input
                  id="hero-title"
                  type="text"
                  maxLength={60}
                  value={heroTitle}
                  onChange={(e) => {
                    setHeroTitle(e.target.value);
                    syncOverrides({ customTitle: e.target.value });
                  }}
                  placeholder="İşletme adınız"
                />
              </Field>

              <Field label="Açıklama" htmlFor="hero-desc" hint={counter(heroDesc, 160)}>
                <Textarea
                  id="hero-desc"
                  rows={3}
                  maxLength={160}
                  value={heroDesc}
                  onChange={(e) => {
                    setHeroDesc(e.target.value);
                    syncOverrides({ customSubtitle: e.target.value });
                  }}
                  className="resize-none"
                  placeholder="İşletmenizi tanıtan kısa bir karşılama metni..."
                />
              </Field>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-ink-2">Arka plan türü</p>
                <Segmented
                  fill
                  aria-label="Arka plan türü"
                  value={bgType}
                  onChange={(v) => {
                    setBgType(v);
                    syncOverrides({ heroBgType: v });
                  }}
                  options={[
                    { value: "image", label: "Görsel", icon: ImageIcon },
                    { value: "color", label: "Tema rengi", icon: Palette },
                  ]}
                />

                {bgType === "color" ? (
                  <div
                    className="mt-2 flex h-28 items-center justify-center rounded-control border border-line px-3 text-center text-xs font-medium text-white"
                    style={{ backgroundColor: ctaPreviewColor }}
                  >
                    <span className="rounded-control bg-black/35 px-2.5 py-1.5">
                      Üst alan, buton rengiyle boyanır
                    </span>
                  </div>
                ) : (
                  <div className="relative mt-2 h-28 overflow-hidden rounded-control border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImage} alt="Hero arka planı" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 p-2">
                      <button
                        type="button"
                        onClick={() => setIsCoverPickerOpen(true)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-control bg-black/70 px-3 text-xs font-medium text-white transition-colors hover:bg-black/85"
                      >
                        <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        Görseli değiştir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectCover(SAMPLE_COVERS[0])}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-control bg-black/70 text-white transition-colors hover:bg-black/85"
                        title="Varsayılana döndür"
                        aria-label="Görseli varsayılana döndür"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <CoverImagePicker
                  isOpen={isCoverPickerOpen}
                  onClose={() => setIsCoverPickerOpen(false)}
                  current={coverImage}
                  galleryItems={galleryItems}
                  onSelect={handleSelectCover}
                />
              </div>
            </div>

            {/* Logo, slogan, CTA */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span id="hero-show-logo" className="text-sm font-medium text-ink-2">
                    Logo göster
                  </span>
                  <Switch
                    checked={showLogo}
                    aria-labelledby="hero-show-logo"
                    onChange={(next) => {
                      setShowLogo(next);
                      syncOverrides({ showLogo: next });
                    }}
                  />
                </div>
                <div className="flex items-center gap-3 rounded-control border border-line bg-surface-muted p-2.5">
                  <Avatar name={business.name} src={business.logo} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href="/dashboard/page-builder?tab=blocks"
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      Logoyu değiştir
                    </Link>
                    <p className="text-xs text-ink-3">PNG, JPG, WebP veya SVG</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="hero-slogan" className="text-sm font-medium text-ink-2">
                    Slogan göster
                  </label>
                  <Switch
                    checked={showSlogan}
                    aria-label="Slogan göster"
                    onChange={(next) => {
                      setShowSlogan(next);
                      syncOverrides({ showSlogan: next });
                    }}
                  />
                </div>
                <Input
                  id="hero-slogan"
                  type="text"
                  maxLength={60}
                  value={sloganText}
                  disabled={!showSlogan}
                  onChange={(e) => {
                    setSloganText(e.target.value);
                    syncOverrides({ sloganText: e.target.value });
                  }}
                  placeholder="Slogan / sektör etiketi"
                />
                <p className="text-right text-xs text-ink-3">{counter(sloganText, 60)}</p>
              </div>

              <Field label="Buton metni" htmlFor="hero-cta" hint={counter(ctaText, 30)}>
                <Input
                  id="hero-cta"
                  type="text"
                  maxLength={30}
                  value={ctaText}
                  onChange={(e) => {
                    setCtaText(e.target.value);
                    syncOverrides({ customCtaText: e.target.value });
                  }}
                  placeholder="Hemen Randevu Al"
                />
              </Field>

              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium text-ink-2">Buton rengi</legend>
                <p className="text-xs text-ink-3">
                  Rezervasyon sayfanızdaki butonlar ve vurgular. Tema rengi seçiliyken tema değiştirince renk de değişir.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {(
                    [
                      { id: "theme", label: "Tema rengi", swatch: themePrimaryColor },
                      { id: "custom", label: "Özel renk", swatch: customAccent },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={ctaMode === c.id}
                      onClick={() => setCtaMode(c.id)}
                      className={choiceClasses(ctaMode === c.id, "flex items-center gap-2 px-3 py-2.5 text-xs")}
                    >
                      <span
                        className={cn("h-4 w-4 shrink-0 rounded-full border border-black/10", !c.swatch && "bg-line-strong")}
                        style={c.swatch ? { backgroundColor: c.swatch } : undefined}
                        aria-hidden="true"
                      />
                      {c.label}
                    </button>
                  ))}
                </div>
                {ctaMode === "custom" && (
                  <label className="flex items-center gap-2 pt-1 text-xs text-ink-2">
                    <input
                      type="color"
                      value={customAccent || themePrimaryColor}
                      onChange={(e) => syncOverrides({ ctaColor: "custom", primaryColor: e.target.value })}
                      className="h-8 w-10 cursor-pointer rounded-control border border-line-strong bg-surface p-0.5"
                      aria-label="Özel buton rengi"
                    />
                    <span className="font-mono">{customAccent}</span>
                  </label>
                )}
              </fieldset>
            </div>
          </div>
        </Panel>

        <Panel title="Galeri düzeni" description="Portföy görsellerinizin sayfada nasıl akacağını seçin.">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={currentLayout === l.id}
                onClick={() => handleLayoutChange(l.id)}
                className={choiceClasses(currentLayout === l.id, "p-2.5 text-left")}
              >
                <div className="mb-2 h-14 rounded-[4px] bg-surface-muted p-1.5">{l.thumb}</div>
                <span className="block text-sm font-medium text-ink">{l.name}</span>
                <span className="mt-0.5 block text-xs leading-snug text-ink-3">{l.desc}</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {/* ────────────────── RIGHT COLUMN (PREVIEW, SPEED, SIZE) ────────────────── */}
      <div className="space-y-5 lg:col-span-5">
        <Panel
          title="Önizleme"
          description="Değişiklikler anında yansır."
          action={
            <a
              href={`/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("secondary", "sm")}
            >
              Yeni sekmede aç
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          }
        >
          {/* Mock of the public page's hero (uses the public page's own colors) */}
          <div className="overflow-hidden rounded-control border border-line bg-[#0B0F19] text-white">
            <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-3 py-2">
              <span className="max-w-[140px] truncate text-xs font-semibold">{business.name || "RandevuGo"}</span>
              <div className="hidden items-center gap-3 text-[10px] text-slate-300 sm:flex">
                <span>Hizmetler</span>
                <span>Ekibimiz</span>
                <span>Yorumlar</span>
              </div>
              <button
                type="button"
                onClick={onOpenLivePreviewModal}
                className="rounded-md bg-[#00C98D] px-2.5 py-1 text-[10px] font-semibold text-slate-950"
              >
                Randevu Al
              </button>
            </div>

            <div className="relative flex min-h-[200px] flex-col justify-center overflow-hidden p-5">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={
                  bgType === "color"
                    ? { backgroundColor: ctaPreviewColor }
                    : { backgroundImage: `url(${coverImage})` }
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/35" />

              <div className="relative z-10 max-w-sm space-y-2.5">
                <h3 className="text-xl font-bold leading-tight tracking-tight">{heroTitle}</h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-300">{heroDesc}</p>

                {showSlogan && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-medium">
                    <Scissors className="h-3 w-3" aria-hidden="true" />
                    {sloganText}
                  </span>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenLivePreviewModal}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold"
                    style={{
                      backgroundColor: ctaPreviewColor,
                      color: ctaPreviewText,
                    }}
                  >
                    {ctaText} →
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-white/5 bg-black/40 p-3 text-[10px] text-slate-300 sm:grid-cols-4">
              {[
                [Users2, "Profesyonel ekip"],
                [ShieldCheck, "Hijyenik ortam"],
                [Scissors, "Modern ekipman"],
                [Star, "%100 memnuniyet"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Star;
                return (
                  <span key={label as string} className="flex items-center gap-1.5 truncate">
                    <I className="h-3 w-3 shrink-0 text-[#00C98D]" aria-hidden="true" />
                    <span className="truncate">{label as string}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </Panel>

        <Panel title="Hareket ve hız" description="Galeri akışının yönü ve hızı.">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-ink-2">Hareket yönü</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "right-to-left", label: "Sağdan sola", icon: ArrowLeft },
                  { id: "left-to-right", label: "Soldan sağa", icon: ArrowRight },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={currentDirection === d.id}
                    onClick={() => handleDirectionChange(d.id)}
                    className={choiceClasses(currentDirection === d.id, "flex h-9 items-center justify-center gap-2 px-3")}
                  >
                    <d.icon className="h-4 w-4" aria-hidden="true" />
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="gallery-speed" className="text-sm font-medium text-ink-2">
                  Akış hızı
                </label>
                <span className="text-sm font-medium text-ink">{getSpeedLabel(currentSpeed)}</span>
              </div>
              <input
                id="gallery-speed"
                type="range"
                min="1"
                max="5"
                step="1"
                value={getSpeedSliderValue(currentSpeed)}
                onChange={handleSpeedSliderChange}
                className="w-full cursor-pointer accent-brand"
              />
              <div className="flex justify-between text-xs text-ink-3">
                <span>Çok yavaş</span>
                <span>Normal</span>
                <span>Çok hızlı</span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Görsel boyutu ve oranı" description="Galeri görsellerinin ekrandaki ölçüsü.">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-ink-2">Görsel boyutu</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "SMALL", label: "Küçük", hint: "~200px" },
                  { id: "MEDIUM", label: "Orta", hint: "~280px" },
                  { id: "LARGE", label: "Büyük", hint: "~360px" },
                  { id: "XLARGE", label: "XL", hint: "~450px" },
                  { id: "FULL", label: "Tam ekran", hint: "" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={currentSize === s.id}
                    onClick={() => handleSizeChange(s.id)}
                    className={choiceClasses(currentSize === s.id, "h-8 px-2.5 text-xs")}
                  >
                    {s.label}
                    {s.hint && <span className="ml-1 text-ink-3">{s.hint}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-ink-2">En/boy oranı</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "4:5", hint: "Dikey" },
                  { id: "1:1", hint: "Kare" },
                  { id: "3:2", hint: "Klasik" },
                  { id: "16:9", hint: "Geniş" },
                  { id: "21:9", hint: "Panoramik" },
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={currentAspect === a.id}
                    onClick={() => handleAspectChange(a.id)}
                    className={choiceClasses(currentAspect === a.id, "h-8 px-2.5 text-xs")}
                  >
                    <span className="font-medium tabular-nums">{a.id}</span>
                    <span className="ml-1 text-ink-3">{a.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
