"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CalendarCheck2, Globe, KeyRound, Lock, Scissors, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shown once after a new business signs up (register → here → plan cards), the web twin of the mobile
 * app's intro: four full-screen slides, always dark, each with its own accent and aurora glow, and
 * mock-ups of the panel drawn in HTML. Arrow keys, swipes and "Atla" work.
 */

type Slide = {
  key: string;
  accent: string;
  glow: string;
  eyebrow: string;
  title: string;
  body: string;
  Visual: () => React.ReactElement;
};

const EMERALD = { accent: "#2BBF8E", glow: "#0E7A5A" };
const BLUE = { accent: "#60A5FA", glow: "#1D4ED8" };
const VIOLET = { accent: "#A78BFA", glow: "#6D28D9" };
const AMBER = { accent: "#FBBF24", glow: "#B45309" };

const SLIDES: Slide[] = [
  {
    key: "calendar",
    ...EMERALD,
    eyebrow: "Takvim",
    title: "Tüm randevularınız tek ekranda",
    body: "Gününüzü, haftanızı ve ayınızı bir bakışta görün. Randevuları onaylayın, düzenleyin ya da iptal edin.",
    Visual: CalendarVisual,
  },
  {
    key: "booking",
    ...BLUE,
    eyebrow: "Online randevu",
    title: "Müşterileriniz 7/24 randevu alsın",
    body: "Size özel randevu sayfanızı paylaşın. Müşterileriniz boş saati seçip randevusunu kendisi oluştursun.",
    Visual: BookingVisual,
  },
  {
    key: "team",
    ...VIOLET,
    eyebrow: "Ekip",
    title: "Ekibinizi ve hizmetlerinizi yönetin",
    body: "Çalışanlarınızı ve hizmetlerinizi süre ve fiyatlarıyla ekleyin. Her çalışan kendi randevularını görsün.",
    Visual: TeamVisual,
  },
  {
    key: "growth",
    ...AMBER,
    eyebrow: "İstatistikler",
    title: "İşletmenizin büyümesini izleyin",
    body: "Randevu sayıları, müşteri geçmişi ve yorumlarla işinizin nasıl gittiğini takip edin.",
    Visual: GrowthVisual,
  },
];

export function IntroSlides({ next }: { next: string }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchX = useRef<number | null>(null);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  // Sign-up sends here once; replace() keeps "back" from returning to the slides.
  const finish = useCallback(() => router.replace(next), [router, next]);

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to >= SLIDES.length) return;
      setDirection(to > index ? 1 : -1);
      setIndex(to);
    },
    [index]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Enter" && last) finish();
      else if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, last, finish]);

  return (
    <div
      className="dark relative flex min-h-dvh flex-col overflow-hidden bg-canvas text-ink"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx < -50) go(index + 1);
        else if (dx > 50) go(index - 1);
        touchX.current = null;
      }}
    >
      {/* Aurora: two glows in the slide's colors over a faint dot grid */}
      <div
        key={`aurora-${slide.key}`}
        className="pointer-events-none absolute inset-0 animate-[fade-in_0.7s_ease_both]"
        aria-hidden="true"
        style={{
          backgroundImage: [
            `radial-gradient(60% 45% at 12% 8%, ${slide.accent}55, transparent 70%)`,
            `radial-gradient(55% 40% at 95% 55%, ${slide.glow}77, transparent 70%)`,
            "radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.07) 1.1px, transparent 1.4px)",
          ].join(", "),
          backgroundSize: "auto, auto, 22px 22px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-canvas to-transparent" aria-hidden="true" />

      {/* Progress + skip */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-6 px-5 pt-5 sm:px-8 sm:pt-8">
        <div className="flex flex-1 gap-2">
          {SLIDES.map((s, i) => (
            <button key={s.key} type="button" onClick={() => go(i)} aria-label={`${i + 1} / ${SLIDES.length}`} className="flex-1 py-2">
              <span className="block h-[3px] overflow-hidden rounded-full bg-white/15">
                <span
                  className="block h-full rounded-full transition-all duration-500"
                  style={{ width: i <= index ? "100%" : "0%", backgroundColor: slide.accent }}
                />
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={finish}
          className={cn("min-w-12 text-right text-sm font-semibold text-ink-2 hover:text-ink", last && "invisible")}
        >
          Atla
        </button>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-6 px-5 pb-8 sm:px-8 lg:grid-cols-2 lg:gap-12">
        {/* Picture */}
        <div
          key={`visual-${slide.key}`}
          className={cn(
            "relative order-1 flex min-h-[360px] items-center justify-center lg:order-2 lg:min-h-[520px]",
            direction === 1 ? "animate-[slide-in-right_0.5s_cubic-bezier(.2,.7,.2,1)_both]" : "animate-[slide-in-left_0.5s_cubic-bezier(.2,.7,.2,1)_both]"
          )}
        >
          <div className="origin-center scale-[0.86] sm:scale-100 lg:scale-110">
            <slide.Visual />
          </div>
        </div>

        {/* Copy */}
        <div key={`copy-${slide.key}`} className="order-2 animate-[fade-in-up_0.55s_ease_both] lg:order-1">
          <div className="mb-4 flex items-center gap-3" style={{ color: slide.accent }}>
            <span className="text-[13px] font-extrabold tracking-[0.08em]">{String(index + 1).padStart(2, "0")}</span>
            <span className="h-[1.5px] w-6 rounded-full opacity-70" style={{ backgroundColor: slide.accent }} />
            <span className="text-[13px] font-bold">{slide.eyebrow}</span>
          </div>
          <h1 className="font-display text-[36px] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink sm:text-5xl lg:text-[60px]">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-2 sm:text-lg">{slide.body}</p>

          <div className="mt-9 flex items-center gap-4">
            <button
              type="button"
              onClick={() => (last ? finish() : go(index + 1))}
              className="group inline-flex h-14 items-center gap-6 rounded-full pl-7 pr-1.5 text-base font-bold text-canvas transition-transform active:scale-[0.98]"
              style={{ backgroundColor: slide.accent, boxShadow: `0 18px 40px -16px ${slide.accent}` }}
            >
              {last ? "Başlayalım" : "Devam et"}
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas transition-transform group-hover:translate-x-0.5" style={{ color: slide.accent }}>
                {last ? <Check className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
              </span>
            </button>
            <span className="hidden text-xs text-ink-3 sm:inline">← → ile gezinebilirsiniz</span>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------- Building blocks ---------- */

const card = "rounded-[24px] border border-white/[0.08] bg-[rgba(18,22,29,0.94)] p-5 shadow-[0_28px_60px_-20px_rgba(0,0,0,0.85)]";
const chip =
  "absolute z-10 flex items-center gap-2.5 rounded-[16px] border border-white/[0.12] bg-[rgba(28,34,44,0.97)] py-2 pl-2 pr-3.5 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.85)] animate-float";

function Chip({ className, icon, color, title, subtitle, delay = "0s" }: { className: string; icon: React.ReactNode; color: string; title: string; subtitle?: string; delay?: string }) {
  return (
    <div className={cn(chip, className)} style={{ animationDelay: delay }}>
      <span className="flex h-7 w-7 items-center justify-center rounded-full text-canvas" style={{ backgroundColor: color }}>
        {icon}
      </span>
      <span>
        <span className="block text-xs font-bold text-ink">{title}</span>
        {subtitle && <span className="block text-[11px] text-ink-3">{subtitle}</span>}
      </span>
    </div>
  );
}

function Avatar({ initials, color, size = 30 }: { initials: string; color: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-surface font-extrabold text-canvas"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

/* ---------- 1. Calendar: a day timeline ---------- */

function CalendarVisual() {
  const H = 46;
  const at = (h: number, m: number) => (h - 9) * H + (m / 60) * H;
  const blocks = [
    { from: at(9, 15), to: at(10, 0), name: "Ayşe Kaya", service: "Saç kesimi", color: EMERALD.accent },
    { from: at(10, 30), to: at(11, 10), name: "Mehmet Demir", service: "Sakal tıraşı", color: AMBER.accent },
    { from: at(11, 30), to: at(12, 40), name: "Elif Şahin", service: "Cilt bakımı", color: BLUE.accent },
  ];
  return (
    <div className="relative w-[300px] pt-6 pb-8">
      <div className={card}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-ink-3">Takvim</p>
            <p className="text-base font-bold text-ink">Bugün</p>
          </div>
          <div className="flex">
            {[
              ["AK", EMERALD.accent],
              ["MD", AMBER.accent],
              ["EŞ", BLUE.accent],
            ].map(([i, c], n) => (
              <span key={i} className={n ? "-ml-2" : ""}>
                <Avatar initials={i} color={c} size={24} />
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          {[13, 14, 15, 16, 17, 18, 19].map((d) => (
            <span
              key={d}
              className={cn("flex w-8 flex-col items-center gap-1 rounded-[10px] py-1.5 text-xs font-bold", d === 15 ? "text-canvas" : "text-ink-2")}
              style={d === 15 ? { backgroundColor: EMERALD.accent } : undefined}
            >
              {d}
              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: d === 15 ? "#0B0E13" : d % 3 ? EMERALD.accent : "transparent" }} />
            </span>
          ))}
        </div>
        <div className="relative mt-4" style={{ height: H * 4 }}>
          {["09:00", "10:00", "11:00", "12:00", "13:00"].map((h, i) => (
            <div key={h} className="absolute inset-x-0 -mt-[7px] flex items-center gap-2" style={{ top: i * H }}>
              <span className="w-[34px] text-[10px] font-semibold text-ink-3">{h}</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          ))}
          {blocks.map((b) => (
            <div
              key={b.name}
              className="absolute left-[42px] right-0 flex flex-col justify-center rounded-[8px] border-l-[3px] px-2"
              style={{ top: b.from + 2, height: b.to - b.from - 4, borderColor: b.color, backgroundColor: `${b.color}1F` }}
            >
              <span className="truncate text-xs font-semibold text-ink">{b.name}</span>
              <span className="truncate text-[11px] text-ink-3">{b.service}</span>
            </div>
          ))}
          <div className="absolute left-[36px] right-0 -mt-1 flex items-center" style={{ top: at(10, 12) }}>
            <span className="h-2 w-2 rounded-full bg-danger" />
            <span className="h-[1.5px] flex-1 bg-danger" />
          </div>
        </div>
      </div>
      <Chip className="-right-6 top-0" icon={<Check className="h-3.5 w-3.5" />} color={EMERALD.accent} title="Onaylandı" subtitle="Ayşe K. · 09:15" />
      <div className={cn(chip, "-left-6 bottom-0 flex-col items-center gap-0 px-5 py-2")} style={{ animationDelay: "1.2s" }}>
        <span className="font-display text-2xl font-extrabold" style={{ color: EMERALD.accent }}>
          8
        </span>
        <span className="text-[11px] text-ink-3">Randevular</span>
      </div>
    </div>
  );
}

/* ---------- 2. Booking page on a phone ---------- */

function BookingVisual() {
  const slots = ["10:00", "10:30", "11:00", "13:00", "14:30", "15:00"];
  return (
    <div className="relative px-8 py-4">
      <div className="relative h-[400px] w-[240px] overflow-hidden rounded-[40px] border-[6px] border-[#1F2531] bg-surface shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)]">
        <span className="absolute left-1/2 top-2 z-10 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-black" />
        <div className="flex h-[96px] items-end justify-center p-2" style={{ background: `linear-gradient(135deg, ${BLUE.accent}, ${BLUE.glow})` }}>
          <span className="mb-7 flex items-center gap-1 rounded-full bg-[rgba(11,14,19,0.55)] px-2 py-0.5 text-[9px] font-semibold text-ink">
            <Lock className="h-2.5 w-2.5" /> calendlygo.com/ahmet-berber
          </span>
        </div>
        <div className="-mt-7 space-y-2.5 px-3">
          <div className="flex items-end gap-2">
            <span className="rounded-full border-[3px] border-surface">
              <Avatar initials="AB" color="#181D26" size={44} />
            </span>
            <div className="min-w-0 pb-0.5">
              <p className="truncate text-sm font-bold text-ink">Ahmet Berber</p>
              <p className="text-[11px] text-ink-3">
                <span style={{ color: AMBER.accent }}>★ 4.9</span> (128)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-[12px] border px-2 py-2 text-xs" style={{ borderColor: BLUE.accent, backgroundColor: "rgba(96,165,250,0.08)" }}>
            <Scissors className="h-3.5 w-3.5" style={{ color: BLUE.accent }} />
            <span className="flex-1 font-semibold text-ink">Saç kesimi</span>
            <span className="text-[11px] text-ink-3">30 dk</span>
            <span className="font-semibold text-ink">₺350</span>
          </div>
          <p className="text-[11px] text-ink-3">Saat seçin</p>
          <div className="grid grid-cols-3 gap-1.5">
            {slots.map((s) => {
              const on = s === "10:30";
              const taken = s === "11:00";
              return (
                <span
                  key={s}
                  className={cn(
                    "rounded-[8px] border py-1.5 text-center text-[11px] font-bold",
                    on ? "text-canvas" : taken ? "border-surface-muted bg-surface-muted text-ink-3 line-through" : "border-line text-ink"
                  )}
                  style={on ? { backgroundColor: BLUE.accent, borderColor: BLUE.accent } : undefined}
                >
                  {s}
                </span>
              );
            })}
          </div>
          <span className="block rounded-[12px] py-2.5 text-center text-xs font-extrabold text-canvas" style={{ backgroundColor: BLUE.accent }}>
            Randevuyu onayla
          </span>
        </div>
      </div>
      <Chip className="-right-2 top-0" icon={<CalendarCheck2 className="h-3.5 w-3.5" />} color={EMERALD.accent} title="Yeni randevu" subtitle="Elif · 10:30" />
      <Chip className="-left-2 bottom-10" icon={<Globe className="h-3.5 w-3.5" />} color={BLUE.accent} title="7/24" subtitle="Online randevu" delay="1.2s" />
    </div>
  );
}

/* ---------- 3. Team and services ---------- */

function TeamVisual() {
  const team = [
    { i: "AY", name: "Ahmet Yıldız", role: "Saç kesimi", load: 82, color: VIOLET.accent },
    { i: "ZK", name: "Zeynep Koç", role: "Cilt bakımı", load: 64, color: BLUE.accent },
    { i: "CD", name: "Can Doğan", role: "Sakal tıraşı", load: 45, color: EMERALD.accent },
  ];
  return (
    <div className="relative w-[310px] pt-8">
      <div className={cn(card, "space-y-4")}>
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-ink">Ekip</p>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ color: VIOLET.accent, backgroundColor: `${VIOLET.accent}26` }}>
            3 / 5
          </span>
        </div>
        {team.map((m) => (
          <div key={m.i} className="flex items-center gap-3">
            <span className="relative">
              <Avatar initials={m.i} color={m.color} size={36} />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface" style={{ backgroundColor: EMERALD.accent }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between text-xs">
                <span className="truncate font-semibold text-ink">{m.name}</span>
                <span className="text-ink-3">{m.load}%</span>
              </div>
              <p className="text-[11px] text-ink-3">{m.role}</p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full" style={{ width: `${m.load}%`, backgroundColor: m.color }} />
              </div>
            </div>
          </div>
        ))}
        <div className="h-px bg-white/10" />
        <p className="text-[11px] text-ink-3">Hizmetler</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            ["Saç kesimi", 350],
            ["Sakal tıraşı", 200],
            ["Cilt bakımı", 600],
          ].map(([n, p]) => (
            <span key={n} className="flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink">
              {n} <span className="text-[11px]" style={{ color: VIOLET.accent }}>₺{p}</span>
            </span>
          ))}
        </div>
      </div>
      <Chip className="-right-6 top-0" icon={<KeyRound className="h-3.5 w-3.5" />} color={VIOLET.accent} title="Davet kodu" subtitle="K7M2-QXAB" />
    </div>
  );
}

/* ---------- 4. Growth: a chart, stats and a review ---------- */

function GrowthVisual() {
  const W = 256;
  const H = 96;
  const pts = [0.28, 0.36, 0.31, 0.48, 0.44, 0.6, 0.55, 0.72, 0.68, 0.9].map((p, i, a) => [(i / (a.length - 1)) * W, H - p * H] as const);
  const line = pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [x0, y0] = pts[Math.max(0, i - 2)];
    const [x1, y1] = pts[i - 1];
    const [x3, y3] = pts[Math.min(pts.length - 1, i + 1)];
    return `${d} C ${x1 + (x - x0) / 6} ${y1 + (y - y0) / 6}, ${x - (x3 - x1) / 6} ${y - (y3 - y1) / 6}, ${x} ${y}`;
  }, "");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <div className="relative w-[300px] pt-10">
      <div className={cn(card, "space-y-2")}>
        <p className="text-[11px] text-ink-3">Bu ay</p>
        <div className="flex items-center gap-2">
          <span className="font-display text-[38px] font-extrabold leading-none tracking-[-0.04em] text-ink">128</span>
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ color: EMERALD.accent, backgroundColor: `${EMERALD.accent}26` }}>
            <TrendingUp className="h-3 w-3" /> +18%
          </span>
        </div>
        <p className="text-[11px] text-ink-3">Randevular</p>
        <svg width={W} height={H + 8} className="overflow-visible">
          <defs>
            <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={AMBER.accent} stopOpacity={0.35} />
              <stop offset="1" stopColor={AMBER.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={`${line} L ${W} ${H + 8} L 0 ${H + 8} Z`} fill="url(#growth-area)" />
          <path d={line} stroke={AMBER.accent} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <circle cx={lx - 4} cy={ly + 2} r={9} fill={AMBER.accent} fillOpacity={0.2} />
          <circle cx={lx - 4} cy={ly + 2} r={4} fill={AMBER.accent} />
        </svg>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Puan", "4.9", AMBER.accent],
            ["Yorumlar", "86", undefined],
            ["Müşteriler", "412", undefined],
          ].map(([l, v, c]) => (
            <span key={l} className="rounded-[12px] bg-surface-muted p-2">
              <span className="block text-base font-extrabold" style={{ color: c ?? "var(--rg-ink)" }}>
                {v}
              </span>
              <span className="block truncate text-[11px] text-ink-3">{l}</span>
            </span>
          ))}
        </div>
      </div>
      <div className={cn(chip, "-right-8 top-0 w-[200px] items-start")}>
        <Avatar initials="SY" color={VIOLET.accent} size={26} />
        <span>
          <span className="block text-[11px]" style={{ color: AMBER.accent }}>
            ★★★★★
          </span>
          <span className="block text-xs font-semibold text-ink">Harika hizmet, çok memnun kaldım!</span>
        </span>
      </div>
    </div>
  );
}
