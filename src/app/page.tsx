import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  Check,
  Images,
  LayoutTemplate,
  Smartphone,
  Star,
  Users2,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { HeroDevices } from "@/components/landing/DeviceMockups";
import { FeatureStory } from "@/components/landing/FeatureStory";
import { HeroCalendar } from "@/components/landing/HeroCalendar";
import { HeroStage, HeroTitle } from "@/components/landing/HeroStage";
import { StoreBadges } from "@/components/landing/StoreBadges";
import { ThemeShowcase, type ShowcaseTheme } from "@/components/landing/ThemeShowcase";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { ADSENSE_SCRIPT } from "@/lib/adsense";
import { PRIVACY_NOTICE_PATH } from "@/lib/privacyNotice";
import { FREE_MONTHLY_BOOKINGS, PLAN_PRICES_TRY, YEARLY_FREE_MONTHS, formatTRY } from "@/lib/plans";
import { getThemeConfig } from "@/lib/themes/registry";

/* Landing palette: petrol, the color of an ink-blue appointment book, with the brand's mint for what's booked. */
const MINT = "#5BE38F";
const display = "font-[family-name:var(--font-manrope)]";
const shell = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";
const heading = `${display} text-[clamp(2.25rem,5.2vw,4rem)] font-semibold leading-[1.04] tracking-[-0.04em]`;
const lead = "mt-4 max-w-xl text-lg leading-relaxed text-[#EAF2EE]/70";
const mintButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#5BE38F] font-semibold text-[#04210F] transition-colors hover:bg-[#7DEBA7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5BE38F]";

// Photos are the per-sector presets already used by the gallery (lib/gallery/types.ts). Names and prices are samples.
const SHOWCASE: { sector: string; text: string; themeId: string; sample: string; photo: string; services: [string, string][] }[] = [
  {
    sector: "Berber",
    text: "Sinematik kapak, defter düzeninde hizmetler.",
    themeId: "noir-usta",
    sample: "Usta Berber",
    photo: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=640&q=70",
    services: [["Saç kesimi", "₺450"], ["Sakal tıraşı", "₺250"], ["Damat tıraşı", "₺1.500"]],
  },
  {
    sector: "Güzellik",
    text: "Kemer portre, yumuşak katmanlar ve zarif yazı.",
    themeId: "porselen",
    sample: "Atelier Gül",
    photo: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=640&q=70",
    services: [["Cilt bakımı", "₺1.200"], ["Manikür", "₺400"], ["Keratin bakımı", "₺2.000"]],
  },
  {
    sector: "Klinik",
    text: "Bilgiler bir bakışta, güven veren sakin bir sayfa.",
    themeId: "berrak",
    sample: "Berrak Klinik",
    photo: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=640&q=70",
    services: [["İlk muayene", "₺900"], ["Kontrol", "₺500"], ["Diş temizliği", "₺1.100"]],
  },
  {
    sector: "Restoran",
    text: "Tam ekran lezzet, menü düzeninde masa rezervasyonu.",
    themeId: "sofra",
    sample: "Köz Sofrası",
    photo: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=640&q=70",
    services: [["Akşam yemeği", "₺900"], ["Tadım menüsü", "₺1.600"], ["Grup masası", "₺2.400"]],
  },
  {
    sector: "Oto servis",
    text: "Çapraz kapak, güçlü harfler ve hızlı kartlar.",
    themeId: "pist",
    sample: "Pist Garaj",
    photo: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=640&q=70",
    services: [["Periyodik bakım", "₺3.500"], ["Detaylı temizlik", "₺1.800"], ["Ekspertiz", "₺2.200"]],
  },
];

// Only what the showcase paints with, so the whole theme registry stays out of the browser bundle.
const SHOWCASE_THEMES: ShowcaseTheme[] = SHOWCASE.map(({ themeId, ...rest }) => {
  const t = getThemeConfig(themeId);
  return {
    ...rest,
    id: t.id,
    name: t.name,
    signature: t.signature ?? "noir",
    uppercase: t.typography.headingStyle === "uppercase",
    colors: { background: t.colors.background, surface: t.colors.surface, primary: t.colors.primary, text: t.colors.text, muted: t.colors.mutedText, border: t.colors.border },
    font: t.typography.headingFont,
  };
});

const MORE_FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: CalendarCheck2, title: "Akıllı takvim", text: "Gün, hafta ve ay görünümü; boş saate tıklayıp randevu ekleyin." },
  { icon: Users2, title: "Uzman seçimi", text: "Müşteri istediği uzmanı seçer, çakışmalar önlenir." },
  { icon: LayoutTemplate, title: "Temalar ve düzenler", text: "14 hazır tema ve ücretli paketlerde sektörünüze özel 5 premium tema." },
  { icon: Images, title: "Galeri ve portföy", text: "Çalışmalarınızı fotoğraflarla sergileyin." },
  { icon: Star, title: "Doğrulanmış yorumlar", text: "Sadece randevusu tamamlanan müşteriler yorum yazabilir." },
  { icon: BarChart3, title: "İstatistikler", text: "Gelir, yoğun gün ve saatler, tekrar gelen müşteriler." },
  { icon: UtensilsCrossed, title: "Masa planı", text: "Restoranlar için alan ve masa bazlı rezervasyon." },
  { icon: Smartphone, title: "Her cihazda", text: "Panel ve rezervasyon sayfası telefonda da rahat kullanılır." },
];

const PRICING: { name: string; tagline: string; items: string[]; highlight?: boolean; plan?: "PERSON" | "TEAM" }[] = [
  {
    name: "Ücretsiz",
    tagline: "Yeni başlayanlar için",
    items: [`Ayda ${FREE_MONTHLY_BOOKINGS} randevu`, "Kendi rezervasyon sayfanız", "Müşteri yönetimi", "Mobil uygulama", "Reklamlı kullanım"],
  },
  {
    name: "Person",
    tagline: "Tek başına çalışanlar için",
    plan: "PERSON",
    items: ["Sınırsız randevu", "Reklamsız kullanım", "5 premium sektör teması", "Sayfa düzenleyici ve galeri", "Müşteri yönetimi ve mobil uygulama"],
  },
  {
    name: "Team",
    tagline: "Ekipler için",
    plan: "TEAM",
    highlight: true,
    items: ["Person paketindeki her şey", "5 ekip üyesine kadar davet", "Müşteri uzmanını seçer", "Her üye kendi randevularını görür", "Tek ödeme: ücreti yalnızca siz ödersiniz"],
  },
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5BE38F]" aria-label="CalendlyGo ana sayfa">
      <span className="relative h-10 w-10 shrink-0 rounded-lg">
        <Image src="/brand/calendlygo-mark.png" alt="" fill sizes="40px" className="object-contain" priority />
      </span>
      <span className="flex flex-col items-start gap-0.5">
        <Image src="/brand/calendlygo-text-logo.png" alt="CalendlyGo" width={124} height={20} className="h-5 w-auto object-contain" unoptimized priority />
        <span className="pl-0.5 text-[10px] font-semibold text-white/50">by VASTLAB</span>
      </span>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <MotionRoot>
      <div className="min-h-screen overflow-x-clip bg-[#062A30] font-sans text-[#EAF2EE] selection:bg-[#5BE38F]/30">
        {/* Google's site check reads this. Only here, never site-wide: auto ads must stay off the booking pages. */}
        <script async src={ADSENSE_SCRIPT} crossOrigin="anonymous" />
        <header className="fixed inset-x-0 top-0 z-50 bg-[#062A30]/55 backdrop-blur-xl">
          <div className={`${shell} flex h-16 items-center gap-4 lg:gap-8`}>
            <Wordmark />
            <nav aria-label="Ana menü" className="hidden items-center gap-7 text-sm text-[#EAF2EE]/75 lg:flex">
              <a href="#temalar" className="transition-colors hover:text-white">Temalar</a>
              <a href="#ozellikler" className="transition-colors hover:text-white">Nasıl çalışır</a>
              <a href="#fiyatlandirma" className="transition-colors hover:text-white">Fiyatlar</a>
              <Link href="/ahmetberber" target="_blank" className="transition-colors hover:text-white">Örnek sayfa</Link>
            </nav>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Link href="/login" className="whitespace-nowrap rounded-full px-2 py-2 text-sm font-medium text-[#EAF2EE]/85 transition-colors hover:text-white sm:px-3">
                Giriş yap
              </Link>
              <Link href="/register" className={`${mintButton} h-10 whitespace-nowrap px-4 text-sm`}>
                <span className="sm:hidden">Başla</span>
                <span className="hidden sm:inline">Ücretsiz başla</span>
              </Link>
            </div>
          </div>
        </header>

        {/* The 3D calendar is the page's one big gesture: bookings arriving on their own. */}
        <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden">
          <HeroCalendar className="absolute inset-0 -z-20" />
          <div
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,#062A30_42%,rgba(6,42,48,0.78)_62%,transparent_82%)] lg:bg-[linear-gradient(to_top,#062A30_4%,rgba(6,42,48,0.55)_34%,transparent_66%),linear-gradient(to_right,#062A30_8%,rgba(6,42,48,0.82)_38%,transparent_68%)]"
            aria-hidden="true"
          />
          <div className={`${shell} pb-12 pt-32 sm:pb-16`}>
            <HeroTitle
              className={`${display} max-w-[13ch] text-[clamp(3rem,9.4vw,7.5rem)] font-semibold leading-[0.98] tracking-[-0.05em]`}
              lines={["Takviminiz", "kendiliğinden", "dolsun."]}
            />
            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="max-w-xl text-[clamp(1.05rem,1.6vw,1.25rem)] leading-relaxed text-[#EAF2EE]/80">
                  Müşterileriniz size özel sayfanızdan boş saati seçer, randevu takviminize düşer. Telefona bakmanız gerekmez.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/register" className={`${mintButton} h-12 px-7 text-[15px]`}>
                    Ücretsiz başla
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/ahmetberber"
                    target="_blank"
                    className="inline-flex h-12 items-center rounded-full border border-[#EAF2EE]/25 px-6 text-[15px] font-medium transition-colors hover:border-[#EAF2EE]/50"
                  >
                    Örnek sayfayı gör
                  </Link>
                </div>
              </div>
              <StoreBadges className="!justify-start lg:!justify-end" />
            </div>
          </div>
        </section>

        <main>
          {/* The product itself, settling flat as it scrolls in */}
          <section aria-label="Panel ve rezervasyon ekranı" className={`${shell} pb-32 pt-20`}>
            <div className="grid gap-4 lg:grid-cols-2 lg:items-end">
              <h2 className={heading}>İşletmeniz tek ekranda.</h2>
              <p className="text-lg leading-relaxed text-[#EAF2EE]/70 lg:justify-self-end lg:max-w-md">
                Takvim, müşteriler ve gelir panelde. Müşteriniz telefonundan saniyeler içinde randevu alır.
              </p>
            </div>
            <HeroStage className="mx-auto mt-16 max-w-4xl text-left">
              <HeroDevices />
            </HeroStage>
          </section>

          <section id="temalar" aria-labelledby="temalar-baslik" className={`${shell} scroll-mt-20 pb-32`}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="temalar-baslik" className={heading}>Sektörünüz, kendi sayfası.</h2>
              <p className={`${lead} mx-auto`}>Bir sektör seçin ve temasını görün. Yazıları, fotoğrafları ve logoyu kendinize göre değiştirirsiniz.</p>
            </div>
            <div className="mt-10">
              <ThemeShowcase themes={SHOWCASE_THEMES} />
            </div>
          </section>

          <section id="ozellikler" aria-labelledby="ozellikler-baslik" className={`${shell} scroll-mt-20 pb-32`}>
            <h2 id="ozellikler-baslik" className={`${heading} max-w-3xl`}>Telefon trafiği azalır, siz işinize bakarsınız.</h2>
            <FeatureStory />
          </section>

          <section aria-labelledby="tum-ozellikler-baslik" className={`${shell} pb-32`}>
            <h2 id="tum-ozellikler-baslik" className={`${heading} text-[clamp(1.75rem,3.2vw,2.5rem)]`}>Bir işletmenin ihtiyacı olan diğer her şey</h2>
            <ul className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {MORE_FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <Icon className="h-5 w-5" style={{ color: MINT }} aria-hidden="true" />
                  <h3 className="mt-3 text-[17px] font-semibold">{title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-[#EAF2EE]/65">{text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="fiyatlandirma" aria-labelledby="fiyat-baslik" className="scroll-mt-16 bg-[#041F24] py-28">
            <div className={shell}>
              <h2 id="fiyat-baslik" className={heading}>Ücretsiz başlayın, işiniz büyüdükçe yükseltin.</h2>
              <p className={lead}>Randevu başına kesinti ve gizli ücret yok.</p>

              <div className="mt-12 grid gap-4 lg:grid-cols-3">
                {PRICING.map(({ name, tagline, items, highlight, plan }) => {
                  const prices = plan ? PLAN_PRICES_TRY[plan] : null;
                  return (
                    <article key={name} className={`flex flex-col rounded-[1.75rem] p-8 ${highlight ? "bg-[#5BE38F] text-[#04210F]" : "bg-[#0A343B]"}`}>
                      <h3 className="text-[22px] font-semibold tracking-[-0.02em]">{name}</h3>
                      <p className={`text-sm ${highlight ? "text-[#04210F]/70" : "text-[#EAF2EE]/65"}`}>{tagline}</p>
                      <p className="mt-6">
                        <span className={`${display} text-[52px] font-semibold leading-none tracking-[-0.045em]`}>{formatTRY(prices?.MONTHLY ?? 0)}</span>
                        <span className={`ml-1 text-base ${highlight ? "text-[#04210F]/70" : "text-[#EAF2EE]/65"}`}>/ ay</span>
                      </p>
                      <p className={`mt-2 min-h-11 text-sm leading-[22px] ${highlight ? "text-[#04210F]/75" : "text-[#EAF2EE]/70"}`}>
                        {prices ? (
                          <>
                            Yıllık ödeyin: <span className="font-semibold">{formatTRY(Math.floor(prices.YEARLY / 12))} / ay</span>
                            <br />
                            {formatTRY(prices.YEARLY)} <span className="line-through">{formatTRY(prices.MONTHLY * 12)}</span>, {YEARLY_FREE_MONTHS} ay bedava
                          </>
                        ) : (
                          "Süresiz ücretsiz, kredi kartı gerekmez"
                        )}
                      </p>
                      <ul className="mt-6 flex-1 space-y-3 text-sm">
                        {items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: highlight ? "#04210F" : MINT }} aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/register"
                        className={`mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-colors ${
                          highlight ? "bg-[#04210F] text-[#EAF2EE] hover:bg-black" : "bg-[#EAF2EE] text-[#062A30] hover:bg-white"
                        }`}
                      >
                        {plan ? `${name} ile başla` : "Ücretsiz başla"}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={`${shell} py-28 text-center`}>
            <h2 className={`${display} mx-auto max-w-3xl text-[clamp(2.5rem,6.5vw,5rem)] font-semibold leading-[1.02] tracking-[-0.045em]`}>
              İlk online randevunuzu bugün alın.
            </h2>
            <p className={`${lead} mx-auto`}>Sayfanızı birkaç dakikada kurun, bağlantınızı paylaşın.</p>
            <Link href="/register" className={`${mintButton} mt-8 h-12 px-8 text-[15px]`}>
              Ücretsiz başla
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        </main>

        <footer className="border-t border-white/10">
          <div className={`${shell} flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between`}>
            <Wordmark />
            <nav aria-label="Alt menü" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#EAF2EE]/65">
              <Link href="/login" className="hover:text-white">Giriş yap</Link>
              <Link href="/register" className="hover:text-white">Kayıt ol</Link>
              <Link href="/ahmetberber" target="_blank" className="hover:text-white">Örnek sayfa</Link>
              <a href="#fiyatlandirma" className="hover:text-white">Fiyatlar</a>
              <Link href={PRIVACY_NOTICE_PATH} className="hover:text-white">Aydınlatma Metni</Link>
            </nav>
            <p className="text-xs text-[#EAF2EE]/50">© {new Date().getFullYear()} CalendlyGo, bir VastLab ürünüdür.</p>
          </div>
        </footer>
      </div>
    </MotionRoot>
  );
}
