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
import { Aurora } from "@/components/Aurora";
import { HeroDevices } from "@/components/landing/DeviceMockups";
import { PRIVACY_NOTICE_PATH } from "@/lib/privacyNotice";
import { PLAN_PRICES, formatUSD, yearlySavingPercent } from "@/lib/plans";

/* Landing palette: a black hero over slow light with a mint accent, then Apple's light gray for the content. */
const MINT = "#5BE38F";
const display = "font-[family-name:var(--font-manrope)]";
const shell = "mx-auto w-full max-w-[1120px] px-5 sm:px-8";
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
  "Sınırsız hizmet",
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
      <span className="relative h-10 w-10 shrink-0 rounded-lg">
        <Image src="/brand/calendlygo-mark.png" alt="" fill sizes="40px" className="object-contain" unoptimized priority />
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
    <div className="min-h-screen overflow-x-clip bg-black font-sans text-white selection:bg-[#5BE38F]/30">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl backdrop-saturate-150">
        <div className={`${shell} flex h-14 items-center gap-4 lg:gap-8`}>
          <Wordmark />
          <nav aria-label="Ana menü" className="hidden items-center gap-7 text-[13px] text-white/70 lg:flex">
            <a href="#ozellikler" className="transition-colors hover:text-white">Özellikler</a>
            <a href="#sektorler" className="transition-colors hover:text-white">Sektörler</a>
            <a href="#fiyatlandirma" className="transition-colors hover:text-white">Fiyatlandırma</a>
            <Link href="/ahmetberber" target="_blank" className="transition-colors hover:text-white">Canlı örnek</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-medium text-white/80 transition-colors hover:text-white sm:px-3">
              Giriş yap
            </Link>
            <Link href="/register" className={`${mintButton} h-8 whitespace-nowrap px-3.5 text-[13px]`}>
              <span className="sm:hidden">Başla</span>
              <span className="hidden sm:inline">Ücretsiz başla</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <div className="relative isolate overflow-hidden">
        <div className="admin-shell absolute inset-0 -z-10">
          <Aurora />
        </div>

        <section className={`${shell} pb-16 pt-20 text-center sm:pt-28`}>
          <p className="text-[17px] font-medium" style={{ color: MINT }}>Hepsi bir arada randevu sistemi</p>
          <h1 className={`${display} mx-auto mt-4 max-w-4xl text-[clamp(2.6rem,8vw,5.75rem)] font-semibold leading-[1.02] tracking-[-0.045em]`}>
            Akıllı randevu
            <br />
            altyapınız.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[clamp(1.05rem,2vw,1.35rem)] leading-relaxed text-white/65">
            Randevularınızı tek yerden yönetin, zaman kazanın ve müşterilerinize 7/24 açık bir rezervasyon deneyimi sunun.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={`${mintButton} h-12 px-7 text-[15px]`}>
              Ücretsiz başla
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/ahmetberber"
              target="_blank"
              className="inline-flex h-12 items-center gap-2.5 rounded-full border border-white/20 px-6 text-[15px] font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              Canlı örneği gör
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/50">3 gün ücretsiz · Kredi kartı gerekmez · VastLab tarafından geliştirildi</p>
          <div className="mx-auto mt-16 max-w-3xl text-left">
            <HeroDevices />
          </div>
        </section>

        {/* Feature strip */}
        <div className={`${shell} pb-20`}>
          <ul className="grid grid-cols-1 gap-8 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {HERO_STRIP.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon className="h-5 w-5" style={{ color: MINT }} aria-hidden="true" />
                <span className="mt-3 block text-[15px] font-semibold">{title}</span>
                <span className="mt-0.5 block text-[13px] text-white/55">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ═══ LIGHT SHEET ═══ */}
      <main className="relative bg-[#F5F5F7] text-[#1D1D1F]">
        {/* Sectors */}
        <section id="sektorler" aria-labelledby="sektorler-baslik" className={`${shell} scroll-mt-20 pb-24 pt-28 text-center`}>
          <p className="text-[17px] font-semibold text-[#0A7B5C]">Her işletme için</p>
          <h2 id="sektorler-baslik" className={`${display} mt-3 text-[clamp(2.2rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.04em]`}>
            Çalışma şeklinize göre tasarlandı.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[19px] leading-relaxed text-[#6E6E73]">
            CalendlyGo sektörünüze uyum sağlar: restoranda kişi sayısı ve masa, oto serviste plaka, salonda uzman seçimi.
          </p>
          <ul className="mt-12 grid grid-cols-2 gap-4 text-left sm:grid-cols-3 lg:grid-cols-5">
            {SECTORS.map((s) => (
              <li key={s.name} className="overflow-hidden rounded-[1.5rem] bg-white transition-transform duration-300 hover:scale-[1.02]">
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
        <section id="ozellikler" aria-labelledby="ozellikler-baslik" className={`${shell} scroll-mt-20 pb-24`}>
          <div className="grid items-center gap-10 rounded-[2rem] bg-white p-7 sm:p-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <p className="text-[17px] font-semibold text-[#0A7B5C]">Basit. Güçlü. Verimli.</p>
              <h2 id="ozellikler-baslik" className={`${display} mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.04em]`}>
                Randevu yönetimi için ihtiyacınız olan her şey.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#555E6C]">
                Zaman kazanın, telefon trafiğini azaltın ve asıl işinize odaklanın.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className={`${mintButton} h-12 px-7 text-[15px] !bg-[#1D1D1F] !text-white shadow-none hover:!bg-black`}>
                  Ücretsiz başla
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#tum-ozellikler"
                  className="inline-flex h-12 items-center rounded-full px-5 text-[15px] font-medium text-[#0A7B5C] transition-colors hover:bg-[#F5F5F7]"
                >
                  Tüm özellikler
                </a>
              </div>
            </div>
            <ul className="divide-y divide-black/[0.06]">
              {CORE_FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-4 py-5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#0A7B5C]" aria-hidden="true" />
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
        <section id="tum-ozellikler" aria-labelledby="tum-ozellikler-baslik" className={`${shell} scroll-mt-20 pb-28`}>
          <h2 id="tum-ozellikler-baslik" className={`${display} text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.04em]`}>
            Ve daha fazlası
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MORE_FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-[1.5rem] bg-white p-6">
                <Icon className="h-5 w-5 text-[#0A7B5C]" aria-hidden="true" />
                <h3 className="mt-3 text-[15px] font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#687180]">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing */}
        <section id="fiyatlandirma" aria-labelledby="fiyat-baslik" className="scroll-mt-20 bg-white py-28">
          <div className={`${shell} grid items-center gap-12 lg:grid-cols-2`}>
            <div>
              <p className="text-[17px] font-semibold text-[#0A7B5C]">Şeffaf fiyatlandırma</p>
              <h2 id="fiyat-baslik" className={`${display} mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.04em]`}>
                İki paket, gizli ücret ve komisyon yok.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#555E6C]">
                3 gün boyunca bütün özellikleri ücretsiz deneyin. Devam etmek isterseniz aylık ya da yıllık sabit ücret ödersiniz; randevu başına kesinti yok.
              </p>
            </div>
            <div className="rounded-[2rem] bg-[#F5F5F7] p-8 sm:p-10">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-semibold">Person</h3>
                <span className="rounded-full bg-[#EAF6F1] px-3 py-1 text-xs font-semibold text-[#075A43]">3 gün ücretsiz</span>
              </div>
              <p className="mt-6">
                <span className={`${display} text-6xl font-semibold tracking-[-0.045em]`}>{formatUSD(PLAN_PRICES.PERSON.MONTHLY)}</span>
                <span className="ml-1 text-base text-[#687180]">/ ay</span>
              </p>
              <p className="mt-2 text-sm text-[#454E5C]">
                Yıllık {formatUSD(PLAN_PRICES.PERSON.YEARLY)} (%{yearlySavingPercent("PERSON")} indirim) · Ekibinizle çalışıyorsanız{" "}
                <span className="font-semibold">Team</span>: {formatUSD(PLAN_PRICES.TEAM.MONTHLY)} / ay veya {formatUSD(PLAN_PRICES.TEAM.YEARLY)} / yıl
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
                className="mt-9 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1D1D1F] text-[15px] font-semibold text-white transition-colors hover:bg-black"
              >
                3 gün ücretsiz başla
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <p className="mt-3 text-center text-xs text-[#687180]">Kredi kartı gerekmez, kurulum birkaç dakika sürer.</p>
            </div>
          </div>
        </section>

        {/* Closing band */}
        <section className="bg-white pb-28">
          <div className={shell}>
            <div
              className="relative overflow-hidden rounded-[2rem] bg-black px-8 py-20 text-center text-white sm:px-14"
              style={{ background: "radial-gradient(70% 90% at 50% 120%, rgba(91,227,143,0.22), transparent 70%), #000" }}
            >
              <h2 className={`${display} mx-auto max-w-2xl text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.04em]`}>
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
      <footer className="bg-black">
        <div className={`${shell} flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between`}>
          <Wordmark />
          <nav aria-label="Alt menü" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
            <Link href="/login" className="hover:text-white">Giriş yap</Link>
            <Link href="/register" className="hover:text-white">Kayıt ol</Link>
            <Link href="/ahmetberber" target="_blank" className="hover:text-white">Canlı örnek</Link>
            <a href="#fiyatlandirma" className="hover:text-white">Fiyatlandırma</a>
            <Link href={PRIVACY_NOTICE_PATH} className="hover:text-white">Aydınlatma Metni</Link>
          </nav>
          <p className="text-xs text-white/40">© {new Date().getFullYear()} CalendlyGo, bir VastLab ürünüdür. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
