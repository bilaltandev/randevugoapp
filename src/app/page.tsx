import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CalendarClock,
  Check,
  Contact2,
  Globe,
  Images,
  LayoutTemplate,
  MessageCircle,
  Play,
  Smartphone,
  Star,
  Users2,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { HeroDevices } from "@/components/landing/DeviceMockups";

/* Landing palette: near-black hero with a mint accent, then a cool light content sheet. */
const MINT = "#5BE38F";
const display = "font-[family-name:var(--font-manrope)]";
const shell = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";
const mintButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#5BE38F] font-semibold text-[#04210F] shadow-[0_8px_30px_-8px_rgba(91,227,143,0.55)] transition-colors hover:bg-[#7DEBA7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5BE38F]";

const HERO_STRIP: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: CalendarCheck2, title: "Online rezervasyon", text: "7/24 açık randevu sayfası" },
  { icon: MessageCircle, title: "WhatsApp ile iletişim", text: "Müşteriye tek dokunuşla ulaşın" },
  { icon: Contact2, title: "Müşteri yönetimi", text: "Ziyaret geçmişi ve notlar" },
  { icon: Globe, title: "Kendi sayfanız", text: "calendlygo.com/isletmeniz" },
];

// Photos are the per-sector presets already used by the gallery (lib/gallery/types.ts).
const SECTORS = [
  {
    name: "Berber & kuaför",
    text: "Erkek kuaförleri, berberler",
    img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=75",
  },
  {
    name: "Güzellik & bakım",
    text: "Salonlar, spa, estetik",
    img: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=75",
  },
  {
    name: "Sağlık & klinik",
    text: "Klinikler, diyetisyen, terapist",
    img: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=75",
  },
  {
    name: "Restoran & kafe",
    text: "Masa ve grup rezervasyonu",
    img: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=75",
  },
  {
    name: "Oto servis",
    text: "Bakım, ekspertiz, detaylı temizlik",
    img: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=75",
  },
];

const CORE_FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Globe, title: "Online rezervasyon sayfası", text: "calendlygo.com/isletmeniz adresinde müşterileriniz 7/24 randevu alır." },
  { icon: MessageCircle, title: "WhatsApp ile hızlı iletişim", text: "Randevu sahibine tek dokunuşla WhatsApp'tan yazın." },
  { icon: CalendarClock, title: "Esnek çalışma düzeni", text: "Çalışma saatlerinizi, molalarınızı ve kapalı saatlerinizi siz belirleyin." },
  { icon: Contact2, title: "Müşteri yönetimi", text: "Her müşterinin ziyaretleri, harcaması ve özel notları tek yerde." },
];

const MORE_FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: CalendarCheck2, title: "Akıllı takvim", text: "Gün, hafta ve ay görünümü; boş saate tıklayıp randevu ekleyin." },
  { icon: Users2, title: "Uzman seçimi", text: "Müşteri istediği uzmanı seçer, çakışmalar önlenir." },
  { icon: LayoutTemplate, title: "Temalar ve düzenler", text: "Sayfanızın düzenini ve renklerini birkaç tıkla değiştirin." },
  { icon: Images, title: "Galeri ve portföy", text: "Çalışmalarınızı fotoğraflarla sergileyin." },
  { icon: Star, title: "Doğrulanmış yorumlar", text: "Sadece randevusu tamamlanan müşteriler yorum yazabilir." },
  { icon: BarChart3, title: "İstatistikler", text: "Gelir, yoğun gün ve saatler, tekrar gelen müşteriler." },
  { icon: UtensilsCrossed, title: "Masa planı", text: "Restoranlar için alan ve masa bazlı rezervasyon." },
  { icon: Smartphone, title: "Her cihazda", text: "Panel ve rezervasyon sayfası telefonda da rahat kullanılır." },
];

const PLAN_ITEMS = [
  "Sınırsız online randevu",
  "Sınırsız hizmet ve çalışan",
  "Kendi rezervasyon sayfanız",
  "WhatsApp ile iletişim",
  "Doğrulanmış müşteri yorumları",
  "Müşteri kayıtları ve notlar",
  "Takvim ve saat kapatma",
  "Gelir ve doluluk istatistikleri",
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5BE38F]" aria-label="CalendlyGo ana sayfa">
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-black">
        <Image src="/brand/calendlygo-mark.png" alt="" fill sizes="32px" className="object-cover" unoptimized priority />
      </span>
      <span className="flex flex-col items-start gap-0.5">
        <Image src="/brand/calendlygo-text-logo.png" alt="CalendlyGo" width={124} height={20} className="h-5 w-auto object-contain" unoptimized priority />
        <span className="pl-0.5 text-[9px] font-semibold tracking-[0.22em] text-white/50">by VASTLAB</span>
      </span>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070A0B] font-sans text-white selection:bg-[#5BE38F]/30">
      {/* ═══ HERO ═══ */}
      <div className="relative isolate">
        {/* Emerald wave backdrop; the left-to-right shade keeps the headline readable on any width. */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <Image src="/landing/hero-bg.webp" alt="" fill priority sizes="100vw" className="object-cover object-[70%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070A0B]/85 via-[#070A0B]/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070A0B] to-transparent" />
        </div>

        <header className={`${shell} flex h-20 items-center gap-4 lg:gap-8`}>
          <Wordmark />
          <nav aria-label="Ana menü" className="hidden items-center gap-7 text-sm text-white/70 lg:flex">
            <a href="#ozellikler" className="transition-colors hover:text-white">Özellikler</a>
            <a href="#sektorler" className="transition-colors hover:text-white">Sektörler</a>
            <a href="#fiyatlandirma" className="transition-colors hover:text-white">Fiyatlandırma</a>
            <Link href="/ahmetberber" target="_blank" className="transition-colors hover:text-white">Canlı örnek</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="whitespace-nowrap rounded-full px-2 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white sm:px-3">
              Giriş yap
            </Link>
            <Link href="/register" className={`${mintButton} h-10 whitespace-nowrap px-4 text-sm sm:px-5`}>
              <span className="sm:hidden">Başla</span>
              <span className="hidden sm:inline">Ücretsiz başla</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <section className={`${shell} grid items-center gap-14 pb-16 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6 lg:pb-20 lg:pt-14`}>
          <div>
            <span className="inline-flex items-center rounded-full border border-[#5BE38F]/40 bg-[#5BE38F]/[0.06] px-3.5 py-1.5 text-xs font-medium text-[#8EF0B3]">
              Hepsi bir arada randevu sistemi
            </span>
            <h1 className={`${display} mt-6 text-[clamp(2.6rem,6vw,4.4rem)] font-extrabold leading-[1.02] tracking-[-0.035em]`}>
              İşletmeniz için
              <br />
              akıllı randevu
              <br />
              <span style={{ color: MINT }}>altyapısı.</span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-white/70">
              Randevularınızı tek yerden yönetin, zaman kazanın ve müşterilerinize 7/24 açık bir rezervasyon deneyimi sunun.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className={`${mintButton} h-12 px-7 text-[15px]`}>
                Ücretsiz başla
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/ahmetberber"
                target="_blank"
                className="inline-flex h-12 items-center gap-2.5 rounded-full border border-white/20 px-6 text-[15px] font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#070A0B]">
                  <Play className="ml-0.5 h-3 w-3 fill-current" aria-hidden="true" />
                </span>
                Canlı örneği gör
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
              {["Kolay kurulum", "Kredi kartı gerekmez", "3 gün ücretsiz", "VastLab tarafından geliştirildi"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4" style={{ color: MINT }} aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="pb-8 lg:pb-0">
            <HeroDevices />
          </div>
        </section>

        {/* Feature strip */}
        <div className={`${shell} pb-20`}>
          <ul className="grid grid-cols-1 gap-6 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {HERO_STRIP.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className={`flex items-center gap-3.5 ${i > 0 ? "lg:border-l lg:border-white/10 lg:pl-7" : ""}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#5BE38F]/25 bg-[#5BE38F]/[0.07]">
                  <Icon className="h-5 w-5" style={{ color: MINT }} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">{title}</span>
                  <span className="block text-[13px] text-white/55">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ═══ LIGHT SHEET ═══ */}
      <main className="relative rounded-t-[2.5rem] bg-[#F3F5F4] text-[#0D1117]">
        {/* Sectors */}
        <section id="sektorler" aria-labelledby="sektorler-baslik" className={`${shell} scroll-mt-8 pb-20 pt-20 text-center`}>
          <p className="text-xs font-bold tracking-[0.14em] text-[#0A7B5C]">HER İŞLETME İÇİN</p>
          <h2 id="sektorler-baslik" className={`${display} mt-3 text-[clamp(1.9rem,4vw,2.75rem)] font-extrabold leading-tight tracking-[-0.03em]`}>
            Çalışma şeklinize göre tasarlandı.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#555E6C]">
            CalendlyGo sektörünüze uyum sağlar: restoranda kişi sayısı ve masa, oto serviste plaka, salonda uzman seçimi.
          </p>
          <ul className="mt-12 grid grid-cols-2 gap-4 text-left sm:grid-cols-3 lg:grid-cols-5">
            {SECTORS.map((s) => (
              <li key={s.name} className="overflow-hidden rounded-2xl border border-[#E3E7E5] bg-white shadow-[0_1px_2px_rgba(13,17,23,0.04)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="p-4">
                  <h3 className="text-[15px] font-semibold">{s.name}</h3>
                  <p className="mt-0.5 text-[13px] text-[#687180]">{s.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Everything you need */}
        <section id="ozellikler" aria-labelledby="ozellikler-baslik" className={`${shell} scroll-mt-8 pb-20`}>
          <div className="grid items-center gap-10 rounded-[2rem] border border-[#E3E7E5] bg-gradient-to-br from-white to-[#EEF3F0] p-7 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-[#0A7B5C]">BASİT. GÜÇLÜ. VERİMLİ.</p>
              <h2 id="ozellikler-baslik" className={`${display} mt-3 text-[clamp(1.9rem,3.6vw,2.6rem)] font-extrabold leading-[1.1] tracking-[-0.03em]`}>
                Randevu yönetimi için ihtiyacınız olan her şey.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#555E6C]">
                Zaman kazanın, telefon trafiğini azaltın ve asıl işinize odaklanın.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className={`${mintButton} h-12 px-7 text-[15px] !bg-[#0A7B5C] !text-white shadow-none hover:!bg-[#086A4F]`}>
                  Ücretsiz başla
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#tum-ozellikler"
                  className="inline-flex h-12 items-center rounded-full border border-[#D0D5DD] bg-white px-6 text-[15px] font-medium text-[#0D1117] transition-colors hover:bg-[#F5F6F8]"
                >
                  Tüm özellikler
                </a>
              </div>
            </div>
            <ul className="divide-y divide-[#EDF0EE] rounded-2xl border border-[#E3E7E5] bg-white p-2 shadow-[0_12px_40px_-20px_rgba(13,17,23,0.18)]">
              {CORE_FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-4 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F1]">
                    <Icon className="h-5 w-5 text-[#0A7B5C]" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold">{title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-[#687180]">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* All features */}
        <section id="tum-ozellikler" aria-labelledby="tum-ozellikler-baslik" className={`${shell} scroll-mt-8 pb-24`}>
          <h2 id="tum-ozellikler-baslik" className={`${display} text-2xl font-extrabold tracking-[-0.025em]`}>
            Ve daha fazlası
          </h2>
          <ul className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {MORE_FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon className="h-5 w-5 text-[#0A7B5C]" aria-hidden="true" />
                <h3 className="mt-3 text-[15px] font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#687180]">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing */}
        <section id="fiyatlandirma" aria-labelledby="fiyat-baslik" className="scroll-mt-8 border-t border-[#E3E7E5] bg-white py-24">
          <div className={`${shell} grid items-center gap-12 lg:grid-cols-2`}>
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-[#0A7B5C]">ŞEFFAF FİYATLANDIRMA</p>
              <h2 id="fiyat-baslik" className={`${display} mt-3 text-[clamp(1.9rem,3.6vw,2.6rem)] font-extrabold leading-[1.1] tracking-[-0.03em]`}>
                Tek paket, gizli ücret ve komisyon yok.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#555E6C]">
                3 gün boyunca bütün özellikleri ücretsiz deneyin. Devam etmek isterseniz aylık sabit ücret ödersiniz; randevu başına kesinti yok.
              </p>
            </div>
            <div className="rounded-[2rem] border border-[#E3E7E5] bg-[#F7F9F8] p-8 sm:p-10">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-semibold">İşletme paketi</h3>
                <span className="rounded-full bg-[#EAF6F1] px-3 py-1 text-xs font-semibold text-[#075A43]">3 gün ücretsiz</span>
              </div>
              <p className="mt-6">
                <span className={`${display} text-6xl font-extrabold tracking-[-0.04em]`}>₺89</span>
                <span className="ml-1 text-base text-[#687180]">/ ay</span>
              </p>
              <ul className="mt-8 grid gap-3 text-sm text-[#454E5C] sm:grid-cols-2">
                {PLAN_ITEMS.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-[#0A7B5C]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-9 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0A7B5C] text-[15px] font-semibold text-white transition-colors hover:bg-[#086A4F]"
              >
                3 gün ücretsiz başla
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <p className="mt-3 text-center text-xs text-[#687180]">Kredi kartı gerekmez, kurulum birkaç dakika sürer.</p>
            </div>
          </div>
        </section>

        {/* Closing band */}
        <section className="bg-[#F3F5F4] py-20">
          <div className={shell}>
            <div
              className="relative overflow-hidden rounded-[2rem] bg-[#070A0B] px-8 py-14 text-center text-white sm:px-14"
              style={{ background: "radial-gradient(70% 90% at 50% 120%, rgba(91,227,143,0.25), transparent 70%), #070A0B" }}
            >
              <h2 className={`${display} mx-auto max-w-2xl text-[clamp(1.8rem,3.6vw,2.6rem)] font-extrabold leading-[1.1] tracking-[-0.03em]`}>
                Randevularınızı bugün dijitale taşıyın.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-white/65">
                Sayfanızı birkaç dakikada kurun, bağlantınızı paylaşın, ilk online randevunuzu alın.
              </p>
              <Link href="/register" className={`${mintButton} mt-8 h-12 px-8 text-[15px]`}>
                Ücretsiz başla
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#070A0B]">
        <div className={`${shell} flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between`}>
          <Wordmark />
          <nav aria-label="Alt menü" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
            <Link href="/login" className="hover:text-white">Giriş yap</Link>
            <Link href="/register" className="hover:text-white">Kayıt ol</Link>
            <Link href="/ahmetberber" target="_blank" className="hover:text-white">Canlı örnek</Link>
            <a href="#fiyatlandirma" className="hover:text-white">Fiyatlandırma</a>
          </nav>
          <p className="text-xs text-white/40">© {new Date().getFullYear()} CalendlyGo, bir VastLab ürünüdür. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
