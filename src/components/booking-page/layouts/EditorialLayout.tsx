"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing, Stars } from "../ui";
import { formatDuration, formatPrice } from "../time";
import { featuredReviews, groupServices, type StorefrontLayoutProps } from "./types";
import { formatRating, InstagramIcon, WeekHours } from "./shared";

/**
 * Editoryal: a fashion-magazine page. The one bold move is the type — a very large
 * Cormorant name and a price list set like a printed menu. Everything else stays
 * quiet: hairlines, no card chrome, square photos, lots of space.
 */
const display = "font-[family-name:var(--font-cormorant)] font-medium";
const shell = "mx-auto w-full max-w-[1240px] px-5 @3xl:px-10";
const textLink = cn(
  "underline decoration-line-strong decoration-1 underline-offset-[6px] transition-colors hover:decoration-brand hover:text-ink",
  focusRing
);

export function EditorialLayout(p: StorefrontLayoutProps) {
  const groups = groupServices(p.services);
  const quotes = featuredReviews(p.reviews);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const quote = quotes[quoteIndex];
  const lead = p.heroImage ?? p.photos[0]?.src ?? null;

  const nav = [
    { id: "hizmetler", label: p.isRestaurant ? "Menü" : "Hizmetler", show: true },
    { id: "ekip", label: "Ekip", show: p.employees.length > 0 },
    { id: "galeri", label: "Galeri", show: p.photos.length > 0 },
    { id: "yorumlar", label: "Yorumlar", show: p.reviews.length > 0 },
    { id: "iletisim", label: "İletişim", show: true },
  ].filter((n) => n.show);

  const contactLinks = [
    p.contact.phone && { href: `tel:${p.contact.phone}`, label: "Ara" },
    p.contact.whatsappUrl && { href: p.contact.whatsappUrl, label: "WhatsApp", external: true },
    p.contact.mapsUrl && { href: p.contact.mapsUrl, label: "Yol tarifi", external: true },
    p.contact.instagramUrl && { href: p.contact.instagramUrl, label: "Instagram", external: true },
  ].filter(Boolean) as { href: string; label: string; external?: boolean }[];

  return (
    <div className="@container">
      {/* ── Masthead ── */}
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className={cn(shell, "flex h-16 items-center gap-6")}>
          <a href="#ust" className={cn("flex min-w-0 items-center gap-3", focusRing)}>
            {p.showLogo && p.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo} alt="" className="h-8 w-8 shrink-0 object-contain" />
            )}
            <span className={cn(display, "truncate text-2xl leading-none text-ink")}>{p.name}</span>
          </a>
          <nav aria-label="Sayfa bölümleri" className="ml-auto hidden items-center gap-7 text-sm text-ink-2 @4xl:flex">
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} className={cn("transition-colors hover:text-ink", focusRing)}>
                {n.label}
              </a>
            ))}
          </nav>
          {!p.bookingClosed && p.services.length > 0 && (
            <a
              href="#hizmetler"
              className={cn(
                "ml-auto inline-flex h-10 shrink-0 items-center bg-brand px-5 text-sm font-medium text-(color:--bk-on-brand) transition-colors hover:bg-brand-hover @4xl:ml-0",
                focusRing
              )}
            >
              Randevu al
            </a>
          )}
        </div>
      </header>

      {/* ── Opening spread ── */}
      <section id="ust" className={cn(shell, "grid gap-10 pb-20 pt-8 @4xl:grid-cols-12 @4xl:gap-12 @4xl:pb-28 @4xl:pt-16")}>
        <div className="@4xl:order-2 @4xl:col-span-5">
          {p.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.heroImage} alt={p.name} className="aspect-[4/5] w-full object-cover" />
          ) : lead ? (
            // No hero photo chosen: lead with the first gallery photo.
            <button
              type="button"
              onClick={() => p.onOpenPhoto(0)}
              className={cn("block w-full cursor-zoom-in", focusRing)}
              aria-label="Fotoğrafı büyüt"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lead} alt={p.name} className="aspect-[4/5] w-full object-cover" />
            </button>
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center bg-surface-muted" aria-hidden="true">
              <span className={cn(display, "text-[clamp(8rem,30cqi,16rem)] leading-none text-ink-3")}>
                {p.name.trim().charAt(0).toLocaleUpperCase("tr-TR")}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end @4xl:col-span-7">
          {p.categoryLine.length > 0 && <p className="text-sm text-ink-3">{p.categoryLine.join(", ")}</p>}
          <h1
            id="business-name"
            className={cn(display, "mt-4 text-[clamp(3.25rem,10cqi,8rem)] leading-[0.9] tracking-[-0.02em] text-ink [text-wrap:balance]")}
          >
            {p.name}
          </h1>
          {p.description && (
            <p className="mt-8 max-w-[44ch] text-lg leading-relaxed text-ink-2">{p.description}</p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            {!p.bookingClosed && p.services.length > 0 && (
              <a
                href="#hizmetler"
                className={cn(
                  "inline-flex h-12 items-center bg-brand px-7 text-[15px] font-medium text-(color:--bk-on-brand) transition-colors hover:bg-brand-hover",
                  focusRing
                )}
              >
                Randevu al
              </a>
            )}
            {contactLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={cn("text-[15px] text-ink-2", textLink)}
              >
                {l.label}
              </a>
            ))}
          </div>

          {(p.reviews.length > 0 || p.openStatus || p.badges.length > 0) && (
            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-6 text-sm @xl:grid-cols-3">
              {p.reviews.length > 0 && (
                <div>
                  <dt className="text-ink-3">Değerlendirme</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-ink">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    <a href="#yorumlar" className={cn("hover:underline", focusRing)}>
                      {formatRating(p.ratingAverage)} ({p.reviews.length})
                    </a>
                  </dd>
                </div>
              )}
              {p.openStatus && (
                <div>
                  <dt className="text-ink-3">Bugün</dt>
                  <dd className={cn("mt-1", p.openStatus.open ? "text-ink" : "text-ink-2")}>{p.openStatus.label}</dd>
                </div>
              )}
              {p.badges.length > 0 && (
                <div>
                  <dt className="text-ink-3">Öne çıkan</dt>
                  <dd className="mt-1 text-ink">{p.badges.join(", ")}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </section>

      {/* ── Price list ── */}
      <section id="hizmetler" aria-labelledby="hizmetler-baslik" className="scroll-mt-16 border-t border-line">
        <div className={cn(shell, "grid gap-10 py-20 @4xl:grid-cols-12 @4xl:gap-12 @4xl:py-28")}>
          <div className="@4xl:col-span-4">
            <div className="@4xl:sticky @4xl:top-28">
              <h2 id="hizmetler-baslik" className={cn(display, "text-5xl leading-none text-ink @3xl:text-6xl")}>
                {p.isRestaurant ? "Menü" : "Hizmetler"}
              </h2>
              <p className="mt-5 max-w-[32ch] text-[15px] leading-relaxed text-ink-3">
                {p.bookingClosed
                  ? "Online randevu şu an kapalı. Randevu için bizi arayabilirsiniz."
                  : "Bir hizmet seçin; ardından uzmanınızı ve size uyan saati seçersiniz."}
              </p>
            </div>
          </div>

          <div className="space-y-14 @4xl:col-span-8">
            {p.services.length === 0 && (
              <p className="text-[15px] text-ink-3">Online randevuya açık hizmet bulunmuyor.</p>
            )}
            {groups.map((group) => (
              <div key={group.name || "_"}>
                {group.name && (
                  <h3 className={cn(display, "mb-2 text-3xl italic text-ink")}>{group.name}</h3>
                )}
                <ul>
                  {group.items.map((srv) => {
                    const row = (
                      <>
                        <span className="flex items-baseline gap-3">
                          <span className="text-lg font-medium text-ink">{srv.name}</span>
                          <span className="min-w-6 flex-1 border-b border-dotted border-line-strong" aria-hidden="true" />
                          <span className="text-lg tabular-nums text-ink">{formatPrice(srv.price)}</span>
                        </span>
                        <span className="mt-1.5 flex items-start justify-between gap-6 text-sm text-ink-3">
                          <span className="max-w-[60ch]">
                            {formatDuration(srv.durationMinutes)}
                            {srv.description && <span className="mt-1 line-clamp-2 block">{srv.description}</span>}
                          </span>
                          {!p.bookingClosed && (
                            <span className="shrink-0 text-brand-ink underline-offset-4 group-hover:underline">Randevu al</span>
                          )}
                        </span>
                      </>
                    );
                    return (
                      <li key={srv.id} className="border-b border-line">
                        {p.bookingClosed ? (
                          <div className="block py-5">{row}</div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => p.onBook(srv)}
                            className={cn("group block w-full py-5 text-left", focusRing)}
                          >
                            {row}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team portraits ── */}
      {p.employees.length > 0 && (
        <section id="ekip" aria-labelledby="ekip-baslik" className="scroll-mt-16 border-t border-line">
          <div className={cn(shell, "py-20 @4xl:py-28")}>
            <h2 id="ekip-baslik" className={cn(display, "text-5xl leading-none text-ink @3xl:text-6xl")}>
              Ekip
            </h2>
            <ul className={cn("mt-12 grid grid-cols-2 gap-x-5 gap-y-12 @3xl:grid-cols-3", p.employees.length !== 3 && "@5xl:grid-cols-4")}>
              {p.employees.map((emp) => (
                <li key={emp.id}>
                  {emp.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={emp.photo} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center bg-surface-muted" aria-hidden="true">
                      <span className={cn(display, "text-7xl text-ink-3")}>
                        {emp.name.trim().charAt(0).toLocaleUpperCase("tr-TR")}
                      </span>
                    </div>
                  )}
                  <p className={cn(display, "mt-4 text-2xl leading-tight text-ink")}>{emp.name}</p>
                  {emp.specialty && <p className="mt-1 text-sm text-ink-3">{emp.specialty}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Gallery: staggered columns ── */}
      {p.photos.length > 0 && (
        <section id="galeri" aria-labelledby="galeri-baslik" className="scroll-mt-16 border-t border-line">
          <div className={cn(shell, "py-20 @4xl:py-28")}>
            <div className="flex items-end justify-between gap-6">
              <h2 id="galeri-baslik" className={cn(display, "text-5xl leading-none text-ink @3xl:text-6xl")}>
                Galeri
              </h2>
              {p.photos.length > 9 && (
                <button type="button" onClick={() => p.onOpenPhoto(0)} className={cn("text-sm text-ink-2", textLink)}>
                  Tüm fotoğraflar ({p.photos.length})
                </button>
              )}
            </div>
            {/* Column count follows the photo count so short galleries don't leave a ragged gap. */}
            <div
              className={cn(
                "mt-12 columns-2 gap-4 @3xl:gap-6",
                (p.photos.length === 3 || p.photos.length >= 5) && "@3xl:columns-3",
                p.photos.length === 1 && "columns-1 @3xl:max-w-2xl"
              )}
            >
              {p.photos.slice(0, 9).map((photo, i) => (
                <button
                  key={photo.src + i}
                  type="button"
                  onClick={() => p.onOpenPhoto(i)}
                  className={cn("mb-4 block w-full break-inside-avoid @3xl:mb-6", focusRing)}
                  aria-label={`Fotoğrafı büyüt: ${photo.alt}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className={cn("w-full object-cover", ["aspect-[3/4]", "aspect-square", "aspect-[4/5]"][i % 3])}
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── One review, set large ── */}
      {p.reviews.length > 0 && (
        <section id="yorumlar" aria-labelledby="yorumlar-baslik" className="scroll-mt-16 border-t border-line bg-surface">
          <div className={cn(shell, "py-20 @4xl:py-28")}>
            <h2 id="yorumlar-baslik" className="flex flex-wrap items-center gap-3 text-sm text-ink-3">
              <Stars rating={p.ratingAverage} />
              <span>
                {formatRating(p.ratingAverage)} ortalama, {p.reviews.length} değerlendirme
              </span>
            </h2>
            {quote ? (
              <figure className="mt-10">
                <blockquote className={cn(display, "max-w-[30ch] text-[clamp(1.9rem,4.6cqi,3.4rem)] leading-[1.15] text-ink")}>
                  <p>“{quote.comment!.trim()}”</p>
                </blockquote>
                <figcaption className="mt-8 flex flex-wrap items-center justify-between gap-6">
                  <span className="text-[15px] text-ink-2">{quote.customerName}</span>
                  {quotes.length > 1 && (
                    <span className="flex items-center gap-3 text-sm text-ink-3">
                      <button
                        type="button"
                        onClick={() => setQuoteIndex((quoteIndex - 1 + quotes.length) % quotes.length)}
                        className={cn("flex h-10 w-10 items-center justify-center border border-line-strong text-ink hover:bg-surface-muted", focusRing)}
                        aria-label="Önceki yorum"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="tabular-nums" aria-live="polite">
                        {quoteIndex + 1} / {quotes.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuoteIndex((quoteIndex + 1) % quotes.length)}
                        className={cn("flex h-10 w-10 items-center justify-center border border-line-strong text-ink hover:bg-surface-muted", focusRing)}
                        aria-label="Sonraki yorum"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                </figcaption>
              </figure>
            ) : (
              <p className={cn(display, "mt-8 text-4xl text-ink")}>{formatRating(p.ratingAverage)} / 5</p>
            )}
          </div>
        </section>
      )}

      {/* ── Visit ── */}
      <section id="iletisim" aria-labelledby="iletisim-baslik" className="scroll-mt-16 border-t border-line">
        <div className={cn(shell, "py-20 @4xl:py-28")}>
          <h2 id="iletisim-baslik" className={cn(display, "text-5xl leading-none text-ink @3xl:text-6xl")}>
            Ziyaret
          </h2>
          <div className="mt-12 grid gap-12 @3xl:grid-cols-3">
            {(p.address || p.city) && (
              <div>
                <h3 className="text-sm text-ink-3">Adres</h3>
                <p className="mt-3 max-w-[28ch] text-[15px] leading-relaxed text-ink">
                  {[p.address, p.city].filter(Boolean).join(", ")}
                </p>
                {p.contact.mapsUrl && (
                  <a href={p.contact.mapsUrl} target="_blank" rel="noopener noreferrer" className={cn("mt-4 inline-block text-sm text-ink-2", textLink)}>
                    Yol tarifi al
                  </a>
                )}
              </div>
            )}
            {p.hours.length > 0 && (
              <div>
                <h3 className="text-sm text-ink-3">Çalışma saatleri</h3>
                <WeekHours hours={p.hours} todayIndex={p.todayIndex} className="mt-3 max-w-xs text-ink-2" todayClassName="font-medium text-ink" />
              </div>
            )}
            {contactLinks.length > 0 && (
              <div>
                <h3 className="text-sm text-ink-3">İletişim</h3>
                <ul className="mt-3 space-y-2 text-[15px]">
                  {p.contact.phone && (
                    <li>
                      <a href={`tel:${p.contact.phone}`} className={cn("text-ink", textLink)}>
                        {p.contact.phone}
                      </a>
                    </li>
                  )}
                  {p.contact.whatsappUrl && (
                    <li>
                      <a href={p.contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className={cn("text-ink", textLink)}>
                        WhatsApp ile yazın
                      </a>
                    </li>
                  )}
                  {p.contact.instagramUrl && (
                    <li>
                      <a href={p.contact.instagramUrl} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-2 text-ink", textLink)}>
                        <InstagramIcon className="h-4 w-4" />
                        Instagram
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className={cn(shell, "flex flex-col gap-6 py-12 @3xl:flex-row @3xl:items-end @3xl:justify-between")}>
          <p className={cn(display, "text-[clamp(2.5rem,7cqi,5rem)] leading-none text-ink")}>{p.name}</p>
          <p className="text-xs text-ink-3">
            © {p.footerYear ?? ""} {p.name}. Online randevu altyapısı RandevuGo.
          </p>
        </div>
      </footer>
    </div>
  );
}
