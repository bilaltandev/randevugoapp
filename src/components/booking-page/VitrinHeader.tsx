import React from "react";
import { MessageSquare, Navigation, Phone, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, focusRing, headingCls, Initial } from "./ui";
import { formatPrice } from "./time";
import { InstagramIcon, formatRating } from "./layouts/shared";

/**
 * Vitrin's opening: a business profile like in a booking app. A wide rounded cover,
 * the logo tile sitting on its lower edge, a large name in the theme's heading face,
 * and one row of facts a visitor checks before booking.
 */
interface VitrinHeaderProps {
  name: string;
  logo?: string | null;
  showLogo: boolean;
  /** Cover photo, or null for the accent panel ("Tema rengi" or no photo yet). */
  coverImage: string | null;
  categoryLine: string[];
  verified?: boolean;
  description?: string | null;
  badges: string[];
  rating: { average: number; count: number } | null;
  openStatus: { open: boolean; label: string } | null;
  address?: string | null;
  serviceCount: number;
  lowestPrice: number | null;
  contact: {
    phone?: string | null;
    whatsappUrl?: string | null;
    instagramUrl?: string | null;
    mapsUrl?: string | null;
  };
  canBook: boolean;
}

export function VitrinHeader(p: VitrinHeaderProps) {
  const facts = [
    p.rating && {
      label: "Puan",
      value: (
        <a href="#yorumlar" className={cn("inline-flex items-center gap-1.5 hover:underline", focusRing)}>
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span className="font-semibold">{formatRating(p.rating.average)}</span>
          <span className="text-ink-3">({p.rating.count})</span>
        </a>
      ),
    },
    p.openStatus && {
      label: "Bugün",
      value: (
        <span className="inline-flex items-center gap-2">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", p.openStatus.open ? "bg-emerald-500" : "bg-ink-3")} aria-hidden="true" />
          {p.openStatus.label}
        </span>
      ),
    },
    p.serviceCount > 0 && {
      label: "Hizmetler",
      value: (
        <a href="#hizmetler" className={cn("hover:underline", focusRing)}>
          {p.serviceCount} hizmet
          {p.lowestPrice !== null && p.lowestPrice > 0 && (
            <span className="text-ink-3">, {formatPrice(p.lowestPrice)}&apos;den başlayan</span>
          )}
        </a>
      ),
    },
    p.address && {
      label: "Adres",
      value: p.contact.mapsUrl ? (
        <a href={p.contact.mapsUrl} target="_blank" rel="noopener noreferrer" className={cn("line-clamp-2 hover:underline", focusRing)}>
          {p.address}
        </a>
      ) : (
        <span className="line-clamp-2">{p.address}</span>
      ),
    },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[];

  const showMark = p.showLogo;

  return (
    <section aria-labelledby="business-name" className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
      {/* Cover */}
      <div
        className={cn(
          "relative overflow-hidden rounded-(--bk-r-card)",
          p.coverImage ? "aspect-[16/9] sm:aspect-[3/1]" : "h-28 sm:h-40"
        )}
      >
        {p.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-brand" aria-hidden="true">
            <div className="h-full w-full bg-gradient-to-br from-black/0 via-black/10 to-black/35" />
          </div>
        )}
      </div>

      {/* Identity */}
      {/* Only the logo tile overlaps the cover; the name always sits on the page color so it stays readable. */}
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className={cn("flex min-w-0 flex-col gap-3", showMark && "sm:flex-row sm:items-start sm:gap-5")}>
          {showMark &&
            (p.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.logo}
                alt=""
                className="relative -mt-10 h-20 w-20 shrink-0 rounded-(--bk-r-card) border-4 border-canvas bg-surface object-contain p-1.5 shadow-sm sm:-mt-12 sm:h-24 sm:w-24"
              />
            ) : (
              <Initial
                name={p.name}
                className="relative -mt-10 h-20 w-20 shrink-0 rounded-(--bk-r-card) border-4 border-canvas text-3xl text-ink sm:-mt-12 sm:h-24 sm:w-24"
              />
            ))}
          <div className={cn("min-w-0", showMark ? "sm:pt-4" : "pt-6")}>
            <h1 id="business-name" className={cn(headingCls, "text-[clamp(1.875rem,4.2vw,3rem)] leading-[1.05] text-ink [text-wrap:balance]")}>
              {p.name}
            </h1>
            {(p.categoryLine.length > 0 || p.verified) && (
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-ink-2">
                {p.categoryLine.length > 0 && <span>{p.categoryLine.join(", ")}</span>}
                {p.verified && (
                  <span className="inline-flex items-center gap-1 text-brand-ink">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Doğrulanmış işletme
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className={cn("flex shrink-0 flex-wrap gap-2", showMark ? "sm:pt-4" : "sm:pt-6")}>
          {p.canBook && (
            <a href="#hizmetler" className={btn("primary", "lg", "px-6")}>
              Randevu al
            </a>
          )}
          {p.contact.phone && (
            <a href={`tel:${p.contact.phone}`} className={btn("secondary", "lg", "w-12 px-0")} aria-label="Ara" title="Ara">
              <Phone className="h-5 w-5" aria-hidden="true" />
            </a>
          )}
          {p.contact.whatsappUrl && (
            <a
              href={p.contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={btn("secondary", "lg", "w-12 px-0")}
              aria-label="WhatsApp ile yaz"
              title="WhatsApp"
            >
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
            </a>
          )}
          {p.contact.mapsUrl && (
            <a
              href={p.contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={btn("secondary", "lg", "w-12 px-0")}
              aria-label="Yol tarifi al"
              title="Yol tarifi"
            >
              <Navigation className="h-5 w-5" aria-hidden="true" />
            </a>
          )}
          {p.contact.instagramUrl && (
            <a
              href={p.contact.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={btn("secondary", "lg", "w-12 px-0")}
              aria-label="Instagram"
              title="Instagram"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>

      {(p.description || p.badges.length > 0) && (
        <div className="mt-5 max-w-3xl">
          {p.description && <p className="line-clamp-4 text-base leading-relaxed text-ink-2">{p.description}</p>}
          {p.badges.length > 0 && (
            <p className="mt-3 flex flex-wrap gap-1.5">
              {p.badges.map((b) => (
                <span key={b} className="rounded-(--bk-r-pill) border border-line px-2.5 py-1 text-xs font-medium text-ink-2">
                  {b}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {/* Facts a visitor checks before booking */}
      {facts.length > 0 && (
        // Hairlines come from the 1px gap over a line-colored grid; column counts always divide evenly.
        <dl
          className={cn(
            "mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-(--bk-r-card) border border-line bg-line",
            facts.length === 2 && "sm:grid-cols-2",
            facts.length === 3 && "sm:grid-cols-3",
            facts.length === 4 && "sm:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {facts.map((f) => (
            <div key={f.label} className="min-w-0 bg-surface px-4 py-3.5 sm:px-5">
              <dt className="text-xs font-medium text-ink-3">{f.label}</dt>
              <dd className="mt-1 text-sm text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
