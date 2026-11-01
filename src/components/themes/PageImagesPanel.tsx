"use client";

import React, { useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { CoverImagePicker } from "@/components/page-builder/CoverImagePicker";
import type { ThemeConfig, ThemeOverrides } from "@/lib/themes/types";

type Target = { kind: "cover" } | { kind: "side" } | { kind: "service"; id: string } | { kind: "employee"; id: string };

interface PageImagesPanelProps {
  business: any;
  theme: ThemeConfig;
  themeOverrides: ThemeOverrides | null;
  galleryItems: any[];
  onUpdateOverrides: (next: ThemeOverrides) => Promise<void>;
  onBusinessChange: (update: (prev: any) => any) => void;
  onOpenGallery: () => void;
}

function Slot({
  label,
  hint,
  src,
  busy,
  onChange,
  onRemove,
  removeLabel = "Kaldır",
}: {
  label: string;
  hint?: string;
  src?: string | null;
  busy?: boolean;
  onChange: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <li className="overflow-hidden rounded-control border border-line bg-surface">
      <div className="relative aspect-[4/3] bg-surface-muted">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-ink-3">
            <ImageIcon className="h-6 w-6" aria-hidden="true" />
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-medium text-ink">{label}</p>
        {hint && <p className="truncate text-xs text-ink-3">{hint}</p>}
        <div className="mt-2 flex gap-1.5">
          <Button size="sm" className="flex-1" onClick={onChange} disabled={busy} aria-label={`${label}: görseli değiştir`}>
            Değiştir
          </Button>
          {onRemove && (
            <Button size="sm" variant="ghost" onClick={onRemove} disabled={busy} aria-label={`${label}: ${removeLabel}`}>
              {removeLabel}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

/** Every photo on the booking page in one place, each changed on its own and saved at once. */
export function PageImagesPanel({
  business,
  theme,
  themeOverrides,
  galleryItems,
  onUpdateOverrides,
  onBusinessChange,
  onOpenGallery,
}: PageImagesPanelProps) {
  const [target, setTarget] = useState<Target | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const services: any[] = business.services || [];
  const employees: any[] = business.employees || [];
  const ownCover = themeOverrides?.coverImage || business.coverImage || null;
  const cover = themeOverrides?.heroBgType === "color" ? null : ownCover || theme.sampleImage || null;

  const keyOf = (t: Target) => ("id" in t ? `${t.kind}-${t.id}` : t.kind);
  const currentOf = (t: Target) => {
    if (t.kind === "cover") return cover ?? "";
    if (t.kind === "side") return themeOverrides?.sideImage ?? "";
    if (t.kind === "service") return services.find((s) => s.id === t.id)?.image ?? "";
    return employees.find((e) => e.id === t.id)?.photo ?? "";
  };

  const saveRecord = async (path: string, listKey: "services" | "employees", field: "image" | "photo", id: string, url: string | null) => {
    const res = await fetch(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: url }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error);
    onBusinessChange((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] || []).map((item: any) => (item.id === id ? { ...item, [field]: url } : item)),
    }));
  };

  const apply = async (t: Target, url: string | null) => {
    setBusyKey(keyOf(t));
    setError("");
    try {
      if (t.kind === "cover") {
        await onUpdateOverrides({ ...(themeOverrides || {}), coverImage: url ?? undefined, heroBgType: "image" });
      } else if (t.kind === "side") {
        await onUpdateOverrides({ ...(themeOverrides || {}), sideImage: url ?? undefined });
      } else if (t.kind === "service") {
        await saveRecord("/api/services", "services", "image", t.id, url);
      } else {
        await saveRecord("/api/employees", "employees", "photo", t.id, url);
      }
    } catch (e) {
      setError((e as Error).message || "Görsel kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Panel
      title="Sayfa görselleri"
      description="Rezervasyon sayfanızdaki fotoğrafları tek tek değiştirin. Seçiminiz hemen kaydedilir."
      action={
        <Button size="sm" variant="ghost" onClick={onOpenGallery}>
          Galeriyi düzenle ({galleryItems.length})
        </Button>
      }
    >
      <div className="space-y-5">
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}

        <section>
          <h3 className="mb-2 text-sm font-medium text-ink-2">Ana görseller</h3>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            <Slot
              label="Kapak görseli"
              hint={ownCover ? "Sayfanın en üstü" : cover ? "Örnek görsel" : "Düz renk seçili"}
              src={cover}
              busy={busyKey === "cover"}
              onChange={() => setTarget({ kind: "cover" })}
              onRemove={themeOverrides?.coverImage ? () => apply({ kind: "cover" }, null) : undefined}
              removeLabel={theme.sampleImage ? "Örneğe dön" : "Kaldır"}
            />
            {theme.signature === "porcelain" && (
              <Slot
                label="Yuvarlak görsel"
                hint={themeOverrides?.sideImage ? "Kapağın yanında" : "Galerinin ilk fotoğrafı kullanılır"}
                src={themeOverrides?.sideImage || galleryItems[0]?.imageUrl}
                busy={busyKey === "side"}
                onChange={() => setTarget({ kind: "side" })}
                onRemove={themeOverrides?.sideImage ? () => apply({ kind: "side" }, null) : undefined}
              />
            )}
          </ul>
        </section>

        {services.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-medium text-ink-2">Hizmet görselleri</h3>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {services.map((s) => (
                <Slot
                  key={s.id}
                  label={s.name}
                  src={s.image}
                  busy={busyKey === `service-${s.id}`}
                  onChange={() => setTarget({ kind: "service", id: s.id })}
                  onRemove={s.image ? () => apply({ kind: "service", id: s.id }, null) : undefined}
                />
              ))}
            </ul>
          </section>
        )}

        {employees.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-medium text-ink-2">Ekip fotoğrafları</h3>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {employees.map((e) => (
                <Slot
                  key={e.id}
                  label={e.name}
                  src={e.photo}
                  busy={busyKey === `employee-${e.id}`}
                  onChange={() => setTarget({ kind: "employee", id: e.id })}
                  onRemove={e.photo ? () => apply({ kind: "employee", id: e.id }, null) : undefined}
                />
              ))}
            </ul>
          </section>
        )}
      </div>

      <CoverImagePicker
        isOpen={target !== null}
        onClose={() => setTarget(null)}
        title="Görsel seç"
        current={target ? currentOf(target) : ""}
        galleryItems={galleryItems}
        onSelect={(url) => {
          if (target) void apply(target, url);
        }}
      />
    </Panel>
  );
}
