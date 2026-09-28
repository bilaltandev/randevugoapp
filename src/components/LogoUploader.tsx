"use client";

import React, { useState, useRef } from "react";
import { Upload, Trash2, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";

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
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Logo Preview Avatar */}
        <div className="relative group shrink-0 self-start sm:self-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/80 flex items-center justify-center overflow-hidden transition-all shadow-md group-hover:border-indigo-500">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                className="w-full h-full object-contain p-1.5"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 gap-1 p-2 text-center">
                <ImageIcon className="w-7 h-7 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                <span className="text-[10px] text-slate-500 font-medium">Logo Yok</span>
              </div>
            )}
          </div>

          {logoUrl && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              title="Logoyu Kaldır"
              className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-500/90 text-white shadow-lg hover:bg-rose-600 transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Upload Drop Zone / Controls */}
        <div className="flex-1">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 sm:p-5 text-center transition-all ${
              isDragOver
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            <div className="flex flex-col items-center justify-center gap-1.5">
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  <span className="text-xs font-semibold text-slate-200">
                    Logo yükleniyor ve kaydediliyor...
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                    <Upload className="w-4 h-4" />
                    <span>Bilgisayarınızdan Logo Seçin veya Sürükleyin</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, WebP veya SVG • Maksimum 5MB • Sayfanızın başlığında görünür
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
