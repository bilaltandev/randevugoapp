"use client";

import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { ArrowRight, Crown } from "lucide-react";
import Link from "next/link";
import type { ThemeSignature } from "@/lib/themes/types";
import { EASE_OUT } from "@/components/motion/MotionRoot";

export interface ShowcaseTheme {
  id: string;
  name: string;
  sector: string;
  text: string;
  sample: string;
  photo: string;
  services: [string, string][];
  signature: ThemeSignature;
  uppercase: boolean;
  font: string;
  colors: { background: string; surface: string; primary: string; text: string; muted: string; border: string };
}

/** Top of the sample page: each theme frames the photo its own way. */
function SampleHero({ t }: { t: ShowcaseTheme }) {
  const title = {
    fontFamily: t.font,
    textTransform: t.uppercase ? "uppercase" : undefined,
    fontStyle: t.signature === "track" ? "italic" : undefined,
  } as const;

  if (t.signature === "noir" || t.signature === "table") {
    const centered = t.signature === "table";
    return (
      <div className={`relative flex h-56 flex-col justify-end overflow-hidden p-5 text-white ${centered ? "items-center text-center" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/20" />
        <span className="relative mb-2 h-px w-12" style={{ background: t.colors.primary }} />
        <p className="relative text-[34px] font-semibold leading-none" style={title}>{t.sample}</p>
      </div>
    );
  }
  if (t.signature === "porcelain") {
    return (
      <div className="flex items-end gap-3 p-5 pb-3">
        <p className="min-w-0 flex-1 text-[38px] font-medium leading-[0.95]" style={{ ...title, color: t.colors.text }}>{t.sample}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.photo} alt="" loading="lazy" className="h-40 w-28 shrink-0 rounded-b-2xl rounded-t-full object-cover" />
      </div>
    );
  }
  if (t.signature === "track") {
    return (
      <div className="relative h-52 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.photo} alt="" loading="lazy" className="absolute inset-y-0 right-0 h-full w-3/5 object-cover [clip-path:polygon(30%_0,100%_0,100%_100%,0_100%)]" />
        <p className="relative p-5 text-[28px] font-extrabold leading-none" style={{ ...title, color: t.colors.text }}>Pist<br />Garaj</p>
        <span className="sig-hazard absolute bottom-5 left-5 h-2 w-24" style={{ "--rg-brand": t.colors.primary } as React.CSSProperties} />
      </div>
    );
  }
  return (
    <div className="p-5 pb-3">
      <p className="text-[32px] font-semibold leading-none tracking-[-0.03em]" style={{ ...title, color: t.colors.text }}>{t.sample}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
        {["Bugün açık", "4,9 puan"].map((x) => (
          <span key={x} className="rounded-xl border px-3 py-2" style={{ background: t.colors.surface, borderColor: t.colors.border, color: t.colors.muted }}>{x}</span>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.photo} alt="" loading="lazy" className="mt-3 h-24 w-full rounded-xl object-cover" />
    </div>
  );
}

function SamplePhone({ t }: { t: ShowcaseTheme }) {
  const onPrimary = t.signature === "track" || t.signature === "noir" ? "#111" : "#fff";
  return (
    <div className="mx-auto w-[290px] rounded-[2.6rem] border border-white/15 bg-[#0E1114] p-2 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.9)]" aria-hidden="true">
      <div className="h-[560px] overflow-hidden rounded-[2.1rem]" style={{ background: t.colors.background }}>
        <SampleHero t={t} />
        <ul className="px-5 pt-3">
          {t.services.map(([name, price]) => (
            <li key={name} className="flex items-center justify-between gap-3 border-b py-3 text-[13px]" style={{ borderColor: t.colors.border, color: t.colors.text }}>
              <span>{name}</span>
              <span className="font-semibold tabular-nums">{price}</span>
            </li>
          ))}
        </ul>
        <p className="mx-5 mt-4 rounded-xl py-3 text-center text-[13px] font-semibold" style={{ background: t.colors.primary, color: onPrimary }}>
          {t.signature === "table" ? "Masa ayırt" : "Randevu al"}
        </p>
      </div>
    </div>
  );
}

/** Pick a sector, see its premium theme: the panel's glow and the sample page change with it. */
export function ThemeShowcase({ themes }: { themes: ShowcaseTheme[] }) {
  const [index, setIndex] = useState(0);
  const t = themes[index];

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-black px-6 py-10 text-white sm:px-12 sm:py-14">
      <m.div
        className="pointer-events-none absolute inset-0"
        animate={{ background: `radial-gradient(70% 80% at 75% 55%, ${t.colors.primary}3D, transparent 70%)` }}
        transition={{ duration: 0.6 }}
        aria-hidden="true"
      />
      <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div role="tablist" aria-label="Sektör seçin" className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap">
            {themes.map((theme, i) => (
              <button
                key={theme.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => setIndex(i)}
                className={`h-11 shrink-0 rounded-full px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  i === index ? "bg-white text-black" : "bg-white/10 text-white/75 hover:text-white"
                }`}
              >
                {theme.sector}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={t.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="mt-9"
              role="tabpanel"
              aria-label={t.sector}
            >
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70">
                <Crown className="h-4 w-4" style={{ color: t.colors.primary }} aria-hidden="true" />
                Premium tema
              </p>
              <h3 className="mt-2 text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-none tracking-[-0.02em]" style={{ fontFamily: t.font }}>
                {t.name}
              </h3>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-white/70">{t.text}</p>
            </m.div>
          </AnimatePresence>
          <Link href="/register" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition-colors hover:bg-white/85">
            Sayfanızı oluşturun
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-sm text-white/50">Premium temalar Person ve Team paketlerinde. Görseldeki işletme örnektir.</p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={t.id}
            initial={{ opacity: 0, y: 24, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -16, rotate: 2 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            <SamplePhone t={t} />
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
