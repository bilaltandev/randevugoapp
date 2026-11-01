import React from "react";
import { cn } from "@/lib/utils";
import type { LogoStyle } from "@/lib/themes/types";

export const DEFAULT_LOGO_STYLE: LogoStyle = { shape: "none", fit: "contain", width: 120, textGap: 12, textSize: 24, textFont: "theme" };

const FONTS: Record<NonNullable<LogoStyle["textFont"]>, string> = {
  theme: "var(--bk-heading, inherit)",
  manrope: "var(--font-manrope), system-ui, sans-serif",
  geist: "var(--font-geist-sans), system-ui, sans-serif",
  playfair: "var(--font-playfair), Georgia, serif",
  cormorant: "var(--font-cormorant), Georgia, serif",
};

/**
 * The top bar's logo with the look the owner chose: bare, or in a circle or square, at their width, with
 * optional text beside it. Empty text means the logo stands alone; the name shows only when there is no logo.
 */
/** Tallest the mark may be inside a top bar. */
export const BRAND_MARK_LIMIT = 52;

export function BrandMark({
  logo,
  name,
  style: s,
  nameClassName,
}: {
  logo?: string | null;
  name: string;
  style: LogoStyle;
  nameClassName?: string;
}) {
  const custom = s.text?.trim();
  const framed = s.shape !== "none";
  const width = framed ? Math.min(s.width, BRAND_MARK_LIMIT) : Math.min(s.width, BRAND_MARK_LIMIT * 3.5);
  const fontSize = Math.min(s.textSize ?? 24, BRAND_MARK_LIMIT * 0.6);

  return (
    <span className="inline-flex min-w-0 max-w-full items-center" style={{ gap: s.textGap ?? 12 }}>
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          className={cn(
            "block shrink-0",
            framed && "bg-white",
            framed && s.fit === "contain" && "p-[6%]",
            s.shape === "circle" && "rounded-full",
            s.shape === "square" && "rounded-(--bk-r-ctl)"
          )}
          style={{
            width,
            // The logo leaves room for the text beside it.
            maxWidth: custom ? "60%" : "100%",
            ...(framed ? { height: width } : { height: "auto", maxHeight: BRAND_MARK_LIMIT }),
            objectFit: s.fit,
          }}
        />
      )}
      {custom ? (
        <span
          className="truncate leading-tight"
          style={{
            color: s.textColor || undefined,
            fontFamily: FONTS[s.textFont ?? "theme"],
            fontSize,
            fontWeight: s.bold ? 700 : 500,
            fontStyle: s.italic ? "italic" : undefined,
            textTransform: s.uppercase ? "uppercase" : undefined,
          }}
        >
          {custom}
        </span>
      ) : (
        !logo && <span className={cn("truncate", nameClassName)}>{name}</span>
      )}
    </span>
  );
}
