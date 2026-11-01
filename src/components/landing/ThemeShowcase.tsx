"use client";

import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
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
    <div className="w-[270px] rounded-[2.6rem] border border-white/15 bg-[#031418] p-2 shadow-[0_50px_90px_-30px_rgba(0,0,0,0.75)]">
      <div className="h-[540px] overflow-hidden rounded-[2.1rem]" style={{ background: t.colors.background }}>
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

/** Five phones stand in a curve; picking a sector swings its theme to the front. */
export function ThemeShowcase({ themes }: { themes: ShowcaseTheme[] }) {
  const [index, setIndex] = useState(0);
  const t = themes[index];

  return (
    <div>
      <div role="tablist" aria-label="Sektör seçin" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:justify-center sm:px-0">
        {themes.map((theme, i) => (
          <button
            key={theme.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => setIndex(i)}
            className={`h-11 shrink-0 rounded-full px-5 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5BE38F] ${
              i === index ? "bg-[#EAF2EE] text-[#062A30]" : "text-[#EAF2EE]/70 hover:text-[#EAF2EE]"
            }`}
          >
            {theme.sector}
          </button>
        ))}
      </div>

      <div className="relative mt-6 h-[500px] overflow-x-clip [perspective:1500px] sm:h-[600px]" aria-hidden="true">
        {themes.map((theme, i) => {
          const offset = i - index;
          const distance = Math.abs(offset);
          return (
            <m.button
              key={theme.id}
              type="button"
              tabIndex={-1}
              onClick={() => setIndex(i)}
              className="absolute left-1/2 top-0 -ml-[135px] origin-top cursor-pointer"
              style={{ zIndex: 10 - distance }}
              initial={false}
              animate={{
                x: `${offset * 62}%`,
                rotateY: offset * -34,
                z: distance * -190,
                scale: 0.84,
                opacity: distance > 2 ? 0 : 1 - distance * 0.22,
              }}
              transition={{ type: "spring", stiffness: 170, damping: 24 }}
            >
              <SamplePhone t={theme} />
            </m.button>
          );
        })}
      </div>

      <div className="mx-auto max-w-lg text-center" role="tabpanel" aria-label={t.sector}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={t.id} initial={{ y: 10 }} animate={{ y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }}>
            <h3 className="text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-tight" style={{ fontFamily: t.font }}>{t.name}</h3>
            <p className="mt-2 text-lg leading-relaxed text-[#EAF2EE]/70">{t.text}</p>
          </m.div>
        </AnimatePresence>
        <p className="mt-3 text-sm text-[#EAF2EE]/50">Person ve Team paketlerinde. Telefondaki işletmeler örnektir.</p>
      </div>
    </div>
  );
}
