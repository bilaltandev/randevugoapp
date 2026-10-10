"use client";

import React, { useState, useRef } from "react";
import { Upload, Trash2, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoUploaderProps {
  currentLogo?: string | null;
  businessName?: string;
  onLogoChange: (url: string | null) => void;
  className?: string;
}

export function LogoUploader({
  currentLogo,
  businessName = "İşletme",
  onLogoChange,
  className = "",
}: LogoUploaderProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogo || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setSuccess(null);

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Dosya boyutu en fazla 5MB olabilir.");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Lütfen geçerli bir görsel dosyası (PNG, JPG, SVG, WebP) yükleyin.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/business/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Logo yüklenirken bir hata oluştu.");
      }

      setLogoUrl(data.url);
      onLogoChange(data.url);
      setSuccess("Logo başarıyla yüklendi!");
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || "Yükleme başarısız oldu.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // reset input value so re-uploading same file works
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Logonuzu kaldırmak istediğinize emin misiniz?")) return;

    setIsUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/business/upload-logo", {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Logo kaldırılırken hata oluştu.");
      }

      setLogoUrl(null);
      onLogoChange(null);
      setSuccess("Logo kaldırıldı.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Kaldırma işlemi başarısız.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Preview */}
        <div className="relative shrink-0 self-start sm:self-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-panel border border-line bg-surface-muted">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={businessName} className="h-full w-full object-contain p-1.5" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-ink-3">
                <ImageIcon className="h-6 w-6" aria-hidden="true" />
                <span className="text-xs">Logo yok</span>
              </span>
            )}
          </div>

          {logoUrl && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              title="Logoyu kaldır"
              aria-label="Logoyu kaldır"
              className="absolute -right-2 -top-2 rounded-full border border-line bg-surface p-1 text-ink-3 shadow-xs transition-colors hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex-1 cursor-pointer rounded-panel border border-dashed p-4 text-center transition-colors",
            isDragOver ? "border-brand bg-brand-soft" : "border-line-strong hover:bg-surface-muted"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          {isUploading ? (
            <span className="flex items-center justify-center gap-2 text-sm text-ink-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Logo yükleniyor...
            </span>
          ) : (
            <>
              <span className="flex items-center justify-center gap-2 text-sm font-medium text-ink">
                <Upload className="h-4 w-4 text-ink-3" aria-hidden="true" />
                Logo seçin veya buraya sürükleyin
              </span>
              <span className="mt-1 block text-xs text-ink-3">PNG, JPG, WebP veya SVG · en fazla 5 MB</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="flex items-center gap-2 rounded-control border border-brand-line bg-brand-soft px-3 py-2 text-sm text-brand-ink">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {success}
        </p>
      )}
    </div>
  );
}
