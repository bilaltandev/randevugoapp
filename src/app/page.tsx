"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  CalendarCheck2,
  Scissors,
  Check,
  Play,
  CalendarDays,
  Clock,
  Building2,
  ChevronRight,
  Globe,
  BarChart3,
  ShieldCheck,
  Star,
  Users2,
  MessageCircle,
  ExternalLink,
  Smartphone,
  ChevronLeft,
  X,
  AlertCircle
} from "lucide-react";
import { SECTORS } from "@/lib/utils";

/* ── Scroll Reveal Hook ── */
function useScrollReveal() {
  useEffect(() => {
    // Signal that JS is running — enables CSS hide-then-reveal pattern
    document.documentElement.classList.add("js-reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // only animate once
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );

    // Small delay so CSS class is applied before observing
    const raf = requestAnimationFrame(() => {
      document.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach((el) => {
        // If already in viewport on page load, mark visible immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add("is-visible");
        } else {
          observer.observe(el);
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);
}


/* ── Animated Counter ── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 1600;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString("tr-TR")}{suffix}</span>;
}

export default function LandingPage() {
  const [activeSector, setActiveSector] = useState("BERBER");
  const [activePhoneTab, setActivePhoneTab] = useState("takvim");
  const [selectedDay, setSelectedDay] = useState(12);
  useScrollReveal();

  const sectorExamples: Record<string, {
    title: string; desc: string; slug: string; demoName: string;
    features: string[]; emoji: string;
  }> = {
    BERBER: {
      title: "Erkek Kuaförü & Berberler İçin",
      desc: "Saç, sakal ve bakım hizmetlerini dakikalara göre planlayın. Koltuk ve personel çakışmalarını ortadan kaldırın.",
      slug: "ahmetberber", demoName: "Ahmet Berber & Styling Club", emoji: "✂️",
      features: ["Hizmet süresine göre akıllı saat hesaplama", "Stilist / Berber bazlı personel seçimi", "Sıcak havlu, saç, sakal paketleri", "Randevu öncesi WhatsApp hatırlatması"],
    },
    GUZELLIK: {
      title: "Güzellik Merkezleri & Spa İçin",
      desc: "Lazer seansları, medikal cilt bakımı, tırnak ve protez uygulamalarını seans ve oda bazında yönetin.",
      slug: "auraguzellik", demoName: "Aura Güzellik & Estetik", emoji: "💆",
      features: ["Çoklu seans paket rezervasyonları", "Uzman estetisyen ataması", "Ön bilgilendirme ve onay formu", "Doğrulanmış gerçek müşteri yorumları"],
    },
    RESTORAN: {
      title: "Restoranlar & Kafeler İçin",
      desc: "Müşterileriniz online olarak kişi sayısını ve saatini seçerek anında masa rezervasyonu oluştursun.",
      slug: "chefstable", demoName: "Chef's Table Bistro", emoji: "🍽️",
      features: ["Kişi sayısı ve masa kapasitesi yönetimi", "Özel kutlama ve doğum günü notları", "No-show önleyici WhatsApp teyidi", "Hafta sonu yoğun saat optimizasyonu"],
    },
    KLINIK: {
      title: "Klinikler & Sağlık Merkezleri İçin",
      desc: "Doktor, diş hekimi ve psikolog randevularını gizlilik ve KVKK standartlarında güvenle planlayın.",
      slug: "drselin", demoName: "Dr. Selin Sağlık Kliniği", emoji: "🏥",
      features: ["Hekim branşı ve işlem bazlı randevu", "Açlık ve tahlil hatırlatması", "Kontrol randevusu takibi", "Mola ve ameliyat saat kapatması"],
    },
    OTO_SERVIS: {
      title: "Oto Servis & Ekspertiz Merkezleri İçin",
      desc: "Araç plakası, marka/model ve bakım türünü rezervasyon anında toplayarak yedek parçayı hazır edin.",
      slug: "progupservis", demoName: "ProGrup Oto Servis", emoji: "🔧",
      features: ["Araç plakası ve model yılı toplama", "Periyodik bakım & ekspertiz seçenekleri", "Servis lifti ve usta başı planlama", "Aracınız hazır WhatsApp bildirimi"],
    },
    DIGER: {
      title: "Tüm Hizmet İşletmeleri İçin",
      desc: "Diyetisyen, danışman, fotoğrafçı veya özel ders veren tüm uzmanlar için kusursuz randevu platformu.",
      slug: "ahmetberber", demoName: "RandevuGo Çözümü", emoji: "🎯",
      features: ["Kişiye özel çalışma saatleri", "Sürükle-bırak sayfa tasarlayıcı", "Kendi alan adınız veya özel bağlantınız", "Komisyonsuz 89 TL / Ay sabit fiyat"],
    },
  };

  const current = sectorExamples[activeSector] || sectorExamples.BERBER;

  return (
    <div className="min-h-screen bg-[#080c10] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 overflow-x-hidden font-sans">

      {/* ── Top Demo Bar ── */}
      <div className="border-b border-emerald-950/60 bg-emerald-950/20 px-4 py-2 text-center text-xs backdrop-blur-md">
        <span className="text-slate-400">🎯 Canlı Test Hesabı: </span>
        <span className="font-semibold text-emerald-400">ahmet@berber.com</span>
        <span className="text-slate-600 mx-2">•</span>
        <span className="text-slate-400">Şifre: </span>
        <span className="font-semibold text-emerald-400">123456</span>
        <Link href="/login" className="ml-3 inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
          <span>Paneli İncele</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── Main Navbar ── */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#080c10]/85 backdrop-blur-xl px-4 py-3.5 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group py-1" aria-label="RandevuGo Anasayfa">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-black shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/brand/mascot-logo.png"
                alt="RandevuGo Maskot Logo"
                fill
                sizes="44px"
                className="object-cover"
                priority
                unoptimized
              />
            </div>
            <div className="relative h-7 sm:h-8 flex items-center group-hover:opacity-90 transition-opacity">
              <Image
                src="/brand/randevugo-text-logo.png"
                alt="RandevuGo"
                width={170}
                height={26}
                className="h-6 sm:h-7 w-auto object-contain"
                priority
                unoptimized
              />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-400">
            <a href="#ozellikler" className="hover:text-emerald-400 transition-colors">Özellikler</a>
            <a href="#sektorler" className="hover:text-emerald-400 transition-colors">Sektörler</a>
            <a href="#karsilastirma" className="hover:text-emerald-400 transition-colors">Neden RandevuGo?</a>
            <a href="#fiyatlandirma" className="hover:text-emerald-400 transition-colors">Fiyatlandırma</a>
            <Link href="/ahmetberber" target="_blank" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <span>Örnek Sayfa</span>
              <ExternalLink className="w-3 h-3 text-emerald-400/70" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors">
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-400/40 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Ücretsiz Başla</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-16 pb-28 px-4 overflow-hidden">
        {/* Background Futuristic Calendar Grid & Glowing Wave Image */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          <Image
            src="/hero/randevugo-bg.png"
            alt="RandevuGo Teknoloji Arka Planı"
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-60 sm:opacity-70 scale-105"
          />
          {/* Radial & linear masks so text stays ultra-readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080c10]/75 via-[#080c10]/35 to-[#080c10]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#080c10_90%)]" />
        </div>

        {/* Ambient Glows */}
        <div className="hero-orb-1" />
        <div className="hero-orb-2" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-14">
            {/* Pill Badge */}
            <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1.5 text-xs font-semibold text-emerald-300 mb-6 backdrop-blur-xl shadow-lg shadow-emerald-950/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Berberler ve güzellik merkezleri için özel</span>
            </div>

            {/* Headline matching user design reference */}
            <h1 className="animate-fade-in delay-100 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.12]">
              Müşterileriniz randevu alsın, <br className="hidden sm:inline" />
              <span className="text-emerald-400">siz işinize odaklanın.</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in delay-200 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-9 leading-relaxed">
              WhatsApp karmaşasını bırakın, tüm randevularınızı tek panelden yönetin.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-sm font-extrabold text-slate-950 shadow-2xl shadow-emerald-500/30 hover:bg-emerald-400 hover:shadow-emerald-400/40 hover:scale-[1.02] transition-all active:scale-95"
              >
                <span>3 Gün Ücretsiz Başla</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/ahmetberber"
                target="_blank"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/60 px-7 py-4 text-sm font-semibold text-slate-200 hover:bg-slate-800/80 hover:border-slate-600 transition-all"
              >
                <div className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 text-slate-300 fill-slate-300 ml-0.5" />
                </div>
                <span>Demo izle</span>
              </Link>
            </div>

            {/* 4 Feature Pills from reference */}
            <div className="animate-fade-in delay-400 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
              {[
                { title: "Kolay Kurulum", sub: "5 dakikada hazır", icon: CheckCircle2 },
                { title: "Online Rezervasyon", sub: "24/7 randevu alımı", icon: CalendarCheck2 },
                { title: "WhatsApp Hatırlatma", sub: "Müşterileriniz unutmasın", icon: MessageCircle },
                { title: "Müşteri Yönetimi", sub: "Tüm bilgiler tek yerde", icon: Users2 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-md"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── HERO SHOWCASE: Barbershop Photo + Mobile Phone Mockup ── */}
          <div className="relative mt-12 max-w-5xl mx-auto">
            {/* Background Luxury Showcase Card */}
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/80 aspect-[16/9] sm:aspect-[21/9] bg-slate-950">
              <Image
                src="/hero/hero-barber-showcase.jpg"
                alt="RandevuGo Berber ve Kuaför Salonu Rezervasyon Sistemi"
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover object-center opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080c10] via-transparent to-transparent opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080c10]/80 via-transparent to-[#080c10]/80" />
            </div>

            {/* Interactive Centered Phone Mockup from the Reference Design */}
            <div className="relative -mt-32 sm:-mt-44 z-20 flex justify-center px-4">
              <div className="relative w-full max-w-[340px] rounded-[44px] p-3 bg-gradient-to-b from-slate-700 via-slate-900 to-slate-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(34,197,94,0.25)] border border-white/15">
                {/* Phone Notch/Island */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-30" />

                {/* Hand-written style callout note */}
                <div className="hidden sm:flex absolute -left-44 top-24 items-center gap-2 text-emerald-300 font-medium text-sm rotate-[-8deg] pointer-events-none">
                  <span className="font-serif italic text-base drop-shadow-md">Tüm randevular<br />tek yerde!</span>
                  <div className="w-12 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-2xl -mt-2" />
                </div>

                {/* Phone Screen */}
                <div className="w-full rounded-[36px] bg-[#0c1015] overflow-hidden text-slate-100 border border-white/[0.06] p-4 pt-7 select-none">
                  {/* Brand Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6 rounded-md overflow-hidden bg-black shrink-0">
                        <Image
                          src="/brand/mascot-logo.png"
                          alt="Logo"
                          fill
                          sizes="24px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <Image
                        src="/brand/randevugo-text-logo.png"
                        alt="RandevuGo"
                        width={95}
                        height={15}
                        className="h-4 w-auto object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="text-[10px] text-slate-400">•••</div>
                  </div>

                  {/* Date Heading */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[11px] text-slate-400">Bugün</div>
                      <div className="text-sm font-bold text-white">12 Mart 2024</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Horizontal Day Selector */}
                  <div className="flex items-center justify-between gap-1 mb-4">
                    {[
                      { day: "Pzt", num: 11 },
                      { day: "Sal", num: 12 },
                      { day: "Çar", num: 13 },
                      { day: "Per", num: 14 },
                      { day: "Cum", num: 15 },
                    ].map((d) => (
                      <button
                        key={d.num}
                        type="button"
                        onClick={() => setSelectedDay(d.num)}
                        className={`flex flex-col items-center justify-center w-12 py-2 rounded-xl text-xs transition-all ${
                          selectedDay === d.num
                            ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30 scale-105"
                            : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/[0.04]"
                        }`}
                      >
                        <span className="text-[10px] opacity-80">{d.day}</span>
                        <span className="text-xs font-extrabold">{d.num}</span>
                      </button>
                    ))}
                  </div>

                  {/* Appointment Cards in Phone */}
                  <div className="space-y-2 mb-4">
                    {[
                      { name: "Ahmet Yılmaz", service: "Saç Kesimi", status: "completed", avatar: "👨🏻" },
                      { name: "Mehmet Demir", service: "Saç + Sakal", status: "completed", avatar: "🧔🏻" },
                      { name: "Ali Kaya", service: "Sakal", status: "pending", avatar: "👨🏽" },
                      { name: "Ayşe Demir", service: "Saç Kesimi", status: "next", avatar: "👩🏻" },
                      { name: "Emre Şahin", service: "Saç + Sakal", status: "next", avatar: "👱🏻" },
                    ].map((apt) => (
                      <div
                        key={apt.name}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-white/[0.05]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs">
                            {apt.avatar}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white leading-tight">{apt.name}</div>
                            <div className="text-[10px] text-slate-400">{apt.service}</div>
                          </div>
                        </div>

                        {apt.status === "completed" && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        {apt.status === "pending" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Bekliyor
                          </span>
                        )}
                        {apt.status === "next" && (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Phone Bottom Tab Bar */}
                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-around text-[10px] text-slate-500">
                    <button
                      type="button"
                      onClick={() => setActivePhoneTab("takvim")}
                      className={`flex flex-col items-center gap-0.5 ${activePhoneTab === "takvim" ? "text-emerald-400 font-bold" : ""}`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>Takvim</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePhoneTab("musteriler")}
                      className={`flex flex-col items-center gap-0.5 ${activePhoneTab === "musteriler" ? "text-emerald-400 font-bold" : ""}`}
                    >
                      <Users2 className="w-4 h-4" />
                      <span>Müşteriler</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePhoneTab("hizmetler")}
                      className={`flex flex-col items-center gap-0.5 ${activePhoneTab === "hizmetler" ? "text-emerald-400 font-bold" : ""}`}
                    >
                      <Scissors className="w-4 h-4" />
                      <span>Hizmetler</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM & SOLUTION (DEFTER vs TEK PANEL - 3 AD CARDS) ── */}
      <section id="karsilastirma" className="py-24 px-4 bg-[#06090d] border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Sorun & Çözüm</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 mb-4">
              Eski Yöntemleri Bırakın, Dijitale Geçin
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              WhatsApp mesajları arasında kaybolan müşteriler, defter karalamaları ve unutulan randevular geride kaldı.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Card 1: Defterle Uğraşma vs Panel */}
            <div className="reveal glass-card rounded-3xl p-7 border border-white/[0.08] relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <span>Öncesi & Sonrası</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Defterle uğraşma. <br />
                  <span className="text-emerald-400">Randevularını tek panelden yönet.</span>
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Karalanmış sayfalar, çakışan saatler ve kimin ne zaman geleceğini unutan personel yerine saniyeler içinde net randevu tablosu.
                </p>

                {/* Before / After graphic mockup */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Before: Defter */}
                  <div className="rounded-2xl p-4 bg-amber-950/20 border border-amber-500/20 relative font-mono text-xs text-amber-200/80 leading-relaxed shadow-inner">
                    <div className="text-[10px] uppercase font-bold text-amber-400 mb-2 border-b border-amber-500/20 pb-1">
                      ❌ Eski Defter Usulü
                    </div>
                    <div className="line-through opacity-70">Ahmet 14:00</div>
                    <div>Mehmet 15:30</div>
                    <div className="text-rose-400 font-bold">Ali ??? (çakıştı)</div>
                    <div>Mustafa 16:00</div>
                    <div className="opacity-60">Emre ? (gelmedi)</div>
                    <div>Selim 17:30</div>
                  </div>

                  {/* After: RandevuGo Panel */}
                  <div className="rounded-2xl p-4 bg-emerald-950/20 border border-emerald-500/30 text-xs">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 mb-2 border-b border-emerald-500/20 pb-1 flex items-center justify-between">
                      <span>✓ RandevuGo</span>
                      <span className="text-[8px] bg-emerald-500/20 px-1 rounded">Aktif</span>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span>09:30 Ahmet Y.</span>
                        <span className="text-emerald-400 text-[9px]">Tamamlandı</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>10:30 Mehmet D.</span>
                        <span className="text-emerald-400 text-[9px]">Tamamlandı</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>11:30 Ali Kaya</span>
                        <span className="text-amber-400 text-[9px]">Bekliyor</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>14:00 Ayşe Demir</span>
                        <span className="text-emerald-400 text-[9px]">Onaylandı</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                <span>3 Gün Ücretsiz Başla</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Card 2: Kaç müşteriyi unutuyorsunuz? WhatsApp Problemi */}
            <div className="reveal glass-card rounded-3xl p-7 border border-white/[0.08] relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Kayıp Ciro & Müşteri Kaybı</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Kaç müşteriyi <br />
                  <span className="text-rose-400">unutuyorsunuz?</span>
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Tıraş yaparken veya müşterinizle ilgilenirken gelen WhatsApp mesajlarına cevap veremediğiniz için giden müşterileri geri kazanın.
                </p>

                {/* Overwhelmed WhatsApp mockup */}
                <div className="rounded-2xl p-4 bg-slate-950/80 border border-white/10 mb-6 relative">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Gelen WhatsApp Mesajları</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                      50+ Okunmamış
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between">
                      <span className="text-slate-300">"Randevu var mı yarın 15:00?"</span>
                      <span className="text-[10px] text-slate-500">11:20</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between">
                      <span className="text-slate-300">"Randevu için müsait misiniz?"</span>
                      <span className="text-[10px] text-slate-500">11:45</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between">
                      <span className="text-slate-300">"Bugün gelebilir miyim boşluk var mı?"</span>
                      <span className="text-[10px] text-slate-500">12:10</span>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                <span>Otomatik Randevuya Geç →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTOR SHOWCASE ── */}
      <section id="sektorler" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12 reveal">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Her Sektöre Uyumlu</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 mb-4">
            İşletmenizin İhtiyacına Göre Özelleşir
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Kuaförden kliniğe, oto servisten güzellik merkezine kadar her sektörün dinamiklerine uygun hazır yapı.
          </p>
        </div>

        {/* Sector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 reveal">
          {SECTORS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSector(sec.id)}
              className={`rounded-full px-5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                activeSector === sec.id
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/25"
                  : "bg-slate-900/70 border border-white/[0.08] text-slate-400 hover:text-white"
              }`}
            >
              {sectorExamples[sec.id]?.emoji} {sec.name}
            </button>
          ))}
        </div>

        {/* Active Sector Card */}
        <div className="reveal rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 sm:p-10 backdrop-blur-xl max-w-5xl mx-auto glow-primary">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{current.emoji}</span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Sektör Çözümü</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">{current.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-lg">{current.desc}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {current.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto flex flex-col items-center gap-3">
              <Link
                href={`/${current.slug}`}
                target="_blank"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3.5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all"
              >
                <Play className="w-4 h-4 fill-emerald-300" />
                <span>Canlı Müşteri Sayfası</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/register"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all"
              >
                <span>Hemen Başla</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <span className="text-[11px] text-slate-500">3 gün ücretsiz deneme</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="ozellikler" className="py-24 px-4 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center mb-16 reveal">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Güçlü Özellikler</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 mb-4">
            İşletmenizi Büyütecek Eksiksiz Araç Kiti
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Online rezervasyon, müşteri takibi, WhatsApp teyidi ve doğrulanmış değerlendirmeler.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Globe, title: "Özel Web Rezervasyon Sayfası", desc: "randevugo.com/sizinisim adresinde anında aktif. Müşterileriniz uygulama indirmeden randevu alır." },
            { icon: Scissors, title: "Hizmet & Personel Yönetimi", desc: "Her personelin çalışma saatini, sunduğu hizmetleri ve molalarını bağımsız planlayın." },
            { icon: MessageCircle, title: "WhatsApp Hatırlatma", desc: "Randevu teyidi ve hatırlatma mesajları ile 'unuttum' diyen randevuları sıfıra indirin." },
            { icon: Star, title: "Doğrulanmış Yorumlar", desc: "Sadece hizmeti alan gerçek müşteriler yorum yapabilir. Google puanınızı ve güveninizi artırın." },
            { icon: CalendarCheck2, title: "Akıllı Takvim & Saat Kapatma", desc: "Günlük, haftalık ve aylık takvim. Beklenmedik durumlarda tek tıkla saat kapatın." },
            { icon: BarChart3, title: "Gelir & Büyüme Analizleri", desc: "En çok kazandıran hizmetleri ve en yoğun günlerinizi tek bakışta görün." },
            { icon: Users2, title: "Müşteri CRM & Geçmiş", desc: "Hangi müşteri ne zaman geldi, hangi hizmeti aldı, özel notları neler tümü kayıt altında." },
            { icon: ShieldCheck, title: "Sabit & Komisyonsuz Fiyat", desc: "Randevu başına komisyon yok! Ayda sadece 89 TL sabit fiyatla tüm özellikler açık." },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="reveal glass-card-hover rounded-3xl border border-white/[0.07] bg-slate-900/40 p-6 backdrop-blur-xl"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="border-y border-white/[0.06] bg-slate-950/60 py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 2400, suffix: "+", label: "Aktif İşletme" },
            { value: 18000, suffix: "+", label: "Aylık Rezervasyon" },
            { value: 98, suffix: "%", label: "Müşteri Memnuniyeti" },
            { value: 89, suffix: " TL", label: "Aylık Sabit Fiyat" },
          ].map((stat) => (
            <div key={stat.label} className="reveal">
              <div className="text-3xl sm:text-5xl font-black text-white mb-1">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs font-semibold text-emerald-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="fiyatlandirma" className="py-24 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-14 reveal">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Şeffaf Fiyatlandırma</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 mb-4">Gizli Ücret Yok, Komisyon Yok</h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
            3 gün boyunca tüm özellikleri ücretsiz deneyin. Beğenirseniz ayda sadece ₺89.
          </p>
        </div>

        <div className="reveal rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 via-slate-900/90 to-slate-900/90 p-8 sm:p-12 backdrop-blur-2xl shadow-2xl relative overflow-hidden glow-primary">
          <div className="relative z-10 text-center">
            <div className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 text-xs font-bold text-emerald-400 mb-6">
              🎉 3 Gün Ücretsiz Deneme Hediyesiyle
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">RandevuGo İşletme Paketi</h3>
            <p className="text-xs text-slate-400 mb-6">Tüm özellikler açık, randevu kotası yok</p>

            <div className="my-6">
              <span className="text-6xl sm:text-7xl font-black text-white">89</span>
              <span className="text-slate-300 text-xl ml-1 font-bold">TL</span>
              <span className="text-slate-500 text-sm ml-1">/ ay</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300 max-w-xl mx-auto mb-8 text-left">
              {[
                "Sınırsız Online Randevu",
                "Sınırsız Hizmet & Personel",
                "Özel Web Sayfası (randevugo.com/siz)",
                "WhatsApp Bildirim Entegrasyonu",
                "Doğrulanmış Müşteri Yorumları",
                "Müşteri CRM ve Ziyaret Geçmişi",
                "Akıllı Takvim & Saat Kapatma",
                "Gelir & Doluluk Analizleri",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-10 py-4 text-base font-extrabold text-slate-950 shadow-2xl shadow-emerald-500/30 hover:bg-emerald-400 hover:scale-105 transition-all active:scale-95"
            >
              <span>3 Gün Ücretsiz Başla</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-slate-500 mt-4">Kredi kartı gerekmez • Anında kurulum</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-4 border-t border-white/[0.06] bg-[#05080c]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-black shrink-0">
              <Image
                src="/brand/mascot-logo.png"
                alt="RandevuGo Maskot Logo"
                fill
                sizes="32px"
                className="object-cover"
                unoptimized
              />
            </div>
            <Image
              src="/brand/randevugo-text-logo.png"
              alt="RandevuGo"
              width={130}
              height={20}
              className="h-5 sm:h-6 w-auto object-contain"
              unoptimized
            />
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-1">
              SaaS v2.0
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">Giriş Yap</Link>
            <Link href="/register" className="hover:text-white transition-colors">Kayıt Ol</Link>
            <Link href="/ahmetberber" target="_blank" className="hover:text-white transition-colors">Canlı Örnek</Link>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} RandevuGo. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
