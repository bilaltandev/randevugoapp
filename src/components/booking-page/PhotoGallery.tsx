"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "./ui";

export interface Photo {
  src: string;
  alt: string;
  caption?: string | null;
}

export type MosaicVariant = "mosaic" | "banner" | "compact";

/**
 * Photos at the top of the page. Phones always get a swipeable strip; larger screens
 * follow the theme: a 1+4 mosaic, a full-bleed banner, or a compact grid for split layouts.
 */
export function PhotoMosaic({
  photos,
  onOpen,
  variant = "mosaic",
}: {
  photos: Photo[];
  onOpen: (index: number) => void;
  variant?: MosaicVariant;
}) {
  return (
    <>
      <PhoneStrip photos={photos} onOpen={onOpen} />
      {variant === "banner" ? (
        <BannerPhoto photos={photos} onOpen={onOpen} />
      ) : variant === "compact" ? (
        <div className="hidden sm:block">
          <TileGrid photos={photos.slice(0, 4)} total={photos.length} onOpen={onOpen} compact />
          <AllPhotosLink count={photos.length} onOpen={onOpen} />
        </div>
      ) : (
        <div className="mx-auto hidden max-w-6xl px-6 pt-6 sm:block">
          <TileGrid photos={photos.slice(0, 5)} total={photos.length} onOpen={onOpen} />
          <AllPhotosLink count={photos.length} onOpen={onOpen} />
        </div>
      )}
    </>
  );
}

function PhoneStrip({ photos, onOpen }: { photos: Photo[]; onOpen: (index: number) => void }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const onStripScroll = () => {
    const el = stripRef.current;
    if (el) setCurrent(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="relative sm:hidden">
      <div
        ref={stripRef}
        onScroll={onStripScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((p, i) => (
          <button
            key={p.src + i}
            type="button"
            onClick={() => onOpen(i)}
            className="aspect-[4/3] w-full shrink-0 snap-center bg-surface-muted"
            aria-label={`Fotoğraf ${i + 1} / ${photos.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.alt} className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
          </button>
        ))}
      </div>
      {photos.length > 1 && (
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium tabular-nums text-white">
          {current + 1} / {photos.length}
        </span>
      )}
    </div>
  );
}

/** 1 large + smaller tiles on a 4×2 grid (or 2×2 when compact). */
function TileGrid({
  photos,
  total,
  onOpen,
  compact,
}: {
  photos: Photo[];
  total: number;
  onOpen: (index: number) => void;
  compact?: boolean;
}) {
  const n = photos.length;
  const extra = total - n;

  if (n === 1) {
    return (
      <button
        type="button"
        onClick={() => onOpen(0)}
        className={cn(
          "block w-full overflow-hidden rounded-(--bk-r-card) bg-surface-muted",
          compact ? "aspect-[4/3]" : "h-[340px]",
          focusRing
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0].src} alt={photos[0].alt} className="h-full w-full object-cover" />
      </button>
    );
  }

  const span = (i: number) => {
    if (compact) {
      if (n === 2) return "col-span-1 row-span-2";
      if (n === 3) return i === 0 ? "col-span-2 row-span-1" : "col-span-1 row-span-1";
      return "col-span-1 row-span-1";
    }
    if (i === 0) return n === 2 ? "col-span-3 row-span-2" : "col-span-2 row-span-2";
    if (n === 2) return "col-span-1 row-span-2";
    if (n === 3) return "col-span-2 row-span-1";
    if (n === 4) return i === 1 ? "col-span-2 row-span-1" : "col-span-1 row-span-1";
    return "col-span-1 row-span-1";
  };

  return (
    <div
      className={cn(
        "grid grid-rows-2 gap-2 overflow-hidden rounded-(--bk-r-card)",
        compact ? "aspect-[4/3] grid-cols-2" : "h-[360px] grid-cols-4"
      )}
    >
      {photos.map((p, i) => (
        <button
          key={p.src + i}
          type="button"
          onClick={() => onOpen(i)}
          className={cn("group relative overflow-hidden bg-surface-muted", span(i), focusRing)}
          aria-label={`Fotoğrafı büyüt: ${p.alt}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.src} alt={p.alt} className="h-full w-full object-cover transition-opacity group-hover:opacity-90" />
          {i === n - 1 && extra > 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white">
              +{extra} fotoğraf
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Edge-to-edge cover photo. */
function BannerPhoto({ photos, onOpen }: { photos: Photo[]; onOpen: (index: number) => void }) {
  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => onOpen(0)}
        className={cn("block h-[300px] w-full overflow-hidden bg-surface-muted md:h-[420px]", focusRing)}
        aria-label="Fotoğrafları görüntüle"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0].src} alt={photos[0].alt} className="h-full w-full object-cover" />
      </button>
      {photos.length > 1 && (
        <button
          type="button"
          onClick={() => onOpen(0)}
          className="absolute bottom-4 right-6 inline-flex items-center gap-1.5 rounded-(--bk-r-btn) bg-black/65 px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white"
        >
          <Images className="h-4 w-4" aria-hidden="true" />
          Tüm fotoğraflar ({photos.length})
        </button>
      )}
    </div>
  );
}

function AllPhotosLink({ count, onOpen }: { count: number; onOpen: (index: number) => void }) {
  if (count < 2) return null;
  return (
    <div className="mt-2 flex justify-end">
      <button
        type="button"
        onClick={() => onOpen(0)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-ink-2 hover:bg-surface-muted hover:text-ink",
          focusRing
        )}
      >
        <Images className="h-4 w-4" aria-hidden="true" />
        Tüm fotoğraflar ({count})
      </button>
    </div>
  );
}

/** Grid of all photos, used lower on the page by the minimal layout. */
export function PhotoGridSection({ photos, onOpen }: { photos: Photo[]; onOpen: (index: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {photos.slice(0, 9).map((p, i) => (
        <button
          key={p.src + i}
          type="button"
          onClick={() => onOpen(i)}
          className={cn("relative aspect-square overflow-hidden rounded-(--bk-r-ctl) bg-surface-muted", focusRing)}
          aria-label={`Fotoğrafı büyüt: ${p.alt}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.src} alt={p.alt} className="h-full w-full object-cover" loading="lazy" />
          {i === 8 && photos.length > 9 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white">
              +{photos.length - 9}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Full-screen photo viewer with keyboard support. */
export function Lightbox({ photos, index, onClose }: { photos: Photo[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prev = useCallback(() => setI((v) => (v - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setI((v) => (v + 1) % photos.length), [photos.length]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, prev, next]);

  const photo = photos[i];
  const ctrl = "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Fotoğraflar">
      <div className="flex items-center justify-between p-3 text-sm text-white/80">
        <span className="tabular-nums">
          {i + 1} / {photos.length}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} className={ctrl} aria-label="Kapat">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-3 sm:px-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.alt} className="max-h-full max-w-full rounded-(--bk-r-ctl) object-contain" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={prev} className={cn(ctrl, "absolute left-3 top-1/2 -translate-y-1/2")} aria-label="Önceki">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={next} className={cn(ctrl, "absolute right-3 top-1/2 -translate-y-1/2")} aria-label="Sonraki">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {photo.caption && <p className="px-4 pb-5 text-center text-sm text-white/80">{photo.caption}</p>}
    </div>
  );
}
