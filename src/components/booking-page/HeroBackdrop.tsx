import React from "react";
import type { CSSProperties } from "react";

/**
 * Text on a photo or a strong color reads as white on dark, whatever the theme.
 * The page paints with --rg-* tokens, so re-pointing them here recolors the
 * storefront header inside the backdrop without touching its markup.
 */
const ON_MEDIA_TOKENS = {
  "--rg-ink": "#FFFFFF",
  "--rg-ink-2": "rgba(255, 255, 255, 0.88)",
  "--rg-ink-3": "rgba(255, 255, 255, 0.74)",
  "--rg-surface": "rgba(255, 255, 255, 0.12)",
  "--rg-surface-muted": "rgba(255, 255, 255, 0.2)",
  "--rg-line": "rgba(255, 255, 255, 0.3)",
  "--rg-line-strong": "rgba(255, 255, 255, 0.45)",
  "--rg-brand-ink": "#FFFFFF",
  colorScheme: "dark",
} as CSSProperties;

interface HeroBackdropProps {
  /** Photo behind the header; wins over `color`. */
  image?: string | null;
  /** Solid backdrop (theme accent) when the owner picked "Renk". */
  color?: string | null;
  children: React.ReactNode;
}

/** Full-width backdrop behind the business header (Sayfa Düzenleyici → Hero → Arka plan). */
export function HeroBackdrop({ image, color, children }: HeroBackdropProps) {
  return (
    <div
      className="relative isolate overflow-hidden pb-8 sm:pb-12"
      style={{ ...ON_MEDIA_TOKENS, backgroundColor: color || "#0B0F19" }}
    >
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          {/* Darker at the bottom where the text and buttons sit. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/60 to-black/40" aria-hidden="true" />
        </>
      ) : (
        // Keeps white text readable on light accents (gold, pastel) too.
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black/15 to-black/45" aria-hidden="true" />
      )}
      {children}
    </div>
  );
}
