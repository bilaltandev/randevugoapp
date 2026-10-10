"use client";

import React, { useRef, useState } from "react";
import { Check, Images, Loader2, Sparkles, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";

export const SAMPLE_COVERS = [
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1600&h=900&fit=crop",
];

const MAX_UPLOAD_MB = 10;

type Source = "upload" | "gallery" | "samples";

interface CoverImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  current: string;
  galleryItems: { id: string; imageUrl: string; title?: string | null }[];
  onSelect: (url: string) => void;
}

export function CoverImagePicker({ isOpen, onClose, current, galleryItems, onSelect }: CoverImagePickerProps) {
  const [source, setSource] = useState<Source>("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (url: string) => {
    onSelect(url);
    onClose();
  };

  const handleFile = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seçin (JPG, PNG, WebP).");
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`Dosya en fazla ${MAX_UPLOAD_MB} MB olabilir.`);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/gallery/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Görsel yüklenemedi.");
        return;
      }
      pick(data.url);
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const galleryPhotos = galleryItems.filter((i) => i.imageUrl);

  const tile = (url: string, alt: string, key: string) => (
    <button
      key={key}
      type="button"
      onClick={() => pick(url)}
      aria-pressed={current === url}
      className={cn(
        "relative aspect-video overflow-hidden rounded-control border transition",
        current === url ? "border-brand ring-2 ring-brand" : "border-line hover:border-line-strong"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      {current === url && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-on-brand">
          <Check className="h-3 w-3" aria-hidden="true" />
        </span>
      )}
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Arka plan görseli seç" maxWidth="2xl">
      <div className="space-y-4">
        <Segmented<Source>
          fill
          aria-label="Görsel kaynağı"
          value={source}
          onChange={(v) => {
            setSource(v);
            setError("");
          }}
          options={[
            { value: "upload", label: "Bilgisayardan yükle", icon: Upload },
            { value: "gallery", label: "Galerim", icon: Images, count: galleryPhotos.length },
            { value: "samples", label: "Hazır görseller", icon: Sparkles },
          ]}
        />

        {source === "upload" && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className="flex flex-col items-center rounded-panel border border-dashed border-line-strong bg-surface-muted px-4 py-10 text-center"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-ink-3" aria-hidden="true" />
            ) : (
              <Upload className="h-6 w-6 text-ink-3" aria-hidden="true" />
            )}
            <p className="mt-3 text-sm font-medium text-ink">
              {uploading ? "Yükleniyor..." : "Görseli buraya sürükleyin veya seçin"}
            </p>
            <p className="mt-1 text-xs text-ink-3">
              JPG, PNG veya WebP · en fazla {MAX_UPLOAD_MB} MB · yatay (16:9) görseller en iyi sonucu verir
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              id="cover-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <Button
              type="button"
              variant="primary"
              className="mt-4"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              Dosya seç
            </Button>
          </div>
        )}

        {source === "gallery" &&
          (galleryPhotos.length === 0 ? (
            <p className="rounded-panel border border-line bg-surface-muted px-4 py-8 text-center text-sm text-ink-3">
              Galerinizde henüz görsel yok. Galeri sekmesinden görsel ekleyebilir veya bilgisayardan yükleyebilirsiniz.
            </p>
          ) : (
            <div className="grid max-h-[50vh] grid-cols-2 gap-2.5 overflow-y-auto sm:grid-cols-3">
              {galleryPhotos.map((item) => tile(item.imageUrl, item.title || "Galeri görseli", item.id))}
            </div>
          ))}

        {source === "samples" && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {SAMPLE_COVERS.map((url, i) => tile(url, `Hazır görsel ${i + 1}`, url))}
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
