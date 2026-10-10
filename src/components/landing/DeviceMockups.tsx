import React from "react";
import { Check, ChevronRight } from "lucide-react";

/**
 * Product illustrations for the landing hero, drawn in markup so they stay sharp at any size.
 * The names and prices are sample data for the illustration, not real bookings.
 */

const WEEK = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];
// [day index, start row (half hours from 09:00), length in half hours, tone]
const BLOCKS: [number, number, number, "mint" | "amber" | "slate"][] = [
  [0, 1, 2, "mint"],
  [0, 6, 2, "slate"],
  [1, 0, 3, "mint"],
  [2, 3, 2, "amber"],
  [2, 7, 2, "mint"],
  [3, 2, 2, "mint"],
  [3, 8, 2, "mint"],
  [4, 1, 3, "slate"],
  [5, 0, 2, "mint"],
  [5, 4, 3, "mint"],
];
const TONE = {
  mint: "bg-[#DCF7E6] border-[#9BE3B5]",
  amber: "bg-[#FEF3C7] border-[#F7D27A]",
  slate: "bg-[#EEF1F4] border-[#D5DBE2]",
};

function LaptopScreen() {
  return (
    <div className="flex h-full bg-[#F5F6F8] text-[#0D1117]">
      {/* Sidebar */}
      <div className="hidden w-[22%] flex-col gap-1.5 border-r border-[#E6E8EC] p-2.5 sm:flex">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-[#0D1117]" />
          <span className="h-1.5 w-12 rounded bg-[#0D1117]/80" />
        </div>
        {["Özet", "Takvim", "Rezervasyonlar", "Müşteriler", "Hizmetler", "Çalışanlar"].map((item, i) => (
          <div
            key={item}
            className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[7px] ${i === 1 ? "bg-white font-semibold shadow-sm" : "text-[#555E6C]"}`}
          >
            <span className={`h-2 w-2 rounded-sm ${i === 1 ? "bg-[#0A7B5C]" : "bg-[#C9CFD8]"}`} />
            {item}
          </div>
        ))}
      </div>
      {/* Calendar */}
      <div className="flex-1 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-[family-name:var(--font-manrope)] text-[11px] font-extrabold">Takvim</span>
          <span className="rounded-md bg-[#0A7B5C] px-2 py-0.5 text-[6px] font-semibold text-white">+ Yeni randevu</span>
        </div>
        <div className="overflow-hidden rounded-md border border-[#E6E8EC] bg-white">
          <div className="grid grid-cols-[22px_repeat(6,1fr)] border-b border-[#E6E8EC] text-center text-[6px] text-[#687180]">
            <span />
            {WEEK.map((d, i) => (
              <span key={d} className="border-l border-[#E6E8EC] py-1">
                {d} <b className={i === 2 ? "rounded-full bg-[#0A7B5C] px-1 text-white" : "text-[#0D1117]"}>{12 + i}</b>
              </span>
            ))}
          </div>
          <div className="relative grid grid-cols-[22px_repeat(6,1fr)]" style={{ height: 132 }}>
            <div className="relative">
              {HOURS.map((h, i) => (
                <span key={h} className="absolute right-1 text-[5px] text-[#687180]" style={{ top: i * 22 + 1 }}>
                  {h}
                </span>
              ))}
            </div>
            {WEEK.map((d, di) => (
              <div
                key={d}
                className="relative border-l border-[#E6E8EC]"
                style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 21px, #EEF0F3 21px 22px)" }}
              >
                {BLOCKS.filter((b) => b[0] === di).map(([, start, len, tone], bi) => (
                  <span
                    key={bi}
                    className={`absolute inset-x-0.5 rounded-[3px] border ${TONE[tone]}`}
                    style={{ top: start * 11 + 1, height: len * 11 - 2 }}
                  >
                    <span className="mx-1 mt-0.5 block h-[3px] w-3/4 rounded bg-[#0D1117]/30" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const SERVICES = [
  { name: "Saç kesimi", time: "30 dk", price: "₺450", on: true },
  { name: "Sakal tıraşı", time: "20 dk", price: "₺250", on: false },
  { name: "Saç boyama", time: "90 dk", price: "₺1.200", on: false },
];
const SLOTS = ["10:00", "10:30", "11:00", "13:30", "14:00", "15:30"];

function PhoneScreen() {
  return (
    <div className="flex h-full flex-col bg-white px-3 pb-3 pt-7 text-[#0D1117]">
      <p className="text-center font-[family-name:var(--font-manrope)] text-[11px] font-extrabold">Randevu al</p>
      <p className="text-center text-[7px] text-[#687180]">Hızlı ve kolay randevu oluşturun</p>
      <div className="mt-2 flex items-center justify-center gap-1">
        {[1, 2, 3, 4].map((s) => (
          <span
            key={s}
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[6px] font-bold ${s <= 2 ? "bg-[#0A7B5C] text-white" : "border border-[#D0D5DD] text-[#687180]"}`}
          >
            {s === 1 ? <Check className="h-2 w-2" strokeWidth={4} /> : s}
          </span>
        ))}
      </div>
      <div className="mt-2.5 space-y-1">
        {SERVICES.map((s) => (
          <div
            key={s.name}
            className={`flex items-center gap-1.5 rounded-md border px-1.5 py-1 ${s.on ? "border-[#0A7B5C] bg-[#EAF6F1]" : "border-[#E6E8EC]"}`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[7.5px] font-semibold">{s.name}</span>
              <span className="block text-[6px] text-[#687180]">{s.time}</span>
            </span>
            <span className="text-[7.5px] font-bold tabular-nums">{s.price}</span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[7px] font-semibold">Saat seçin</p>
      <div className="mt-1 grid grid-cols-3 gap-1">
        {SLOTS.map((t, i) => (
          <span
            key={t}
            className={`rounded-[4px] border py-[3px] text-center text-[6.5px] tabular-nums ${i === 1 ? "border-[#0A7B5C] bg-[#0A7B5C] font-bold text-white" : "border-[#E6E8EC] text-[#454E5C]"}`}
          >
            {t}
          </span>
        ))}
      </div>
      <span className="mt-auto flex items-center justify-center gap-0.5 rounded-md bg-[#0A7B5C] py-1.5 text-[7.5px] font-bold text-white">
        Devam et <ChevronRight className="h-2.5 w-2.5" />
      </span>
    </div>
  );
}

/** Laptop with the dashboard calendar, and a phone with the booking flow in front of it. */
export function HeroDevices() {
  return (
    <div className="relative mx-auto w-full max-w-[640px] [perspective:1800px]" aria-hidden="true">
      {/* Laptop */}
      <div className="lg:[transform:rotateY(-14deg)_rotateX(6deg)] lg:[transform-style:preserve-3d]">
        <div className="rounded-[14px] border border-white/10 bg-[#0E1114] p-[1.6%] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
          <div className="aspect-[16/10] overflow-hidden rounded-[6px]">
            <LaptopScreen />
          </div>
        </div>
        <div className="mx-auto h-2.5 w-[108%] -translate-x-[3.7%] rounded-b-[10px] bg-gradient-to-b from-[#2A2F35] to-[#15181C]" />
      </div>

      {/* Phone */}
      <div className="absolute -bottom-6 right-[4%] w-[29%] min-w-[124px] rotate-[4deg] sm:-bottom-10">
        <div className="rounded-[22px] border border-white/15 bg-[#0E1114] p-[5px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.85)]">
          <div className="relative aspect-[9/19] overflow-hidden rounded-[17px]">
            <span className="absolute left-1/2 top-1.5 z-10 h-2.5 w-10 -translate-x-1/2 rounded-full bg-[#0E1114]" />
            <PhoneScreen />
          </div>
        </div>
      </div>
    </div>
  );
}
