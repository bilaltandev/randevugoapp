"use client";

import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2,
  Sparkles,
  Layers,
  Infinity,
  Film,
  LayoutGrid,
  Grid,
  BookOpen,
  Maximize2,
  ArrowRight,
  ArrowLeft,
  Edit2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { choiceClasses } from "@/components/ui/choice";
import {
  GalleryData,
  GalleryItemData,
  GalleryLayout,
  GalleryDirection,
  GallerySpeed,
  GalleryImageSize,
  GalleryAspectRatio,
  GalleryBorderRadius,
  GalleryScrollAnimation,
  GalleryClickAction,
  LAYOUT_METADATA,
  SPEED_LABEL_MAP,
  ASPECT_RATIOS,
  IMAGE_SIZES,
  SECTOR_SAMPLE_IMAGES,
} from "@/lib/gallery/types";
import { Modal } from "@/components/Modal";

interface GallerySettingsPanelProps {
  business: any;
  gallery: GalleryData;
  items: GalleryItemData[];
  onGalleryChange: (newGallery: GalleryData) => void;
  onItemsChange: (newItems: GalleryItemData[]) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  savedSuccess: boolean;
}

const SPEED_STEPS: GallerySpeed[] = ["VERY_SLOW", "SLOW", "NORMAL", "FAST", "VERY_FAST"];

export function GallerySettingsPanel({
  business,
  gallery,
  items,
  onGalleryChange,
  onItemsChange,
  onSave,
  isSaving,
  savedSuccess,
}: GallerySettingsPanelProps) {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItemData | null>(null);

  // Form states for new/edit item
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemAltText, setItemAltText] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-file upload states
  const [isUploadingMultiple, setIsUploadingMultiple] = useState(false);
  const [multiUploadProgress, setMultiUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // Multi-file upload handler
  const handleMultiFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingMultiple(true);
    const total = files.length;
    setMultiUploadProgress({ current: 0, total });

    const newItems: GalleryItemData[] = [];
    let currentOrder = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 0;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      setMultiUploadProgress({ current: i + 1, total });

      try {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/gallery/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if (uploadRes.ok && uploadData.url) {
          // Clean original file name for title
          const rawName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
          const cleanTitle = rawName.replace(/[-_]/g, " ");

          const itemRes = await fetch("/api/gallery/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: uploadData.url,
              title: cleanTitle,
              sortOrder: currentOrder++,
              isActive: true,
            }),
          });
          const itemData = await itemRes.json();
          if (itemData.item) {
            newItems.push(itemData.item);
          }
        }
      } catch (err) {
        console.error("Multi upload error for file:", file.name, err);
      }
    }

    if (newItems.length > 0) {
      onItemsChange([...items, ...newItems]);
    }
    setIsUploadingMultiple(false);
    setMultiUploadProgress(null);
  };

  // Reorder Item
  const handleMoveItem = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Update sortOrder values
    const updated = newItems.map((item, idx) => ({ ...item, sortOrder: idx }));
    onItemsChange(updated);

    try {
      await fetch("/api/gallery/items/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: updated.map((i) => i.id) }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle item active
  const handleToggleActive = async (itemId: string, currentActive: boolean) => {
    const updated = items.map((i) => (i.id === itemId ? { ...i, isActive: !currentActive } : i));
    onItemsChange(updated);

    try {
      await fetch("/api/gallery/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, isActive: !currentActive }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Bu görseli galeriden kaldırmak istediğinize emin misiniz?")) return;

    const updated = items.filter((i) => i.id !== itemId);
    onItemsChange(updated);

    try {
      await fetch(`/api/gallery/items?id=${itemId}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error(e);
    }
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Görsel boyutu en fazla 10MB olabilir.");
      return;
    }

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Görsel yüklenemedi.");
      }

      setItemImageUrl(data.url);
    } catch (err: any) {
      setUploadError(err.message || "Görsel yüklenirken bir hata oluştu.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    setItemImageUrl("");
    setItemTitle("");
    setItemDescription("");
    setItemAltText("");
    setUploadError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: GalleryItemData) => {
    setEditingItem(item);
    setItemImageUrl(item.imageUrl);
    setItemTitle(item.title || "");
    setItemDescription(item.description || "");
    setItemAltText(item.altText || "");
    setUploadError(null);
    setIsAddModalOpen(true);
  };

  // Save new or edited item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemImageUrl) {
      setUploadError("Lütfen bir görsel yükleyin veya URL girin.");
      return;
    }

    try {
      const payload = {
        id: editingItem?.id,
        imageUrl: itemImageUrl,
        title: itemTitle || null,
        description: itemDescription || null,
        altText: itemAltText || itemTitle || null,
      };

      const res = await fetch("/api/gallery/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (editingItem) {
          onItemsChange(items.map((i) => (i.id === editingItem.id ? data.item : i)));
        } else {
          onItemsChange([...items, data.item]);
        }
        setIsAddModalOpen(false);
      } else {
        setUploadError(data.error || "Görsel kaydedilemedi.");
      }
    } catch (e) {
      setUploadError("Bağlantı hatası oluştu.");
    }
  };

  // Load sample photos for sector
  const handleLoadSamples = async () => {
    const samples = SECTOR_SAMPLE_IMAGES[business.sector] || SECTOR_SAMPLE_IMAGES.BERBER;
    if (!samples || samples.length === 0) return;

    if (!confirm(`${business.sector} sektörü için hazırlanmış hazır profesyonel örnek görselleri eklemek istiyor musunuz?`)) {
      return;
    }

    try {
      const newCreated: GalleryItemData[] = [];
      for (const sample of samples) {
        const res = await fetch("/api/gallery/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: sample.url,
            title: sample.title,
            description: sample.desc,
            altText: sample.title,
          }),
        });
        const data = await res.json();
        if (data.item) newCreated.push(data.item);
      }
      onItemsChange([...items, ...newCreated]);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper updater for gallery config
  const updateGallery = (patch: Partial<GalleryData>) => {
    onGalleryChange({ ...gallery, ...patch });
  };

  // Speed slider index
  const speedIndex = SPEED_STEPS.indexOf(gallery.speed);

  const LAYOUT_ICONS: Record<GalleryLayout, React.ComponentType<{ className?: string }>> = {
    INFINITE_FLOW: Infinity,
    DUAL_FLOW: Layers,
    CINEMATIC_STRIP: Film,
    CARDS: LayoutGrid,
    MASONRY: Grid,
    EDITORIAL: BookOpen,
    FULL_BLEED: Maximize2,
  };

  const effectToggles: { key: "parallaxEnabled" | "scrollReactive" | "scrollDirectionTracking"; label: string; desc: string }[] = [
    { key: "parallaxEnabled", label: "Parallax hareketi", desc: "Hafif 3D derinlik" },
    { key: "scrollReactive", label: "Kaydırma tepkisi", desc: "Kaydırma hızına duyarlı" },
    { key: "scrollDirectionTracking", label: "Kaydırma yönü takibi", desc: "Yukarı/aşağı yönü izler" },
  ];

  return (
    <div className="space-y-5">
      {/* ────────────────── 1. MAIN SWITCH ────────────────── */}
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="gallery-enabled-label" className="text-sm font-semibold text-ink">
                Fotoğraf galerisi
              </h2>
              <span
                className={cn(
                  "rounded-control border px-1.5 py-0.5 text-xs font-medium leading-4",
                  gallery.enabled
                    ? "border-brand-line bg-brand-soft text-brand-ink"
                    : "border-line bg-surface-muted text-ink-3"
                )}
              >
                {gallery.enabled ? "Açık" : "Kapalı"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-ink-3">
              Müşterileriniz randevu öncesinde çalışmalarınızı inceleyebilsin.
            </p>
          </div>
          <Switch
            checked={gallery.enabled}
            onChange={(checked) => updateGallery({ enabled: checked })}
            aria-labelledby="gallery-enabled-label"
            className="mt-0.5"
          />
        </div>

        {!gallery.enabled && (
          <p className="mt-4 flex items-center gap-2 rounded-control border border-pending-line bg-pending-soft px-3 py-2 text-sm text-pending">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Galeri kapalı ve rezervasyon sayfanızda gizli.
          </p>
        )}
      </Panel>

      {gallery.enabled && (
        <>
          {/* ────────────────── 2. IMAGES ────────────────── */}
          <Panel
            title={`Görseller (${items.length})`}
            description="Okları kullanarak sıralayın; gizlenen görseller sayfada görünmez."
            action={
              <div className="flex flex-wrap justify-end gap-1.5">
                <Button size="sm" variant="ghost" onClick={handleLoadSamples}>
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Örnek görseller</span>
                </Button>
                <Button size="sm" variant="primary" onClick={openAddModal}>
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  Görsel ekle
                </Button>
              </div>
            }
          >
            <input
              ref={multiFileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleMultiFileUpload(e.target.files);
                }
              }}
            />

            <div className="space-y-4">
              {/* Batch upload / progress */}
              {isUploadingMultiple && multiUploadProgress ? (
                <div role="status" className="flex items-center gap-4 rounded-control border border-line bg-surface-muted px-4 py-3">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-3" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">Görseller yükleniyor…</p>
                    <p className="text-xs text-ink-3 tabular-nums">
                      {multiUploadProgress.current} / {multiUploadProgress.total} dosya
                    </p>
                  </div>
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full bg-brand transition-all"
                      style={{ width: `${(multiUploadProgress.current / multiUploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      multiFileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleMultiFileUpload(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => multiFileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-1 rounded-control border border-dashed border-line-strong px-4 py-5 text-center transition-colors hover:bg-surface-muted"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Upload className="h-4 w-4 text-ink-3" aria-hidden="true" />
                    Fotoğrafları sürükleyin veya toplu seçim için tıklayın
                  </span>
                  <span className="text-xs text-ink-3">PNG, JPG, WebP veya AVIF · dosya başına en fazla 10 MB</span>
                </div>
              )}

              {items.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title="Henüz görsel yok"
                  description="Kaliteli fotoğraflar müşterilerinizin güvenini artırır."
                  actions={
                    <Button size="sm" onClick={handleLoadSamples}>
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      Sektör örneklerini ekle
                    </Button>
                  }
                />
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((item, index) => (
                    <li
                      key={item.id}
                      className="flex flex-col overflow-hidden rounded-control border border-line bg-surface"
                    >
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="relative aspect-[4/5] bg-surface-muted"
                        aria-label={`${item.title || "Görsel"} düzenle`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.altText || item.title || ""}
                          className={cn("h-full w-full object-cover", !item.isActive && "opacity-40 grayscale")}
                        />
                        <span className="absolute left-1.5 top-1.5 rounded-control bg-black/60 px-1.5 py-0.5 text-xs text-white tabular-nums">
                          {index + 1}
                        </span>
                        {!item.isActive && (
                          <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-control bg-black/60 px-1.5 py-0.5 text-xs text-white">
                            <EyeOff className="h-3 w-3" aria-hidden="true" />
                            Gizli
                          </span>
                        )}
                      </button>

                      <div className="px-2.5 pt-2">
                        <p className="truncate text-sm font-medium text-ink">{item.title || "Başlıksız görsel"}</p>
                        {item.description && <p className="truncate text-xs text-ink-3">{item.description}</p>}
                      </div>

                      <div className="mt-auto flex items-center justify-between px-1 py-1">
                        <div className="flex items-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-7 px-0"
                            disabled={index === 0}
                            onClick={() => handleMoveItem(index, "up")}
                            title="Öne taşı"
                            aria-label="Öne taşı"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-7 px-0"
                            disabled={index === items.length - 1}
                            onClick={() => handleMoveItem(index, "down")}
                            title="Arkaya taşı"
                            aria-label="Arkaya taşı"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-7 px-0"
                            onClick={() => handleToggleActive(item.id, item.isActive)}
                            title={item.isActive ? "Gizle" : "Yayına al"}
                            aria-label={item.isActive ? "Gizle" : "Yayına al"}
                          >
                            {item.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-7 px-0"
                            onClick={() => openEditModal(item)}
                            title="Düzenle"
                            aria-label="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-7 px-0 hover:text-danger"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Sil"
                            aria-label="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          {/* ────────────────── 3. SECTION TITLE ────────────────── */}
          <Panel
            title="Bölüm başlığı"
            action={
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-2">
                <input
                  type="checkbox"
                  checked={gallery.showTitle}
                  onChange={(e) => updateGallery({ showTitle: e.target.checked })}
                  className="h-4 w-4 rounded accent-brand"
                />
                Başlığı göster
              </label>
            }
          >
            {gallery.showTitle ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Galeri başlığı" htmlFor="gal-title">
                  <Input
                    id="gal-title"
                    type="text"
                    value={gallery.title || ""}
                    onChange={(e) => updateGallery({ title: e.target.value })}
                    placeholder="Örn: Galerimiz, Çalışmalarımız"
                  />
                </Field>
                <Field label="Alt açıklama" htmlFor="gal-subtitle" hint="İsteğe bağlı">
                  <Input
                    id="gal-subtitle"
                    type="text"
                    value={gallery.subtitle || ""}
                    onChange={(e) => updateGallery({ subtitle: e.target.value })}
                    placeholder="Örn: Salonumuzdan kareler."
                  />
                </Field>
              </div>
            ) : (
              <p className="text-sm text-ink-3">Galeri başlıksız gösterilir.</p>
            )}
          </Panel>

          {/* ────────────────── 4. LAYOUT ────────────────── */}
          <Panel title="Düzen" description="Galerinin sayfadaki görünümü.">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {(Object.keys(LAYOUT_METADATA) as GalleryLayout[]).map((layoutKey) => {
                const meta = LAYOUT_METADATA[layoutKey];
                const isSelected = gallery.layout === layoutKey;
                const Icon = LAYOUT_ICONS[layoutKey] ?? LayoutGrid;

                return (
                  <button
                    key={layoutKey}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => updateGallery({ layout: layoutKey })}
                    className={choiceClasses(isSelected, "relative p-3 text-left")}
                  >
                    {meta.badge && (
                      <span className="absolute right-2 top-2 text-xs text-ink-3">{meta.badge}</span>
                    )}
                    <Icon className={cn("mb-2 h-4 w-4", isSelected ? "text-brand" : "text-ink-3")} />
                    <span className="block text-sm font-medium text-ink">{meta.name}</span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-ink-3">{meta.tagline}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* ────────────────── 5. MOTION & SIZE ────────────────── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Hareket ve hız">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-ink-2">Hareket yönü</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "right-to-left" as GalleryDirection, label: "Sağdan sola", icon: ArrowLeft },
                      { id: "left-to-right" as GalleryDirection, label: "Soldan sağa", icon: ArrowRight },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        aria-pressed={gallery.direction === d.id}
                        onClick={() => updateGallery({ direction: d.id })}
                        className={choiceClasses(gallery.direction === d.id, "flex h-9 items-center justify-center gap-2 px-3")}
                      >
                        <d.icon className="h-4 w-4" aria-hidden="true" />
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor="gal-speed" className="text-sm font-medium text-ink-2">
                      Akış hızı: <span className="text-ink">{SPEED_LABEL_MAP[gallery.speed]?.label}</span>
                    </label>
                    <span className="truncate text-xs text-ink-3">{SPEED_LABEL_MAP[gallery.speed]?.desc}</span>
                  </div>
                  <input
                    id="gal-speed"
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={speedIndex}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      updateGallery({ speed: SPEED_STEPS[idx] });
                    }}
                    className="w-full cursor-pointer accent-brand"
                  />
                  <div className="flex justify-between text-xs text-ink-3">
                    <span>Çok yavaş</span>
                    <span>Normal</span>
                    <span>Çok hızlı</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
                  <div>
                    <p id="gal-pause-label" className="text-sm font-medium text-ink">
                      Üzerine gelince duraklat
                    </p>
                    <p className="text-xs text-ink-3">Fare görselin üzerindeyken akış durur.</p>
                  </div>
                  <Switch
                    checked={gallery.pauseOnHover}
                    onChange={(checked) => updateGallery({ pauseOnHover: checked })}
                    aria-labelledby="gal-pause-label"
                  />
                </div>
              </div>
            </Panel>

            <Panel title="Görsel boyutu ve oranı">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-ink-2">Görsel boyutu</p>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                    {(Object.keys(IMAGE_SIZES) as GalleryImageSize[]).map((szKey) => {
                      const sz = IMAGE_SIZES[szKey];
                      const isSelected = gallery.imageSize === szKey;
                      return (
                        <button
                          key={szKey}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => updateGallery({ imageSize: szKey })}
                          className={choiceClasses(isSelected, "px-2 py-1.5 text-center")}
                        >
                          <span className="block text-xs font-medium">{sz.label}</span>
                          <span className="block text-xs text-ink-3 tabular-nums">{sz.pixelDesc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-ink-2">En/boy oranı</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {ASPECT_RATIOS.map((ratio) => {
                      const isSelected = gallery.aspectRatio === ratio.id;
                      return (
                        <button
                          key={ratio.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => updateGallery({ aspectRatio: ratio.id })}
                          className={choiceClasses(isSelected, "px-2.5 py-1.5 text-left")}
                        >
                          <span className="block text-xs font-medium tabular-nums">{ratio.label}</span>
                          <span className="block truncate text-xs text-ink-3">{ratio.bestFor}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-ink-2">Köşe yuvarlaklığı</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {[
                      { id: "none", label: "Köşesiz" },
                      { id: "subtle", label: "Hafif" },
                      { id: "rounded", label: "Yuvarlak" },
                      { id: "extra", label: "Çok yuvarlak" },
                    ].map((r) => {
                      const isSelected = gallery.borderRadius === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => updateGallery({ borderRadius: r.id as GalleryBorderRadius })}
                          className={choiceClasses(isSelected, "h-8 px-2 text-xs")}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* ────────────────── 6. ADVANCED EFFECTS ────────────────── */}
          <Panel title="Gelişmiş efektler" description="Sayfa kaydırılırken ve görsele tıklanınca ne olacağı.">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Giriş animasyonu" htmlFor="gal-anim">
                  <Select
                    id="gal-anim"
                    value={gallery.scrollAnimation}
                    onChange={(e) => updateGallery({ scrollAnimation: e.target.value as GalleryScrollAnimation })}
                  >
                    <option value="None">Yok (statik)</option>
                    <option value="Fade In">Fade In (yumuşak belirme)</option>
                    <option value="Fade Up">Fade Up (aşağıdan yukarı)</option>
                    <option value="Fade Down">Fade Down (yukarıdan aşağı)</option>
                    <option value="Slide Left">Slide Left (soldan kayarak)</option>
                    <option value="Slide Right">Slide Right (sağdan kayarak)</option>
                    <option value="Scale In">Scale In (büyüyerek)</option>
                    <option value="Blur Reveal">Blur Reveal (bulanıktan netleşme)</option>
                    <option value="Clip Reveal">Clip Reveal (sinematik açılma)</option>
                    <option value="Stagger Reveal">Stagger Reveal (kademeli)</option>
                  </Select>
                </Field>

                <Field label="Görsele tıklanınca" htmlFor="gal-click">
                  <Select
                    id="gal-click"
                    value={gallery.clickAction}
                    onChange={(e) => updateGallery({ clickAction: e.target.value as GalleryClickAction })}
                  >
                    <option value="LIGHTBOX">Lightbox aç (büyüteç)</option>
                    <option value="FULLSCREEN">Tam ekran göster</option>
                    <option value="NONE">Hiçbir şey yapma</option>
                  </Select>
                </Field>
              </div>

              <ul className="divide-y divide-line rounded-control border border-line">
                {effectToggles.map((t) => (
                  <li key={t.key} className="flex items-center justify-between gap-4 px-3 py-2.5">
                    <div>
                      <p id={`gal-${t.key}`} className="text-sm font-medium text-ink">
                        {t.label}
                      </p>
                      <p className="text-xs text-ink-3">{t.desc}</p>
                    </div>
                    <Switch
                      checked={Boolean(gallery[t.key])}
                      onChange={(checked) => updateGallery({ [t.key]: checked } as Partial<GalleryData>)}
                      aria-labelledby={`gal-${t.key}`}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </>
      )}

      {/* ────────────────── ADD / EDIT ITEM MODAL ────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingItem ? "Görseli düzenle" : "Galeriye görsel ekle"}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          {uploadError && (
            <p role="alert" className="flex items-center gap-2 rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {uploadError}
            </p>
          )}

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-ink-2">Görsel dosyası</p>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-control border border-dashed border-line-strong p-4 text-center transition-colors hover:bg-surface-muted"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              {isUploadingFile ? (
                <span className="flex items-center justify-center gap-2 text-sm text-ink-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Görsel yükleniyor...
                </span>
              ) : itemImageUrl ? (
                <span className="flex items-center justify-center gap-3 text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={itemImageUrl} alt="" className="h-14 w-14 rounded-control border border-line object-cover" />
                  <span>
                    <span className="flex items-center gap-1 text-sm font-medium text-brand-ink">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Görsel hazır
                    </span>
                    <span className="block text-xs text-ink-3">Değiştirmek için tıklayın</span>
                  </span>
                </span>
              ) : (
                <>
                  <span className="flex items-center justify-center gap-2 text-sm font-medium text-ink">
                    <Upload className="h-4 w-4 text-ink-3" aria-hidden="true" />
                    Görsel seçmek için tıklayın
                  </span>
                  <span className="mt-1 block text-xs text-ink-3">PNG, JPG, WebP veya AVIF · en fazla 10 MB</span>
                </>
              )}
            </div>
          </div>

          <Field label="veya görsel bağlantısı (URL)" htmlFor="gal-item-url">
            <Input
              id="gal-item-url"
              type="url"
              value={itemImageUrl}
              onChange={(e) => setItemImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </Field>

          <Field label="Başlık" htmlFor="gal-item-title" hint="İsteğe bağlı">
            <Input
              id="gal-item-title"
              type="text"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              placeholder="Örn: Modern Fade Kesim, Şefin Spesiyali"
            />
          </Field>

          <Field label="Kısa açıklama" htmlFor="gal-item-desc" hint="İsteğe bağlı">
            <Textarea
              id="gal-item-desc"
              rows={2}
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="Görsel veya yapılan işlem hakkında kısa detay..."
            />
          </Field>

          <Field label="Alternatif metin (SEO)" htmlFor="gal-item-alt" hint="Arama motorları ve ekran okuyucular için">
            <Input
              id="gal-item-alt"
              type="text"
              value={itemAltText}
              onChange={(e) => setItemAltText(e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" variant="primary" disabled={!itemImageUrl || isUploadingFile}>
              {editingItem ? "Güncelle" : "Galeriye ekle"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
