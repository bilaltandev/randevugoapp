"use client";

import React, { useState, useRef } from "react";
import { Camera, Check, Circle, Square, RectangleHorizontal, Loader2, Trash2, Plus, Minus } from "lucide-react";
import { RestaurantTable, RestaurantArea, TableShape, TableStatus } from "./types";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Field, Input, Select } from "@/components/ui/Field";
import { choiceClasses } from "@/components/ui/choice";

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

  const SHAPES: { id: TableShape; label: string; icon: typeof Circle }[] = [
    { id: "ROUND", label: "Yuvarlak", icon: Circle },
    { id: "SQUARE", label: "Kare", icon: Square },
    { id: "RECTANGLE", label: "Dikdörtgen", icon: RectangleHorizontal },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Masayı düzenle" : "Yeni masa"} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Masa adı / no *" htmlFor="tbl-name">
            <Input
              id="tbl-name"
              type="text"
              placeholder="Örn: Masa 1, Teras 4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field label="Kişi kapasitesi *" htmlFor="tbl-capacity">
            <div className="flex items-center gap-1.5">
              <Button
                className="w-9 shrink-0 px-0"
                onClick={() => setCapacity(Math.max(1, capacity - 1))}
                aria-label="Kapasiteyi azalt"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                id="tbl-capacity"
                type="number"
                min={1}
                max={30}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                className="text-center tabular-nums"
              />
              <Button className="w-9 shrink-0 px-0" onClick={() => setCapacity(capacity + 1)} aria-label="Kapasiteyi artır">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </Field>
        </div>

        <Field label="Bulunduğu alan" htmlFor="tbl-area">
          <Select id="tbl-area" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">Alansız (genel)</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium text-ink-2">Masa şekli</legend>
          <div className="grid grid-cols-3 gap-2">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={shape === s.id}
                onClick={() => handleShapeChange(s.id)}
                className={choiceClasses(shape === s.id, "flex flex-col items-center gap-1 py-2.5 text-xs font-medium")}
              >
                <s.icon className="h-4 w-4" aria-hidden="true" />
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <Field label="Masa özelliği / açıklama" htmlFor="tbl-desc">
            <Input
              id="tbl-desc"
              type="text"
              placeholder="Örn: Deniz manzaralı, pencere kenarı"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-1">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  if (description.includes(tag)) return;
                  setDescription(description ? `${description}, ${tag}` : tag);
                }}
                className="h-7 rounded-control border border-line bg-surface px-2 text-xs text-ink-2 transition-colors hover:bg-surface-muted"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-ink-2">
            Masa fotoğrafı <span className="font-normal text-ink-3">(isteğe bağlı)</span>
          </p>
          {imageUrl ? (
            <div className="relative h-32 w-full overflow-hidden rounded-control border border-line bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Masa görseli" className="h-full w-full object-cover" />
              <div className="absolute bottom-2 right-2 flex gap-1.5">
                <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                  Değiştir
                </Button>
                <Button size="sm" variant="danger" className="w-8 px-0" onClick={() => setImageUrl("")} aria-label="Fotoğrafı kaldır">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
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
              className="flex cursor-pointer flex-col items-center gap-1 rounded-control border border-dashed border-line-strong p-4 text-center transition-colors hover:bg-surface-muted"
            >
              {uploading ? (
                <span className="flex items-center gap-2 text-sm text-ink-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Görsel yükleniyor...
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Camera className="h-4 w-4 text-ink-3" aria-hidden="true" />
                    Fotoğraf yüklemek için tıklayın
                  </span>
                  <span className="text-xs text-ink-3">Manzara, bahçe, pencere kenarı gibi masadan kareler</span>
                </>
              )}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <Field label="Masa durumu" htmlFor="tbl-status">
            <Select id="tbl-status" value={status} onChange={(e) => setStatus(e.target.value as TableStatus)}>
              <option value="AVAILABLE">Müsait</option>
              <option value="RESERVED">Rezerve</option>
              <option value="OCCUPIED">Dolu</option>
              <option value="OUT_OF_SERVICE">Kullanım dışı</option>
            </Select>
          </Field>

          <div className="space-y-1.5">
            <p id="tbl-active-label" className="text-sm font-medium text-ink-2">
              Rezervasyona açık
            </p>
            <div className="flex h-9 items-center justify-between rounded-control border border-line px-3">
              <span className="text-sm text-ink-2">{isActive ? "Müşteriler görebilir" : "Gizli"}</span>
              <Switch checked={isActive} onChange={setIsActive} aria-labelledby="tbl-active-label" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" variant="primary" disabled={saving || uploading}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                {isEditing ? "Değişiklikleri kaydet" : "Masayı ekle"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
