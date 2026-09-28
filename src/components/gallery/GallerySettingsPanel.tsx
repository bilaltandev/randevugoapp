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
  Sliders,
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
  Pause,
  Play,
  RotateCcw,
  Check,
  Edit2,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
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

  return (
    <div className="space-y-8">
      {/* ────────────────── 1. MAIN SWITCH & STATUS ────────────────── */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl ${gallery.enabled ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "bg-slate-800 text-slate-500"}`}>
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">Fotoğraf Galerisi Modülü</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${gallery.enabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                  {gallery.enabled ? "Aktif" : "Kapalı"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Müşterilerinizin randevu öncesinde portföyünüzü ve çalışmalarınızı incelemesini sağlayın.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={gallery.enabled}
                onChange={(e) => updateGallery({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
            </label>
          </div>
        </div>

        {!gallery.enabled && (
          <div className="mt-4 p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Galeri şu an kapalıdır ve public rezervasyon sayfanızda gizlenmiştir. Açmak için yukarıdaki anahtarı aktif edin.</span>
          </div>
        )}
      </div>

      {gallery.enabled && (
        <>
          {/* ────────────────── 2. HEADER & SECTION LABELS ────────────────── */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Bölüm Başlığı & Açıklama</h3>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gallery.showTitle}
                  onChange={(e) => updateGallery({ showTitle: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                />
                <span>Başlığı Göster</span>
              </label>
            </div>

            {gallery.showTitle && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Galeri Başlığı
                  </label>
                  <input
                    type="text"
                    value={gallery.title || ""}
                    onChange={(e) => updateGallery({ title: e.target.value })}
                    placeholder="Örn: Galerimiz, Çalışmalarımız, Son İşlerimiz"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Alt Açıklama (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={gallery.subtitle || ""}
                    onChange={(e) => updateGallery({ subtitle: e.target.value })}
                    placeholder="Örn: Salonumuzdan ve özenle yaptığımız işlemlerden kareler."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ────────────────── 3. LAYOUT SELECTOR ────────────────── */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Galeri Düzeni (Layout)</h3>
              </div>
              <span className="text-xs text-slate-400">7 Farklı Profesyonel Tasarım</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {(Object.keys(LAYOUT_METADATA) as GalleryLayout[]).map((layoutKey) => {
                const meta = LAYOUT_METADATA[layoutKey];
                const isSelected = gallery.layout === layoutKey;

                return (
                  <div
                    key={layoutKey}
                    onClick={() => updateGallery({ layout: layoutKey })}
                    className={`relative cursor-pointer p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "border-[#6246EA] bg-[#6246EA]/10 shadow-md shadow-[#6246EA]/15 ring-1 ring-[#6246EA]"
                        : "border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    {meta.badge && (
                      <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#6246EA] text-white">
                        {meta.badge}
                      </span>
                    )}

                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className={`p-2 rounded-xl transition-all ${
                          isSelected
                            ? "bg-[#6246EA] text-white shadow-sm shadow-[#6246EA]/30"
                            : "bg-[#F2F4F7] text-[#344054] border border-[#E4E7EC] dark:bg-slate-700 dark:text-slate-200 dark:border-transparent"
                        }`}
                      >
                        {layoutKey === "INFINITE_FLOW" && <Infinity className="w-4 h-4" />}
                        {layoutKey === "DUAL_FLOW" && <Layers className="w-4 h-4" />}
                        {layoutKey === "CINEMATIC_STRIP" && <Film className="w-4 h-4" />}
                        {layoutKey === "CARDS" && <LayoutGrid className="w-4 h-4" />}
                        {layoutKey === "MASONRY" && <Grid className="w-4 h-4" />}
                        {layoutKey === "EDITORIAL" && <BookOpen className="w-4 h-4" />}
                        {layoutKey === "FULL_BLEED" && <Maximize2 className="w-4 h-4" />}
                      </div>
                      <h4 className="font-bold text-xs text-[#111827] dark:text-slate-100">{meta.name}</h4>
                    </div>

                    <p className="text-[11px] text-[#667085] dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {meta.tagline}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ────────────────── 4. MOTION & SPEED CONTROLS ────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Motion Direction & Speed */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Play className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Hareket & Hız Ayarları</h3>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Hareket Yönü
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateGallery({ direction: "right-to-left" })}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                      gallery.direction === "right-to-left"
                        ? "border-[#6246EA] bg-[#6246EA]/15 text-[#6246EA] dark:text-indigo-300 font-bold"
                        : "border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-800/60 text-[#475467] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Sağdan Sola (Varsayılan)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateGallery({ direction: "left-to-right" })}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                      gallery.direction === "left-to-right"
                        ? "border-[#6246EA] bg-[#6246EA]/15 text-[#6246EA] dark:text-indigo-300 font-bold"
                        : "border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-800/60 text-[#475467] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Soldan Sağa</span>
                  </button>
                </div>
              </div>

              {/* Speed Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Akış Hızı:{" "}
                    <span className="text-indigo-400 font-bold">
                      {SPEED_LABEL_MAP[gallery.speed]?.label}
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {SPEED_LABEL_MAP[gallery.speed]?.desc}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={speedIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    updateGallery({ speed: SPEED_STEPS[idx] });
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 px-1 font-mono">
                  <span>Çok Yavaş</span>
                  <span>Yavaş</span>
                  <span>Normal</span>
                  <span>Hızlı</span>
                  <span>Çok Hızlı</span>
                </div>
              </div>

              {/* Pause on hover */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Hover'da Duraklat</span>
                  <span className="text-[11px] text-slate-400">
                    Kullanıcı fareyi görselin üzerine getirdiğinde akış dursun
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gallery.pauseOnHover}
                    onChange={(e) => updateGallery({ pauseOnHover: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {/* Visual Dimensions & Ratios */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Maximize2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Görsel Boyutu & Oranı</h3>
              </div>

              {/* Image Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Görsel Boyutu
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(Object.keys(IMAGE_SIZES) as GalleryImageSize[]).map((szKey) => {
                    const sz = IMAGE_SIZES[szKey];
                    const isSelected = gallery.imageSize === szKey;
                    return (
                      <button
                        key={szKey}
                        type="button"
                        onClick={() => updateGallery({ imageSize: szKey })}
                        className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold"
                            : "border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-xs block">{sz.label}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{sz.pixelDesc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Görsel En/Boy Oranı (Aspect Ratio)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ratio) => {
                    const isSelected = gallery.aspectRatio === ratio.id;
                    return (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => updateGallery({ aspectRatio: ratio.id })}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                            : "border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-xs font-bold block">{ratio.label}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{ratio.bestFor}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Köşe Yuvarlaklığı
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "none", label: "Köşesiz" },
                    { id: "subtle", label: "Hafif" },
                    { id: "rounded", label: "Yuvarlak" },
                    { id: "extra", label: "Çok Yuvarlak" },
                  ].map((r) => {
                    const isSelected = gallery.borderRadius === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => updateGallery({ borderRadius: r.id as GalleryBorderRadius })}
                        className={`py-2 px-2 text-center text-xs rounded-xl border transition-all ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold"
                            : "border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────── 5. ADVANCED EFFECTS & SCROLL ────────────────── */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">Gelişmiş Scroll & Etkileşim Efektleri</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Scroll Animation */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sayfa Giriş Animasyonu
                </label>
                <select
                  value={gallery.scrollAnimation}
                  onChange={(e) => updateGallery({ scrollAnimation: e.target.value as GalleryScrollAnimation })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="None">Yok (Statik)</option>
                  <option value="Fade In">Fade In (Yumuşak Belirme)</option>
                  <option value="Fade Up">Fade Up (Aşağıdan Yukarıya Belirme)</option>
                  <option value="Fade Down">Fade Down (Yukarıdan Aşağıya Belirme)</option>
                  <option value="Slide Left">Slide Left (Yandan Kayarak Giriş)</option>
                  <option value="Slide Right">Slide Right (Sağdan Kayarak Giriş)</option>
                  <option value="Scale In">Scale In (Büyüyerek Açılma)</option>
                  <option value="Blur Reveal">Blur Reveal (Bulanıktan Netleşme)</option>
                  <option value="Clip Reveal">Clip Reveal (Sinematik Açılma)</option>
                  <option value="Stagger Reveal">Stagger Reveal (Kademeli Giriş)</option>
                </select>
              </div>

              {/* Click Action */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Görsel Tıklama Davranışı
                </label>
                <select
                  value={gallery.clickAction}
                  onChange={(e) => updateGallery({ clickAction: e.target.value as GalleryClickAction })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="LIGHTBOX">Lightbox Aç (Foto Galeri & Büyüteç)</option>
                  <option value="FULLSCREEN">Tam Ekran Görüntüle</option>
                  <option value="NONE">Hiçbir şey yapma</option>
                </select>
              </div>

              {/* Parallax */}
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Parallax Hareketi</span>
                  <span className="text-[10px] text-slate-400">Hafif 3D derinlik</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gallery.parallaxEnabled}
                    onChange={(e) => updateGallery({ parallaxEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Scroll Reactive */}
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Scroll Tepkisi</span>
                  <span className="text-[10px] text-slate-400">Kaydırma hızına duyarlı</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gallery.scrollReactive}
                    onChange={(e) => updateGallery({ scrollReactive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Scroll Direction Tracking */}
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Scroll Yönü Takibi</span>
                  <span className="text-[10px] text-slate-400">Yukarı/aşağı yön değiştirme</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gallery.scrollDirectionTracking}
                    onChange={(e) => updateGallery({ scrollDirectionTracking: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* ────────────────── 6. IMAGE MANAGEMENT & UPLOAD ────────────────── */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>Galeri Görselleri ({items.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Görselleri sürükleyip bırakarak veya yukarı/aşağı butonlarıyla sıralayabilirsiniz.
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2">
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

                <button
                  type="button"
                  onClick={() => multiFileInputRef.current?.click()}
                  disabled={isUploadingMultiple}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all disabled:opacity-50"
                  title="Birden fazla görseli aynı anda seçip yükleyin"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Toplu Görsel Yükle</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSamples}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Örnek Görselleri Yükle</span>
                </button>

                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tek Görsel Ekle</span>
                </button>
              </div>
            </div>

            {/* Multiple Upload Progress */}
            {isUploadingMultiple && multiUploadProgress && (
              <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-indigo-200 block">
                      Görseller Galeriye Yükleniyor...
                    </span>
                    <span className="text-[11px] text-indigo-300/80">
                      {multiUploadProgress.current} / {multiUploadProgress.total} dosya işleniyor. Lütfen bekleyin.
                    </span>
                  </div>
                </div>
                <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{
                      width: `${(multiUploadProgress.current / multiUploadProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Drag & Drop Quick Batch Area */}
            <div
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
              className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-950/40 hover:bg-slate-900/60 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold text-slate-200 block">
                  Fotoğrafları buraya sürükleyin veya toplu dosya seçmek için tıklayın
                </span>
                <span className="text-[11px] text-slate-400">
                  Birden fazla PNG, JPG, WebP veya AVIF seçebilirsiniz (Maks. 10MB / dosya)
                </span>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl">
                <ImageIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-300 mb-1">Henüz Görsel Yüklenmedi</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  İşletmenizden kaliteli fotoğraflar ekleyerek müşterilerinizin randevu güvenini artırın.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => multiFileInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Toplu Görsel Yükle
                  </button>
                  <button
                    onClick={handleLoadSamples}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    {business.sector} Örneklerini Yükle
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`group relative rounded-2xl border p-2.5 transition-all ${
                      item.isActive
                        ? "border-slate-800 bg-slate-800/40 hover:border-slate-700"
                        : "border-slate-800/60 bg-slate-900/40 opacity-60"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-2 bg-slate-950">
                      <img
                        src={item.imageUrl}
                        alt={item.altText || item.title || ""}
                        className="w-full h-full object-cover"
                      />

                      {/* Status badge */}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.isActive
                              ? "bg-emerald-500/80 text-white backdrop-blur-md"
                              : "bg-slate-800/90 text-slate-400 backdrop-blur-md"
                          }`}
                        >
                          {item.isActive ? "Yayında" : "Gizli"}
                        </span>
                      </div>

                      {/* Quick Actions Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.id, item.isActive)}
                          className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                          title={item.isActive ? "Gizle" : "Yayına Al"}
                        >
                          {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="px-1">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="font-semibold text-xs text-slate-200 truncate">
                          {item.title || "Başlıksız Görsel"}
                        </h5>
                        <span className="text-[10px] text-slate-500 font-mono">#{index + 1}</span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Ordering Buttons */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveItem(index, "up")}
                          className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                          title="Öne Taşı"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === items.length - 1}
                          onClick={() => handleMoveItem(index, "down")}
                          className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                          title="Arkaya Taşı"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="text-[11px] text-indigo-400 hover:underline font-medium"
                      >
                        Düzenle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ────────────────── ADD / EDIT ITEM MODAL ────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingItem ? "Görseli Düzenle" : "Yeni Galeri Görseli Ekle"}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          {uploadError && (
            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Görsel Dosyası Yükle
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/70 transition-all"
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
                <div className="py-2 flex flex-col items-center gap-2 text-indigo-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Görsel optimize edilip yükleniyor...</span>
                </div>
              ) : itemImageUrl ? (
                <div className="flex items-center justify-center gap-3">
                  <img
                    src={itemImageUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-700"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-emerald-400 block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Görsel Hazır
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Değiştirmek için tıklayın veya yeni dosya seçin
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <Upload className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200 block">
                    Görsel Seçmek İçin Tıklayın
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    PNG, JPG, WebP veya AVIF (Maks. 10MB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Or Manual URL Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Veya Görsel Bağlantısı (URL)
            </label>
            <input
              type="url"
              value={itemImageUrl}
              onChange={(e) => setItemImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Başlık (Opsiyonel)
            </label>
            <input
              type="text"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              placeholder="Örn: Modern Fade Kesim, Şefin Spesiyali, Seramik Kaplama"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kısa Açıklama (Opsiyonel)
            </label>
            <textarea
              rows={2}
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="Görsel veya yapılan işlem hakkında kısa detay..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Alt Text (SEO) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Alt Metin / SEO Açıklaması
            </label>
            <input
              type="text"
              value={itemAltText}
              onChange={(e) => setItemAltText(e.target.value)}
              placeholder="Arama motorları ve ekran okuyucular için açıklama"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!itemImageUrl || isUploadingFile}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all"
            >
              {editingItem ? "Değişiklikleri Güncelle" : "Galeriye Ekle"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
