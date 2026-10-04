"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Camera,
  Check,
  Circle,
  Square,
  RectangleHorizontal,
  Users,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { RestaurantTable, RestaurantArea, TableShape, TableStatus } from "./types";

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tableData: Partial<RestaurantTable>) => Promise<void>;
  table?: RestaurantTable | null;
  areas: RestaurantArea[];
  defaultAreaId?: string | null;
}

const QUICK_TAGS = [
  "Deniz Manzarası",
  "Teras",
  "Bahçe",
  "Salon",
  "Pencere Kenarı",
  "Şömine Başı",
  "VIP Loca",
  "Sessiz Köşe",
  "Bar Yanı",
];

export function TableModal({
  isOpen,
  onClose,
  onSave,
  table,
  areas,
  defaultAreaId,
}: TableModalProps) {
  const isEditing = Boolean(table);

  const [name, setName] = useState(table?.name || "");
  const [capacity, setCapacity] = useState(table?.capacity || 4);
  const [shape, setShape] = useState<TableShape>(table?.shape || "ROUND");
  const [width, setWidth] = useState(table?.width || 90);
  const [height, setHeight] = useState(table?.height || 90);
  const [areaId, setAreaId] = useState<string>(table?.areaId || defaultAreaId || (areas[0]?.id || ""));
  const [description, setDescription] = useState(table?.description || "");
  const [imageUrl, setImageUrl] = useState(table?.imageUrl || "");
  const [isActive, setIsActive] = useState(table?.isActive ?? true);
  const [status, setStatus] = useState<TableStatus>(table?.status || "AVAILABLE");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Auto adjust default dimensions when changing shape
  const handleShapeChange = (newShape: TableShape) => {
    setShape(newShape);
    if (newShape === "ROUND") {
      setWidth(85);
      setHeight(85);
    } else if (newShape === "SQUARE") {
      setWidth(90);
      setHeight(90);
    } else if (newShape === "RECTANGLE") {
      setWidth(140);
      setHeight(85);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/restaurant/tables/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Görsel yüklenemedi.");
      }

      setImageUrl(data.url);
    } catch (err: any) {
      setError(err.message || "Görsel yüklenirken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Masa adı veya numarası zorunludur.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave({
        id: table?.id,
        name: name.trim(),
        capacity: Number(capacity) || 2,
        shape,
        width: Number(width) || 90,
        height: Number(height) || 90,
        areaId: areaId || null,
        description: description.trim() || null,
        imageUrl: imageUrl || null,
        isActive,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? "Masayı Düzenle" : "Yeni Masa Oluştur"}
            </h3>
            <p className="text-xs text-slate-400">
              Restoran masa planınızdaki masa bilgilerini yapılandırın.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Table Name & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Masa Adı / No *
              </label>
              <input
                type="text"
                placeholder="Örn: Masa 1, Teras 4, VIP 2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kişi Kapasitesi *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCapacity(Math.max(1, capacity - 1))}
                  className="h-10 w-10 shrink-0 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-center rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setCapacity(capacity + 1)}
                  className="h-10 w-10 shrink-0 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Area Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Bulunduğu Alan
            </label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Alansız (Genel)</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Table Shape */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Masa Şekli
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleShapeChange("ROUND")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                  shape === "ROUND"
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-md shadow-indigo-500/20"
                    : "border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Circle className="w-5 h-5" />
                <span>Yuvarlak</span>
              </button>

              <button
                type="button"
                onClick={() => handleShapeChange("SQUARE")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                  shape === "SQUARE"
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-md shadow-indigo-500/20"
                    : "border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Square className="w-5 h-5" />
                <span>Kare</span>
              </button>

              <button
                type="button"
                onClick={() => handleShapeChange("RECTANGLE")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                  shape === "RECTANGLE"
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-md shadow-indigo-500/20"
                    : "border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700"
                }`}
              >
                <RectangleHorizontal className="w-5 h-5" />
                <span>Dikdörtgen</span>
              </button>
            </div>
          </div>

          {/* Description & Quick Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Masa Özelliği / Açıklama
            </label>
            <input
              type="text"
              placeholder="Örn: Deniz Manzaralı, Pencere Kenarı, Teras Ön Cephe"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (description.includes(tag)) return;
                    setDescription(description ? `${description}, ${tag}` : tag);
                  }}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 px-2 py-1 text-[11px] text-slate-300 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Table Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Masaya Özel Fotoğraf (Opsiyonel)
            </label>
            <div className="space-y-2">
              {imageUrl ? (
                <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-slate-700 group bg-slate-800">
                  <img
                    src={imageUrl}
                    alt="Masa Görseli"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl bg-slate-900/90 text-white px-3 py-1.5 text-xs font-semibold hover:bg-black transition-colors"
                    >
                      Değiştir
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="rounded-xl bg-rose-600 text-white p-1.5 hover:bg-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-indigo-500/70 rounded-2xl p-4 text-center bg-slate-800/40 hover:bg-slate-800/70 transition-all flex flex-col items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                      <span className="text-xs text-slate-400">Görsel yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-semibold text-slate-200">
                        Fotoğraf Yüklemek İçin Tıklayın
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Deniz manzarası, bahçe, pencere kenarı gibi masadan kareler
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Status & Active State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Masa Durumu
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TableStatus)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="AVAILABLE">Müsait (Yeşil)</option>
                <option value="RESERVED">Rezerve (Sarı)</option>
                <option value="OCCUPIED">Dolu (Kırmızı)</option>
                <option value="OUT_OF_SERVICE">Kullanım Dışı (Gri)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Rezervasyona Açık / Aktif
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all ${
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                <span>{isActive ? "Aktif (Müşteriler Görebilir)" : "Pasif (Gizli)"}</span>
                <span
                  className={`w-3 h-3 rounded-full ${
                    isActive ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-slate-500"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-[#6246EA] hover:from-indigo-500 hover:to-[#7257ff] text-white px-5 py-2.5 text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? "Değişiklikleri Kaydet" : "Masayı Ekle"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
