"use client";

import React, { useRef, useState } from "react";
import { AnimatePresence, useInView } from "motion/react";
import * as m from "motion/react-m";
import { CalendarCheck2, Check, Globe, MessageCircle, UserRound } from "lucide-react";
import { EASE_OUT } from "@/components/motion/MotionRoot";

/* The names, times and messages drawn here are sample data for the illustration. */
const SLOTS = ["10:00", "10:30", "11:00", "13:30", "14:00", "15:30"];
const DAY = [
  { time: "10:30", name: "Mert K.", service: "Saç kesimi", fresh: true },
  { time: "11:30", name: "Ece A.", service: "Sakal tıraşı" },
  { time: "14:00", name: "Can D.", service: "Saç boyama" },
];

function LinkVisual() {
  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-[15px] text-white">
        <Globe className="h-4 w-4 text-[#5BE38F]" aria-hidden="true" />
        calendlygo.com/<span className="font-semibold">isletmeniz</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/80">
        {["Instagram", "WhatsApp", "Google Haritalar"].map((c) => (
          <span key={c} className="rounded-full border border-white/15 px-3 py-1.5">{c}</span>
        ))}
      </div>
    </div>
  );
}

function SlotsVisual() {
  return (
    <div className="w-full max-w-sm">
      <p className="text-sm text-white/60">Salı, 14 Ekim</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {SLOTS.map((t, i) => (
          <span
            key={t}
            className={`rounded-xl py-3 text-center text-[15px] tabular-nums ${i === 1 ? "bg-[#5BE38F] font-semibold text-[#04210F]" : "bg-white/10 text-white/80"}`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function CalendarVisual() {
  return (
    <ul className="w-full max-w-sm space-y-2">
      {DAY.map((a) => (
        <li key={a.time} className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${a.fresh ? "bg-[#5BE38F]/15 ring-1 ring-[#5BE38F]/50" : "bg-white/10"}`}>
          <span className="text-sm font-semibold tabular-nums text-white">{a.time}</span>
          <span className="min-w-0 flex-1 truncate text-sm text-white/80">{a.name}, {a.service}</span>
          {a.fresh && <Check className="h-4 w-4 text-[#5BE38F]" aria-hidden="true" />}
        </li>
      ))}
    </ul>
  );
}

function MessageVisual() {
  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex items-center gap-3 text-sm text-white/70">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </span>
        Mert K.
      </div>
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#5BE38F] px-4 py-3 text-sm text-[#04210F]">
        Merhaba Mert Bey, yarın 10:30 randevunuzu hatırlatmak istedik.
      </p>
      <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-white/10 px-4 py-3 text-sm text-white">Teşekkürler, geleceğim.</p>
    </div>
  );
}

const STEPS = [
  { icon: Globe, title: "Bağlantınızı paylaşın", text: "calendlygo.com/isletmeniz adresiniz hazır. Instagram'a ve WhatsApp'a ekleyin.", visual: LinkVisual },
  { icon: CalendarCheck2, title: "Müşteri kendi saatini seçer", text: "Sadece boş saatler görünür, sayfanız 7/24 randevu alır.", visual: SlotsVisual },
  { icon: Check, title: "Takviminize kendiliğinden düşer", text: "Randevular çakışmaz. Çalışma saatlerinizi ve molalarınızı siz belirlersiniz.", visual: CalendarVisual },
  { icon: MessageCircle, title: "Müşterinize tek dokunuşla ulaşın", text: "WhatsApp'tan yazın, ziyaret geçmişini ve notlarını tek yerde görün.", visual: MessageVisual },
];

function Step({ index, onActive }: { index: number; onActive: (i: number) => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  const { icon: Icon, title, text, visual: Visual } = STEPS[index];
  React.useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <li ref={ref} className="flex flex-col justify-center py-8 lg:min-h-[62vh] lg:py-0">
      <Icon className="h-6 w-6 text-[#5BE38F]" aria-hidden="true" />
      <h3 className="mt-4 font-[family-name:var(--font-manrope)] text-[clamp(1.5rem,2.6vw,2.1rem)] font-semibold leading-[1.15] tracking-[-0.03em]">{title}</h3>
      <p className="mt-3 max-w-md text-[17px] leading-relaxed text-[#EAF2EE]/70">{text}</p>
      {/* Phones have no sticky panel, so each step carries its own picture. */}
      <div className="mt-6 flex min-h-48 items-center rounded-[1.5rem] bg-[#041F24] p-6 lg:hidden" aria-hidden="true">
        <Visual />
      </div>
    </li>
  );
}

/** Four steps scroll past a pinned panel; on phones every step simply stacks with its picture. */
export function FeatureStory() {
  const [active, setActive] = useState(0);
  const Visual = STEPS[active].visual;

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <ol className="divide-y divide-white/10 lg:divide-y-0">
        {STEPS.map((step, i) => (
          <Step key={step.title} index={i} onActive={setActive} />
        ))}
      </ol>
      <div className="hidden lg:block">
        <div className="sticky top-[calc(50vh-13rem)]">
          <div
            className="flex h-[26rem] items-center justify-center overflow-hidden rounded-[2rem] bg-[#041F24] p-10"
            aria-hidden="true"
          >
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={active}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                className="flex w-full justify-center"
              >
                <Visual />
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
