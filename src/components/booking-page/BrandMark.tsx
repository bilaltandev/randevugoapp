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
 * The owner's logo with the look they chose: bare, or in a circle or square, at their width, with optional
 * text beside it. `limit` caps the height so a wide setting can't break a top bar.
 */
export function BrandMark({
  logo,
  name,
  style: s,
  limit,
  showName,
  nameClassName,
}: {
  logo?: string | null;
  name: string;
  style: LogoStyle;
  limit: number;
  /** Top bars fall back to the business name when there is no custom text. */
  showName?: boolean;
  nameClassName?: string;
}) {
  const custom = s.text?.trim();
  const framed = s.shape !== "none";
  const width = framed ? Math.min(s.width, limit) : Math.min(s.width, limit * 3.5);
  const fontSize = Math.min(s.textSize ?? 24, limit * 0.6);

  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center", !showName && "flex-wrap")} style={{ gap: s.textGap ?? 12 }}>
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
            // In a top bar the logo leaves room for the text beside it.
            maxWidth: showName ? "60%" : "100%",
            ...(framed ? { height: width } : { height: "auto", maxHeight: limit }),
            objectFit: s.fit,
          }}
        />
      )}
      {custom ? (
        <span
          className={cn("leading-tight", showName && "truncate")}
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
        showName && !s.hideName && <span className={cn("truncate", nameClassName)}>{name}</span>
      )}
    </span>
  );
}
