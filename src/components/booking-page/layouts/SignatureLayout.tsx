"use client";

import React, { useRef } from "react";
import { Clock, MapPin, MessageSquare, Navigation, Phone, ShieldCheck, Star } from "lucide-react";
import { useReducedMotion, useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import type { PageSectionKey, ThemeSignature } from "@/lib/themes/types";
import { EASE_OUT, MotionRoot, Reveal } from "@/components/motion/MotionRoot";
import { BrandMark } from "../BrandMark";
import { focusRing, headingCls, Stars } from "../ui";
import { formatDuration, formatPrice } from "../time";
import type { BookingService } from "../types";
import { featuredReviews, groupServices, sectionTitle, type StorefrontLayoutProps } from "./types";
import { formatRating, InstagramIcon, WeekHours } from "./shared";

/**
 * Premium storefronts. Every signature keeps the same real data and booking flow, but has its
 * own hero, service presentation and motion. Berrak (clinics) deliberately moves the least.
 */
type Props = StorefrontLayoutProps & { signature: ThemeSignature };

const shell = "mx-auto w-full max-w-[1240px] px-5 @3xl:px-10";
const primaryCta = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-(--bk-r-btn) bg-brand px-7 text-[15px] font-semibold text-(color:--bk-on-brand) transition-colors hover:bg-brand-hover",
  focusRing
);
const lineCta = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-(--bk-r-btn) border border-line-strong px-5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted",
  focusRing
);
const photoCta = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-(--bk-r-btn) border border-white/25 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20",
  focusRing
);
const titleClass = cn(headingCls, "text-[clamp(2.25rem,5cqi,3.75rem)] leading-[1.02] text-ink");

const bookLabel = (p: Props) => p.ctaLabel || (p.isRestaurant ? "Masa ayırt" : "Randevu al");


/** Slow drift of a hero photo while the page scrolls; still when the visitor prefers less motion. */
function useHeroDrift(distance: number) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : distance]);
  return { ref, y };
}

function Contact({ p, onPhoto }: { p: Props; onPhoto?: boolean }) {
  const cls = onPhoto ? photoCta : lineCta;
  return (
    <>
      {p.contact.phone && (
        <a href={`tel:${p.contact.phone}`} className={cls}>
          <Phone className="h-4 w-4" aria-hidden="true" />
          Ara
        </a>
      )}
      {p.contact.whatsappUrl && (
        <a href={p.contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className={cls}>
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </a>
      )}
    </>
  );
}

function BookCta({ p, className }: { p: Props; className?: string }) {
  if (p.bookingClosed || p.services.length === 0) return null;
  return (
    <m.a href="#hizmetler" whileTap={{ scale: 0.97 }} className={cn(primaryCta, className)}>
      {bookLabel(p)}
    </m.a>
  );
}

function OpenStatus({ p, className }: { p: Props; className?: string }) {
  if (!p.openStatus) return null;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("h-2 w-2 rounded-full", p.openStatus.open ? "bg-emerald-400" : "bg-current opacity-40")} aria-hidden="true" />
      {p.openStatus.label}
    </span>
  );
}

function RatingLine({ p, className }: { p: Props; className?: string }) {
  if (p.reviews.length === 0) return null;
  return (
    <a href="#yorumlar" className={cn("inline-flex items-center gap-2", focusRing, className)}>
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
      {formatRating(p.ratingAverage)} · {p.reviews.length} değerlendirme
    </a>
  );
}

function HeroImage({ src, y, className }: { src: string; y?: ReturnType<typeof useTransform<number, number>>; className?: string }) {
  return (
    <m.img src={src} alt="" style={y ? { y } : undefined} className={cn("absolute h-full w-full object-cover", className)} />
  );
}

/* ───────── Heroes ───────── */

function NoirHero(p: Props) {
  const { ref, y } = useHeroDrift(140);
  return (
    <section ref={ref} id="ust" className="relative isolate -mt-16 flex min-h-[max(620px,min(100svh,920px))] items-end overflow-hidden bg-black text-white">
      {p.heroImage ? (
        <HeroImage src={p.heroImage} y={y} className="inset-x-0 -top-[10%] -z-10 !h-[120%]" />
      ) : (
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_75%_30%,var(--rg-brand-soft),transparent)]" aria-hidden="true" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/60 to-black/25" aria-hidden="true" />

      <div className={cn(shell, "pb-14 pt-32 @4xl:pb-20")}>
        <m.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
          className="block h-px w-28 origin-left bg-brand"
          aria-hidden="true"
        />
        {p.categoryLine.length > 0 && <p className="mt-5 text-sm tracking-wide text-white/70">{p.categoryLine.join(" · ")}</p>}
        <m.h1
          id="business-name"
          initial={{ y: 28 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className={cn(headingCls, "mt-3 max-w-[13ch] text-[clamp(3rem,9.5cqi,7.5rem)] leading-[0.95] [text-wrap:balance]")}
        >
          {p.name}
        </m.h1>
        {p.description && <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-white/75">{p.description}</p>}
        <div className="mt-9 flex flex-wrap gap-3">
          <BookCta p={p} />
          <Contact p={p} onPhoto />
        </div>
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
          <OpenStatus p={p} />
          <RatingLine p={p} />
        </div>
      </div>
    </section>
  );
}

function PorcelainHero(p: Props) {
  const { ref, y } = useHeroDrift(-70);
  const side = p.sideImage || p.photos[0]?.src;
  return (
    <section ref={ref} id="ust" className={cn(shell, "grid items-center gap-12 pb-16 pt-12 @4xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] @4xl:pb-24 @4xl:pt-16")}>
      <div>
        {p.categoryLine.length > 0 && <p className="text-[15px] text-brand-ink">{p.categoryLine.join(" · ")}</p>}
        <m.h1
          id="business-name"
          initial={{ y: 22 }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: EASE_OUT }}
          className={cn(headingCls, "mt-4 text-[clamp(3.25rem,9cqi,6.75rem)] leading-[0.98] text-ink [text-wrap:balance]")}
        >
          {p.name}
        </m.h1>
        {p.description && <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-ink-3">{p.description}</p>}
        <div className="mt-9 flex flex-wrap gap-3">
          <BookCta p={p} />
          <Contact p={p} />
        </div>
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-3">
          <OpenStatus p={p} />
          <RatingLine p={p} />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[440px] pb-10">
        <m.div
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
          className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-surface-muted"
        >
          {p.heroImage ? (
            <HeroImage src={p.heroImage} className="inset-0" />
          ) : (
            <span className={cn(headingCls, "flex h-full items-center justify-center text-[9rem] text-brand-ink")} aria-hidden="true">
              {p.name.trim().charAt(0).toLocaleUpperCase("tr-TR")}
            </span>
          )}
        </m.div>
        {side && (
          <m.div style={{ y }} className="absolute -left-4 bottom-0 h-36 w-36 overflow-hidden rounded-full border-[6px] border-canvas bg-surface-muted @xl:-left-10 @xl:h-44 @xl:w-44">
            <HeroImage src={side} className="inset-0" />
          </m.div>
        )}
      </div>
    </section>
  );
}

function ClearHero(p: Props) {
  const facts: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [];
  if (p.openStatus) facts.push({ icon: <Clock className="h-5 w-5" aria-hidden="true" />, label: "Bugün", value: p.openStatus.label });
  if (p.reviews.length > 0) {
    facts.push({
      icon: <Star className="h-5 w-5" aria-hidden="true" />,
      label: "Hasta değerlendirmesi",
      value: `${formatRating(p.ratingAverage)} · ${p.reviews.length} değerlendirme`,
    });
  }
  if (p.address) facts.push({ icon: <MapPin className="h-5 w-5" aria-hidden="true" />, label: "Adres", value: <span className="line-clamp-2">{p.address}</span> });

  return (
    <section id="ust" className={cn(shell, "pb-14 pt-12 @4xl:pb-20 @4xl:pt-20")}>
      <div className="grid gap-10 @4xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] @4xl:items-end">
        <div>
          <p className="flex flex-wrap items-center gap-2 text-sm text-ink-3">
            {p.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-(--bk-r-pill) bg-brand-soft px-3 py-1 font-medium text-brand-ink">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Doğrulanmış işletme
              </span>
            )}
            {p.categoryLine.join(" · ")}
          </p>
          <h1 id="business-name" className={cn(headingCls, "mt-5 max-w-[16ch] text-[clamp(2.75rem,7.5cqi,5.25rem)] leading-[1.03] text-ink [text-wrap:balance]")}>
            {p.name}
          </h1>
          {p.description && <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-ink-3">{p.description}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <BookCta p={p} />
            <Contact p={p} />
          </div>
        </div>
        {facts.length > 0 && (
          <dl className="divide-y divide-line rounded-(--bk-r-card) border border-line bg-surface">
            {facts.map((f) => (
              <div key={f.label} className="flex items-start gap-3 p-4">
                <span className="mt-0.5 text-brand-ink">{f.icon}</span>
                <div className="min-w-0">
                  <dt className="text-xs text-ink-3">{f.label}</dt>
                  <dd className="mt-0.5 text-[15px] font-medium text-ink">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
      </div>
      {p.heroImage && (
        <div className="relative mt-12 aspect-[21/9] min-h-[220px] w-full overflow-hidden rounded-(--bk-r-card) bg-surface-muted">
          <HeroImage src={p.heroImage} className="inset-0" />
        </div>
      )}
    </section>
  );
}

function TableHero(p: Props) {
  const { ref, y } = useHeroDrift(110);
  const reduce = useReducedMotion();
  return (
    <section ref={ref} id="ust" className="relative isolate -mt-16 flex min-h-[max(640px,min(100svh,960px))] items-center justify-center overflow-hidden bg-black text-center text-white">
      {p.heroImage ? (
        <m.div style={{ y }} className="absolute inset-x-0 -top-[8%] -z-10 h-[116%]">
          <m.img
            src={p.heroImage}
            alt=""
            initial={{ scale: reduce ? 1 : 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 9, ease: "easeOut" }}
            className="h-full w-full object-cover"
          />
        </m.div>
      ) : (
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(55%_55%_at_50%_100%,var(--rg-brand-line),transparent)]" aria-hidden="true" />
      )}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(75%_70%_at_50%_50%,rgba(0,0,0,0.78),rgba(0,0,0,0.5))]" aria-hidden="true" />

      <div className={cn(shell, "flex flex-col items-center py-32")}>
        {p.categoryLine.length > 0 && <p className="text-sm tracking-[0.18em] text-white/75">{p.categoryLine.join(" · ")}</p>}
        <m.h1
          id="business-name"
          initial={{ y: 26 }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: EASE_OUT }}
          className={cn(headingCls, "mt-5 max-w-[15ch] text-[clamp(3.25rem,10cqi,8rem)] leading-[0.96] [text-wrap:balance]")}
        >
          {p.name}
        </m.h1>
        {p.description && <p className="mt-6 max-w-[50ch] text-lg leading-relaxed text-white/80">{p.description}</p>}
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <BookCta p={p} />
          <Contact p={p} onPhoto />
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/75">
          <OpenStatus p={p} />
          <RatingLine p={p} />
        </div>
      </div>
    </section>
  );
}

function TrackHero(p: Props) {
  const { ref, y } = useHeroDrift(80);
  const stats = [
    p.services.length > 0 ? { value: String(p.services.length), label: "Hizmet" } : null,
    p.reviews.length > 0 ? { value: formatRating(p.ratingAverage), label: "Ortalama puan" } : null,
    p.employees.length > 0 ? { value: String(p.employees.length), label: "Uzman" } : null,
  ].filter((s): s is { value: string; label: string } => !!s);

  return (
    <section ref={ref} id="ust" className="relative isolate overflow-hidden">
      {p.heroImage && (
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-[54%] overflow-hidden [clip-path:polygon(22%_0,100%_0,100%_100%,0_100%)] @4xl:block">
          <HeroImage src={p.heroImage} y={y} className="inset-x-0 -top-[10%] !h-[120%]" />
          <div className="absolute inset-0 bg-canvas/25" aria-hidden="true" />
        </div>
      )}
      <div className={cn(shell, "flex min-h-[min(82svh,720px)] flex-col justify-center py-16")}>
        <div className={cn("max-w-[640px]", p.heroImage && "@4xl:max-w-[46cqi]")}>
          {p.categoryLine.length > 0 && <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-ink">{p.categoryLine.join(" · ")}</p>}
          <m.h1
            id="business-name"
            initial={{ x: -36 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
            className={cn(headingCls, "mt-4 text-[clamp(2.5rem,6cqi,5rem)] italic leading-[1] text-ink [text-wrap:balance]")}
          >
            {p.name}
          </m.h1>
          <m.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
            className="sig-hazard mt-6 block h-2.5 w-44 origin-left"
            aria-hidden="true"
          />
          {p.description && <p className="mt-6 max-w-[50ch] text-base leading-relaxed text-ink-3">{p.description}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <BookCta p={p} />
            <Contact p={p} />
          </div>
          {stats.length > 0 && (
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dd className={cn(headingCls, "text-3xl tabular-nums text-ink")}>{s.value}</dd>
                  <dt className="mt-0.5 text-xs uppercase tracking-wider text-ink-3">{s.label}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
      {p.heroImage && (
        <div className="relative aspect-[16/9] w-full overflow-hidden @4xl:hidden">
          <HeroImage src={p.heroImage} className="inset-0" />
        </div>
      )}
    </section>
  );
}

const HEROES: Record<ThemeSignature, (p: Props) => React.ReactElement> = {
  noir: NoirHero,
  porcelain: PorcelainHero,
  clear: ClearHero,
  table: TableHero,
  track: TrackHero,
};

/** Decorative ribbon: the owner's phrases, or the business's real service names. */
function ServiceRibbon({ services, phrases }: { services: BookingService[]; phrases: string[] | null }) {
  if (phrases === null) return null;
  const words = phrases.length > 0 ? phrases : services.slice(0, 8).map((s) => s.name);
  if (words.length === 0 || (phrases.length === 0 && words.length < 3)) return null;
  // Short lists repeat so the ribbon never shows a gap.
  const names = Array.from({ length: Math.ceil(8 / words.length) }, () => words).flat();
  const row = (hidden?: boolean) => (
    <span className="flex shrink-0 items-center" aria-hidden={hidden}>
      {names.map((n, i) => (
        <span key={n + i} className="flex items-center">
          <span className={cn(headingCls, "px-7 text-2xl text-ink @3xl:text-3xl")}>{n}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
        </span>
      ))}
    </span>
  );
  return (
    <div className="overflow-hidden border-y border-line py-4" aria-hidden="true">
      <div className="sig-ribbon flex w-max">
        {row()}
        {row(true)}
      </div>
    </div>
  );
}

/* ───────── Services ───────── */

function RowBook({ p, srv, className }: { p: Props; srv: BookingService; className?: string }) {
  if (p.bookingClosed) return null;
  return (
    <m.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={() => p.onBook(srv)}
      aria-label={`${srv.name}: ${bookLabel(p)}`}
      className={cn(
        "inline-flex h-11 shrink-0 items-center justify-center rounded-(--bk-r-btn) bg-brand px-5 text-sm font-semibold text-(color:--bk-on-brand) transition-colors hover:bg-brand-hover",
        focusRing,
        className
      )}
    >
      {bookLabel(p)}
    </m.button>
  );
}

const Thumb = ({ srv, className }: { srv: BookingService; className?: string }) =>
  srv.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={srv.image} alt="" loading="lazy" className={cn("shrink-0 rounded-(--bk-r-ctl) object-cover", className)} />
  ) : null;

const Duration = ({ srv }: { srv: BookingService }) => (
  <span className="inline-flex items-center gap-1 text-ink-3">
    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
    {formatDuration(srv.durationMinutes)}
  </span>
);

function LedgerServices({ p, items, startAt }: { p: Props; items: BookingService[]; startAt: number }) {
  return (
    <ul className="border-t border-line">
      {items.map((srv, i) => (
        <li key={srv.id}>
          <Reveal distance={14} className="group grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-3 border-b border-line py-6 transition-colors hover:bg-surface @3xl:grid-cols-[3.5rem_minmax(0,1fr)_auto_auto] @3xl:items-center @3xl:px-3">
            <span className="text-sm tabular-nums text-brand-ink">{String(startAt + i + 1).padStart(2, "0")}</span>
            <div className="flex min-w-0 items-start gap-4">
              <Thumb srv={srv} className="h-16 w-16" />
              <div className="min-w-0">
                <h3 className={cn(headingCls, "text-2xl leading-tight text-ink")}>{srv.name}</h3>
                {srv.description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-3">{srv.description}</p>}
                <p className="mt-1.5 text-sm"><Duration srv={srv} /></p>
              </div>
            </div>
            <span className="col-start-2 text-xl font-semibold tabular-nums text-ink @3xl:col-start-auto">{formatPrice(srv.price)}</span>
            <RowBook p={p} srv={srv} className="col-start-2 w-full @3xl:col-start-auto @3xl:w-auto" />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

function CardServices({ p, items, track }: { p: Props; items: BookingService[]; track?: boolean }) {
  return (
    <ul className={cn("grid gap-4", track ? "@xl:grid-cols-2 @4xl:grid-cols-3" : "@2xl:grid-cols-2")}>
      {items.map((srv, i) => (
        <li key={srv.id}>
          <Reveal delay={Math.min(i, 5) * 0.05} distance={track ? 30 : 18} className="h-full">
            <m.article
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className={cn("flex h-full flex-col overflow-hidden rounded-(--bk-r-card) border border-line bg-surface", track && "border-t-4 border-t-brand")}
            >
              {srv.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={srv.image} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-6">
                <h3 className={cn(headingCls, "leading-tight text-ink", track ? "text-xl" : "text-[28px]")}>{srv.name}</h3>
                {srv.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-3">{srv.description}</p>}
                <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                  <div>
                    <p className={cn("font-semibold tabular-nums text-ink", track ? "text-3xl" : "text-xl")}>{formatPrice(srv.price)}</p>
                    <p className="mt-1 text-sm"><Duration srv={srv} /></p>
                  </div>
                  <RowBook p={p} srv={srv} />
                </div>
              </div>
            </m.article>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

function ListServices({ p, items }: { p: Props; items: BookingService[] }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-(--bk-r-card) border border-line bg-surface">
      {items.map((srv) => (
        <li key={srv.id} className="flex flex-col gap-3 p-5 @2xl:flex-row @2xl:items-center @2xl:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Thumb srv={srv} className="h-14 w-14" />
            <div className="min-w-0">
              <h3 className="text-[17px] font-semibold text-ink">{srv.name}</h3>
              {srv.description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-3">{srv.description}</p>}
            </div>
          </div>
          <div className="flex items-center justify-between gap-5 @2xl:justify-end">
            <span className="text-sm"><Duration srv={srv} /></span>
            <span className="text-[17px] font-semibold tabular-nums text-ink">{formatPrice(srv.price)}</span>
            <RowBook p={p} srv={srv} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MenuServices({ p, items }: { p: Props; items: BookingService[] }) {
  return (
    <ul className="grid gap-x-14 gap-y-7 @3xl:grid-cols-2">
      {items.map((srv, i) => (
        <li key={srv.id}>
          <Reveal delay={Math.min(i, 5) * 0.04} distance={14}>
            <Thumb srv={srv} className="mb-3 aspect-[16/9] w-full" />
            <div className="flex items-baseline gap-3">
              <h3 className={cn(headingCls, "text-[26px] leading-tight text-ink")}>{srv.name}</h3>
              <span className="min-w-6 flex-1 translate-y-[-4px] border-b border-dotted border-line-strong" aria-hidden="true" />
              <span className="text-lg font-semibold tabular-nums text-brand-ink">{formatPrice(srv.price)}</span>
            </div>
            {srv.description && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-3">{srv.description}</p>}
            <RowBook p={p} srv={srv} className="mt-3 h-10 border border-brand-line bg-transparent text-brand-ink hover:bg-brand-soft" />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

function Services(p: Props) {
  const groups = groupServices(p.services);
  return (
    <section id="hizmetler" aria-labelledby="hizmetler-baslik" className="scroll-mt-20 py-16 @3xl:py-24">
      <div className={shell}>
        <Reveal>
          <h2 id="hizmetler-baslik" className={titleClass}>
            {sectionTitle(p, "Services", p.isRestaurant ? "Menü ve rezervasyon" : "Hizmetler")}
          </h2>
          {p.bookingClosed && <p className="mt-4 text-[15px] text-ink-3">Online randevu şu an kapalı. Randevu için bizi arayabilirsiniz.</p>}
        </Reveal>

        {p.services.length === 0 ? (
          <p className="mt-8 text-[15px] text-ink-3">Online randevuya açık hizmet bulunmuyor.</p>
        ) : (
          <div className="mt-10 space-y-12">
            {groups.map((g, groupIndex) => {
              const startAt = groups.slice(0, groupIndex).reduce((sum, earlier) => sum + earlier.items.length, 0);
              return (
                <div key={g.name || "_"}>
                  {groups.length > 1 && <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-brand-ink">{g.name || "Diğer"}</h3>}
                  {p.signature === "noir" && <LedgerServices p={p} items={g.items} startAt={startAt} />}
                  {p.signature === "porcelain" && <CardServices p={p} items={g.items} />}
                  {p.signature === "track" && <CardServices p={p} items={g.items} track />}
                  {p.signature === "clear" && <ListServices p={p} items={g.items} />}
                  {p.signature === "table" && <MenuServices p={p} items={g.items} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────── Shared sections ───────── */

function Gallery(p: Props) {
  if (p.photos.length === 0) return null;
  return (
    <section id="galeri" aria-labelledby="galeri-baslik" className="scroll-mt-20 pb-16 @3xl:pb-24">
      <div className={shell}>
        <Reveal>
          <h2 id="galeri-baslik" className={titleClass}>{sectionTitle(p, "Gallery", "Galeri")}</h2>
        </Reveal>
        <div className="mt-10 columns-2 gap-3 @3xl:columns-3">
          {p.photos.slice(0, 9).map((photo, i) => (
            <button
              key={photo.src + i}
              type="button"
              onClick={() => p.onOpenPhoto(i)}
              aria-label={`Fotoğrafı büyüt: ${photo.alt}`}
              className={cn("mb-3 block w-full break-inside-avoid overflow-hidden rounded-(--bk-r-card) bg-surface-muted", focusRing)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.src} alt={photo.alt} loading="lazy" className="w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Team(p: Props) {
  if (p.employees.length === 0) return null;
  const round = p.signature === "porcelain" || p.signature === "clear";
  return (
    <section id="ekip" aria-labelledby="ekip-baslik" className="scroll-mt-20 pb-16 @3xl:pb-24">
      <div className={shell}>
        <Reveal>
          <h2 id="ekip-baslik" className={titleClass}>{sectionTitle(p, "Staff", p.signature === "clear" ? "Uzmanlarımız" : "Ekip")}</h2>
        </Reveal>
        <ul className="mt-10 grid grid-cols-2 gap-4 @3xl:grid-cols-4">
          {p.employees.map((emp, i) => (
            <li key={emp.id}>
              <Reveal delay={Math.min(i, 3) * 0.06} distance={18}>
                <div className={cn("overflow-hidden bg-surface-muted", round ? "mx-auto aspect-square w-3/4 rounded-full" : "aspect-[3/4] rounded-(--bk-r-card)")}>
                  {emp.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={emp.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className={cn(headingCls, "flex h-full items-center justify-center text-6xl text-ink-3")} aria-hidden="true">
                      {emp.name.trim().charAt(0).toLocaleUpperCase("tr-TR")}
                    </span>
                  )}
                </div>
                <p className={cn("mt-3 text-[15px] font-semibold text-ink", round && "text-center")}>{emp.name}</p>
                {emp.specialty && <p className={cn("mt-0.5 line-clamp-2 text-sm text-ink-3", round && "text-center")}>{emp.specialty}</p>}
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Reviews(p: Props) {
  if (p.reviews.length === 0) return null;
  const quotes = featuredReviews(p.reviews).slice(0, 6);
  return (
    <section id="yorumlar" aria-labelledby="yorumlar-baslik" className="scroll-mt-20 border-y border-line bg-surface py-16 @3xl:py-24">
      <div className={shell}>
        <Reveal className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <h2 id="yorumlar-baslik" className={titleClass}>{sectionTitle(p, "Reviews", "Yorumlar")}</h2>
          <p className="flex items-center gap-2 pb-1 text-[15px] text-ink-3">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            {formatRating(p.ratingAverage)} ortalama, {p.reviews.length} değerlendirme
          </p>
        </Reveal>
        {quotes.length > 0 && (
          <ul className="mt-10 grid gap-8 @3xl:grid-cols-3">
            {quotes.map((r, i) => (
              <li key={r.id}>
                <Reveal delay={Math.min(i, 2) * 0.06} distance={16}>
                  <figure>
                    <Stars rating={r.rating} />
                    <blockquote className="mt-4 line-clamp-6 text-lg leading-snug text-ink">“{r.comment!.trim()}”</blockquote>
                    <figcaption className="mt-4 text-sm text-ink-3">{r.customerName}</figcaption>
                  </figure>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Visit(p: Props) {
  const canBook = !p.bookingClosed && p.services.length > 0;
  return (
    <section id="iletisim" aria-labelledby="iletisim-baslik" className="scroll-mt-20 py-16 @3xl:py-24">
      <div className={cn(shell, "grid gap-12 @4xl:grid-cols-2")}>
        <Reveal>
          <h2 id="iletisim-baslik" className={cn(headingCls, "max-w-[14ch] text-[clamp(2.5rem,6.5cqi,4.75rem)] leading-[1] text-ink")}>
            {sectionTitle(p, "Location", canBook ? (p.isRestaurant ? "Masanızı ayırtın." : "Yerinizi ayırtın.") : "Bize ulaşın.")}
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <BookCta p={p} />
            {p.contact.mapsUrl && (
              <a href={p.contact.mapsUrl} target="_blank" rel="noopener noreferrer" className={lineCta}>
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Yol tarifi
              </a>
            )}
            {p.contact.instagramUrl && (
              <a href={p.contact.instagramUrl} target="_blank" rel="noopener noreferrer" className={lineCta}>
                <InstagramIcon className="h-4 w-4" />
                Instagram
              </a>
            )}
          </div>
        </Reveal>
        <div className="grid gap-10 @xl:grid-cols-2">
          {p.hours.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink">Çalışma saatleri</h3>
              <WeekHours hours={p.hours} todayIndex={p.todayIndex} className="mt-3 text-ink-3" todayClassName="font-semibold text-ink" />
            </div>
          )}
          {(p.address || p.contact.phone) && (
            <div className="space-y-5 text-sm">
              {p.address && (
                <div>
                  <h3 className="font-semibold text-ink">Adres</h3>
                  <p className="mt-2 text-ink-3">{[p.address, p.city].filter(Boolean).join(", ")}</p>
                </div>
              )}
              {p.contact.phone && (
                <div>
                  <h3 className="font-semibold text-ink">Telefon</h3>
                  <a href={`tel:${p.contact.phone}`} className={cn("mt-2 inline-block text-ink-3 hover:underline", focusRing)}>
                    {p.contact.phone}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const SECTIONS: Record<PageSectionKey, (p: Props) => React.ReactElement | null> = {
  Services,
  Gallery,
  Staff: Team,
  Reviews,
  Location: Visit,
};

export function SignatureLayout(p: Props) {
  const Hero = HEROES[p.signature];
  const overPhoto = p.signature === "noir" || p.signature === "table";
  const canBook = !p.bookingClosed && p.services.length > 0;

  return (
    <MotionRoot>
      <div className="@container overflow-x-clip">
        <header className={cn("sticky top-0 z-40 h-16 backdrop-blur-md", overPhoto ? "bg-black/40 text-white" : "border-b border-line bg-canvas/85 text-ink")}>
          <div className={cn(shell, "flex h-full items-center gap-4")}>
            <a href="#ust" aria-label={p.name} className={cn("flex min-w-0 items-center gap-3", focusRing)}>
              {!p.logoStyle && p.showLogo && p.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logo} alt="" className="h-8 w-8 shrink-0 rounded-full bg-white object-contain p-0.5" />
              )}
              {p.logoStyle ? (
                <BrandMark logo={p.showLogo ? p.logo : null} name={p.name} style={p.logoStyle} nameClassName={cn(headingCls, "text-lg")} />
              ) : (
                !(p.showLogo && p.logo) && <span className={cn(headingCls, "truncate text-lg")}>{p.name}</span>
              )}
            </a>
            {canBook && (
              <a
                href="#hizmetler"
                className={cn(
                  "ml-auto inline-flex h-10 shrink-0 items-center rounded-(--bk-r-btn) bg-brand px-5 text-sm font-semibold text-(color:--bk-on-brand) transition-colors hover:bg-brand-hover",
                  focusRing
                )}
              >
                {bookLabel(p)}
              </a>
            )}
          </div>
        </header>

        <Hero {...p} />
        {(p.signature === "noir" || p.signature === "track") && <ServiceRibbon services={p.services} phrases={p.ribbon} />}
        <main>
          {p.sectionOrder.map((key) => {
            const Section = SECTIONS[key];
            return <Section key={key} {...p} />;
          })}
        </main>

        <footer className="border-t border-line py-8 text-center text-xs text-ink-3">
          © {p.footerYear ?? ""} {p.name}. Online randevu altyapısı CalendlyGo.
        </footer>
      </div>
    </MotionRoot>
  );
}
