"use client";

import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, MessageSquare, Navigation, Phone, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing, Stars } from "../ui";
import { formatDuration, formatPrice } from "../time";
import { featuredReviews, groupServices, type StorefrontLayoutProps } from "./types";
import { formatRating, InstagramIcon, WeekHours } from "./shared";

/**
 * Sinematik: the photo is the page. A full-height hero carries the name in heavy
 * Manrope; services ride in a wide horizontal rail of large cards; the page closes
 * on a full-bleed accent band that asks for the booking.
 */
const display = "font-[family-name:var(--font-manrope)] font-extrabold tracking-[-0.035em]";
const shell = "mx-auto w-full max-w-[1320px] px-5 @3xl:px-10";
/**
 * Tile spans for the gallery bento (2 columns on phones, 4 from tablet up), chosen
 * per photo count so every count fills its rows without a hole.
 */
function bentoSpan(count: number, i: number) {
  const lead = "col-span-2 row-span-2";
  if (count === 1) return "col-span-2 row-span-2 @3xl:col-span-4";
  if (count === 2) return lead;
  if (count === 3) return i === 0 ? lead : "col-span-1 @3xl:col-span-2";
  if (count === 4) return i === 0 ? lead : i === 1 ? "col-span-2" : "";
  // 5+: lead and four singles fill two rows; the rest share a closing row.
  if (count === 5) return i === 0 ? lead : "";
  if (count === 6) return i === 0 ? lead : i === 5 ? "col-span-2 @3xl:col-span-4" : "";
  return i === 0 ? lead : i >= 5 ? "@3xl:col-span-2" : "";
}

const glassBtn = cn(
  "inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20",
  focusRing
);

export function CinematicLayout(p: StorefrontLayoutProps) {
  const groups = groupServices(p.services);
  const hasCategories = groups.length > 1;
  const [category, setCategory] = useState<string>(groups[0]?.name ?? "");
  const railServices = hasCategories ? groups.find((g) => g.name === category)?.items ?? [] : p.services;
  const railRef = useRef<HTMLDivElement>(null);
  const quotes = featuredReviews(p.reviews);
  const canBook = !p.bookingClosed && p.services.length > 0;

  const scrollRail = (dir: 1 | -1) => {
    const el = railRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="@container">
      {/* ── Glass bar over the hero ── */}
      <header className="sticky top-0 z-40 h-16 bg-black/40 text-white backdrop-blur-md">
        <div className={cn(shell, "flex h-full items-center gap-4")}>
          <a href="#ust" className={cn("flex min-w-0 items-center gap-3", focusRing)}>
            {p.showLogo && p.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo} alt="" className="h-8 w-8 shrink-0 rounded-full bg-white object-contain p-0.5" />
            )}
            <span className={cn(display, "truncate text-lg tracking-[-0.02em]")}>{p.name}</span>
          </a>
          {canBook && (
            <a
              href="#hizmetler"
              className={cn(
                "ml-auto inline-flex h-10 shrink-0 items-center rounded-full bg-brand px-5 text-sm font-semibold text-(color:--bk-on-brand) transition-colors hover:bg-brand-hover",
                focusRing
              )}
            >
              Randevu al
            </a>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        id="ust"
        className="relative isolate -mt-16 flex min-h-[max(600px,min(100svh,940px))] items-end overflow-hidden bg-black text-white"
      >
        {p.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.heroImage} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 -z-10 bg-brand" aria-hidden="true" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-black/20" aria-hidden="true" />

        <div className={cn(shell, "grid gap-10 pb-12 pt-32 @4xl:grid-cols-[minmax(0,1fr)_auto] @4xl:items-end @4xl:pb-16")}>
          <div className="min-w-0">
            {p.categoryLine.length > 0 && <p className="text-sm text-white/70">{p.categoryLine.join(", ")}</p>}
            <h1
              id="business-name"
              className={cn(display, "mt-3 max-w-[14ch] text-[clamp(2.75rem,8.5cqi,7rem)] leading-[0.92] [text-wrap:balance]")}
            >
              {p.name}
            </h1>
            {p.description && (
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-white/80">{p.description}</p>
            )}
            <div className="mt-9 flex flex-wrap gap-3">
              {canBook && (
                <a
                  href="#hizmetler"
                  className={cn(
                    "inline-flex h-12 items-center rounded-full bg-brand px-7 text-[15px] font-semibold text-(color:--bk-on-brand) transition-colors hover:bg-brand-hover",
                    focusRing
                  )}
                >
                  Randevu al
                </a>
              )}
              {p.contact.phone && (
                <a href={`tel:${p.contact.phone}`} className={glassBtn}>
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Ara
                </a>
              )}
              {p.contact.whatsappUrl && (
                <a href={p.contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className={glassBtn}>
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {(p.reviews.length > 0 || p.openStatus || p.address) && (
            <dl className="w-full space-y-4 rounded-2xl border border-white/15 bg-white/10 p-5 text-sm backdrop-blur-md @4xl:w-72">
              {p.reviews.length > 0 && (
                <div>
                  <dt className="sr-only">Ortalama puan</dt>
                  <dd className="flex items-center gap-3">
                    <span className={cn(display, "text-4xl tracking-[-0.02em]")}>{formatRating(p.ratingAverage)}</span>
                    <span>
                      <Stars rating={p.ratingAverage} />
                      <a href="#yorumlar" className={cn("mt-0.5 block text-white/70 hover:text-white", focusRing)}>
                        {p.reviews.length} değerlendirme
                      </a>
                    </span>
                  </dd>
                </div>
              )}
              {p.openStatus && (
                <div className="flex items-center gap-2.5">
                  <dt className="sr-only">Bugün</dt>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", p.openStatus.open ? "bg-emerald-400" : "bg-white/40")} aria-hidden="true" />
                  <dd>{p.openStatus.label}</dd>
                </div>
              )}
              {p.address && (
                <div className="flex items-start gap-2.5 text-white/80">
                  <dt className="sr-only">Adres</dt>
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <dd className="line-clamp-2">{p.address}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </section>

      {/* ── Services rail ── */}
      <section id="hizmetler" aria-labelledby="hizmetler-baslik" className="scroll-mt-16 py-16 @3xl:py-24">
        <div className={shell}>
          <div className="flex flex-col gap-6 @3xl:flex-row @3xl:items-end @3xl:justify-between">
            <div>
              <h2 id="hizmetler-baslik" className={cn(display, "text-4xl leading-none text-ink @3xl:text-6xl")}>
                {p.isRestaurant ? "Rezervasyon" : "Hizmetler"}
              </h2>
              {p.bookingClosed && (
                <p className="mt-4 text-[15px] text-ink-3">Online randevu şu an kapalı. Randevu için bizi arayabilirsiniz.</p>
              )}
            </div>
            <div className="hidden gap-2 @3xl:flex">
              <button
                type="button"
                onClick={() => scrollRail(-1)}
                className={cn("flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-ink hover:bg-surface-muted", focusRing)}
                aria-label="Önceki hizmetler"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(1)}
                className={cn("flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-ink hover:bg-surface-muted", focusRing)}
                aria-label="Sonraki hizmetler"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {hasCategories && (
            <div className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1 @3xl:mx-0 @3xl:px-0" role="tablist" aria-label="Kategoriler">
              {groups.map((g) => {
                const active = g.name === category;
                return (
                  <button
                    key={g.name || "_"}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setCategory(g.name);
                      railRef.current?.scrollTo({ left: 0 });
                    }}
                    className={cn(
                      "h-10 shrink-0 rounded-full px-5 text-sm font-medium transition-colors",
                      focusRing,
                      active ? "bg-ink text-canvas" : "bg-surface-muted text-ink-2 hover:text-ink"
                    )}
                  >
                    {g.name || "Diğer"}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {p.services.length === 0 ? (
          <p className={cn(shell, "mt-8 text-[15px] text-ink-3")}>Online randevuya açık hizmet bulunmuyor.</p>
        ) : (
          <div
            ref={railRef}
            className="mt-8 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-4 @3xl:scroll-px-10 @3xl:gap-5 @3xl:px-10 @min-[87.5rem]:scroll-px-[calc((100cqi_-_1320px)/2_+_2.5rem)] @min-[87.5rem]:px-[calc((100cqi_-_1320px)/2_+_2.5rem)]"
          >
            {railServices.map((srv) => (
              <article
                key={srv.id}
                className="flex w-[82%] shrink-0 snap-start flex-col overflow-hidden rounded-(--bk-r-card) border border-line bg-surface @xl:w-[46%] @4xl:w-[31%] @6xl:w-[23.5%]"
              >
                {srv.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={srv.image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex aspect-[4/3] w-full flex-col justify-end bg-surface-muted p-5" aria-hidden="true">
                    <span className={cn(display, "text-5xl tracking-[-0.03em] text-brand-ink")}>{formatPrice(srv.price)}</span>
                    <span className="mt-1 text-sm text-ink-3">{formatDuration(srv.durationMinutes)}</span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold leading-snug text-ink">{srv.name}</h3>
                  {srv.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-3">{srv.description}</p>}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-sm text-ink-2">
                      {srv.image ? (
                        <>
                          <span className="font-semibold tabular-nums text-ink">{formatPrice(srv.price)}</span>
                          <span className="ml-2 inline-flex items-center gap-1 text-ink-3">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatDuration(srv.durationMinutes)}
                          </span>
                        </>
                      ) : null}
                    </span>
                    {!p.bookingClosed && (
                      <button
                        type="button"
                        onClick={() => p.onBook(srv)}
                        className={cn(
                          "inline-flex h-10 shrink-0 items-center rounded-full bg-ink px-5 text-sm font-semibold text-canvas transition-opacity hover:opacity-85",
                          focusRing
                        )}
                        aria-label={`${srv.name} için randevu al`}
                      >
                        Randevu al
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Gallery bento ── */}
      {p.photos.length > 0 && (
        <section id="galeri" aria-labelledby="galeri-baslik" className="scroll-mt-16 pb-16 @3xl:pb-24">
          <div className={shell}>
            <h2 id="galeri-baslik" className={cn(display, "text-4xl leading-none text-ink @3xl:text-6xl")}>
              Galeri
            </h2>
            <div className="mt-8 grid auto-rows-[150px] grid-cols-2 gap-3 @3xl:auto-rows-[210px] @3xl:grid-cols-4">
              {p.photos.slice(0, 7).map((photo, i) => {
                const more = i === 6 && p.photos.length > 7;
                return (
                  <button
                    key={photo.src + i}
                    type="button"
                    onClick={() => p.onOpenPhoto(i)}
                    className={cn(
                      "relative overflow-hidden rounded-(--bk-r-card) bg-surface-muted",
                      bentoSpan(Math.min(p.photos.length, 7), i),
                      focusRing
                    )}
                    aria-label={more ? `Tüm fotoğrafları gör (${p.photos.length})` : `Fotoğrafı büyüt: ${photo.alt}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover" loading="lazy" />
                    {more && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">
                        +{p.photos.length - 6}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Team ── */}
      {p.employees.length > 0 && (
        <section id="ekip" aria-labelledby="ekip-baslik" className="scroll-mt-16 pb-16 @3xl:pb-24">
          <div className={shell}>
            <h2 id="ekip-baslik" className={cn(display, "text-4xl leading-none text-ink @3xl:text-6xl")}>
              Ekip
            </h2>
            <ul className={cn("mt-8 grid grid-cols-2 gap-3 @3xl:gap-4", p.employees.length === 3 ? "@3xl:grid-cols-3" : "@3xl:grid-cols-4")}>
              {p.employees.map((emp) => (
                <li key={emp.id} className="relative aspect-[3/4] overflow-hidden rounded-(--bk-r-card) bg-surface-muted">
                  {emp.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={emp.photo} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className={cn(display, "flex h-full items-center justify-center text-7xl text-ink-3")} aria-hidden="true">
                      {emp.name.trim().charAt(0).toLocaleUpperCase("tr-TR")}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-14 text-white">
                    <p className="text-base font-bold leading-tight">{emp.name}</p>
                    {emp.specialty && <p className="mt-0.5 line-clamp-2 text-sm text-white/75">{emp.specialty}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Reviews: inverted band ── */}
      {p.reviews.length > 0 && (
        <section id="yorumlar" aria-labelledby="yorumlar-baslik" className="scroll-mt-16 bg-ink py-16 text-canvas @3xl:py-24">
          <div className={shell}>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <h2 id="yorumlar-baslik" className={cn(display, "text-4xl leading-none @3xl:text-6xl")}>
                Yorumlar
              </h2>
              <p className="flex items-center gap-2 pb-1 text-[15px] opacity-75">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                {formatRating(p.ratingAverage)} ortalama, {p.reviews.length} değerlendirme
              </p>
            </div>
            {quotes.length > 0 && (
              <ul className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 @3xl:mx-0 @3xl:grid @3xl:grid-cols-3 @3xl:overflow-visible @3xl:px-0">
                {quotes.slice(0, 6).map((r) => (
                  <li key={r.id} className="w-[85%] shrink-0 snap-start @3xl:w-auto">
                    <figure className="flex h-full flex-col">
                      <Stars rating={r.rating} />
                      <blockquote className="mt-4 line-clamp-6 text-lg leading-snug">“{r.comment!.trim()}”</blockquote>
                      <figcaption className="mt-auto pt-5 text-sm opacity-70">{r.customerName}</figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ── Closing band ── */}
      <section id="iletisim" aria-labelledby="iletisim-baslik" className="scroll-mt-16 bg-brand text-(color:--bk-on-brand)">
        <div className={cn(shell, "grid gap-12 py-16 @3xl:py-24 @4xl:grid-cols-2")}>
          <div>
            <h2 id="iletisim-baslik" className={cn(display, "max-w-[12ch] text-[clamp(2.5rem,7cqi,5.5rem)] leading-[0.95]")}>
              {canBook ? "Yerinizi ayırtın." : "Bize ulaşın."}
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              {canBook && (
                <a
                  href="#hizmetler"
                  className={cn(
                    "inline-flex h-12 items-center rounded-full bg-(--bk-on-brand) px-7 text-[15px] font-semibold text-brand transition-opacity hover:opacity-90",
                    focusRing
                  )}
                >
                  Randevu al
                </a>
              )}
              {p.contact.mapsUrl && (
                <a
                  href={p.contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("inline-flex h-12 items-center gap-2 rounded-full border border-current/30 px-5 text-sm font-medium", focusRing)}
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Yol tarifi
                </a>
              )}
              {p.contact.instagramUrl && (
                <a
                  href={p.contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("inline-flex h-12 items-center gap-2 rounded-full border border-current/30 px-5 text-sm font-medium", focusRing)}
                >
                  <InstagramIcon className="h-4 w-4" />
                  Instagram
                </a>
              )}
            </div>
          </div>

          <div className="grid gap-10 @xl:grid-cols-2">
            {p.hours.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold">Çalışma saatleri</h3>
                <WeekHours hours={p.hours} todayIndex={p.todayIndex} className="mt-3 opacity-85" todayClassName="font-bold" />
              </div>
            )}
            {(p.address || p.contact.phone) && (
              <div className="space-y-4 text-sm">
                {p.address && (
                  <div>
                    <h3 className="font-semibold">Adres</h3>
                    <p className="mt-2 opacity-85">{[p.address, p.city].filter(Boolean).join(", ")}</p>
                  </div>
                )}
                {p.contact.phone && (
                  <div>
                    <h3 className="font-semibold">Telefon</h3>
                    <a href={`tel:${p.contact.phone}`} className={cn("mt-2 inline-block opacity-85 hover:underline", focusRing)}>
                      {p.contact.phone}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-canvas py-8 text-center text-xs text-ink-3">
        © {p.footerYear ?? ""} {p.name}. Online randevu altyapısı CalendlyGo.
      </footer>
    </div>
  );
}
