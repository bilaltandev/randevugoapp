import React from "react";
import { MapPin, MessageSquare, Navigation, Phone, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, headingCls, Initial } from "./ui";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export interface StorefrontProps {
  name: string;
  logo?: string | null;
  showLogo: boolean;
  hasPhotos: boolean;
  categoryLine: string[];
  verified?: boolean;
  description?: string | null;
  rating: { average: number; count: number } | null;
  openStatus: { open: boolean; label: string } | null;
  address?: string | null;
  badges: string[];
  contact: {
    phone?: string | null;
    whatsappUrl?: string | null;
    instagramUrl?: string | null;
    mapsUrl?: string | null;
  };
  /** Theme layout: centered stacks the logo above a centered header. */
  align?: "left" | "center";
  /** Render without the page container (used inside the split hero). */
  bare?: boolean;
}

/** Business identity block: name, category, rating, today's status and contact shortcuts. */
export function Storefront({
  name,
  logo,
  showLogo,
  hasPhotos,
  categoryLine,
  verified,
  description,
  rating,
  openStatus,
  address,
  badges,
  contact,
  align = "left",
  bare = false,
}: StorefrontProps) {
  const showMark = showLogo && (logo || !hasPhotos);
  const center = align === "center";

  return (
    <section
      aria-labelledby="business-name"
      className={cn(
        !bare && "mx-auto max-w-6xl px-4 sm:px-6",
        !bare && (hasPhotos ? "pt-5 sm:pt-8" : "pt-8 sm:pt-12"),
        center && "text-center"
      )}
    >
      <div className={cn("flex items-start gap-4", center && "flex-col items-center gap-3")}>
        {showMark &&
          (logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              className="h-14 w-14 shrink-0 rounded-(--bk-r-card) border border-line bg-surface object-contain p-1 sm:h-16 sm:w-16"
            />
          ) : (
            <Initial name={name} className="h-14 w-14 shrink-0 rounded-(--bk-r-card) border border-line text-xl sm:h-16 sm:w-16" />
          ))}

        <div className="min-w-0 flex-1">
          <h1 id="business-name" className={cn(headingCls, "text-2xl leading-tight text-ink sm:text-[30px]")}>
            {name}
          </h1>
          {(categoryLine.length > 0 || verified) && (
            <p className={cn("mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-ink-2", center && "justify-center")}>
              {categoryLine.join(" · ")}
              {verified && (
                <span className="inline-flex items-center gap-1 text-brand-ink">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Doğrulanmış
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Key facts */}
      <ul
        className={cn(
          "mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5",
          center && "items-center sm:justify-center"
        )}
      >
        {rating && (
          <li>
            <a href="#yorumlar" className="inline-flex items-center gap-1.5 text-ink hover:underline">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span className="font-semibold">{rating.average.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
              <span className="text-ink-3">({rating.count} değerlendirme)</span>
            </a>
          </li>
        )}
        {openStatus && (
          <li className="inline-flex items-center gap-2 text-ink-2">
            <span
              className={cn("h-2 w-2 rounded-full", openStatus.open ? "bg-emerald-500" : "bg-ink-3")}
              aria-hidden="true"
            />
            <span className={openStatus.open ? "font-medium text-ink" : undefined}>{openStatus.label}</span>
          </li>
        )}
        {address && (
          <li className="flex min-w-0 items-start gap-2 text-ink-2 sm:items-center">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-3 sm:mt-0" aria-hidden="true" />
            <span className="min-w-0 sm:max-w-md sm:truncate">{address}</span>
          </li>
        )}
      </ul>

      {badges.length > 0 && (
        <p className={cn("mt-3 flex flex-wrap gap-1.5", center && "justify-center")}>
          {badges.map((b) => (
            <span key={b} className="rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-ink-2">
              {b}
            </span>
          ))}
        </p>
      )}

      {description && <p className={cn("mt-3 line-clamp-3 max-w-2xl text-[15px] leading-relaxed text-ink-2", center && "mx-auto")}>{description}</p>}

      {(contact.phone || contact.whatsappUrl || contact.instagramUrl || contact.mapsUrl) && (
        <div
          className={cn(
            "-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0",
            center && "sm:justify-center"
          )}
        >
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className={btn("secondary", "sm")}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              Ara
            </a>
          )}
          {contact.whatsappUrl && (
            <a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className={btn("secondary", "sm")}>
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          )}
          {contact.mapsUrl && (
            <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer" className={btn("secondary", "sm")}>
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Yol tarifi
            </a>
          )}
          {contact.instagramUrl && (
            <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer" className={btn("secondary", "sm")}>
              <InstagramIcon className="h-4 w-4" />
              Instagram
            </a>
          )}
        </div>
      )}
    </section>
  );
}
