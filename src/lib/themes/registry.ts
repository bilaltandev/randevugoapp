import { ThemeConfig, SectorType } from "./types";

export const THEME_REGISTRY: Record<string, ThemeConfig> = {
  "premium-dark": {
    id: "premium-dark",
    name: "Premium Dark",
    tagline: "Lüks ve neon vurgulu koyu atmosfer",
    description:
      "Siyah ve antrasit arka plan, neon zümrüt aksanlar, cam efektli kartlar ve etkileyici büyük başlıklar. Hizmetlerinizi en prestijli şekilde öne çıkarır.",
    badge: "Çok Popüler",
    supportedCategories: ["BERBER", "OTO_SERVIS", "DIGER"],
    categoryLabels: ["Berber", "Erkek Kuaförü", "Oto Detay", "Premium Servis"],
    styleCategory: "dark",
    isPremium: false,
    isBeta: false,
    orderIndex: 1,

    colors: {
      background: "#080C10",
      surface: "#101620",
      surfaceHover: "#161F2E",
      primary: "#00C98D",
      primaryHover: "#00B37D",
      secondary: "#38BDF8",
      text: "#F8FAFC",
      mutedText: "#94A3B8",
      border: "#1E293B",
      borderLight: "#334155",
      ring: "#00C98D",
      accentGlow: "rgba(0, 201, 141, 0.15)",
      badgeBg: "rgba(0, 201, 141, 0.12)",
      badgeText: "#00C98D",
    },

    typography: {
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "extraBold",
      bodyStyle: "modern",
    },

    radius: "large",

    hero: {
      layout: "centered",
      backgroundType: "gradient",
      showStats: true,
      align: "center",
    },

    sections: {
      services: "darkGlass",
      reviews: "gridQuotes",
      employees: "profileCards",
      booking: "modernDark",
      location: "cardGlass",
    },

    suggestedAccents: [
      { name: "Neon Zümrüt", hex: "#00C98D", label: "Orijinal Neon" },
      { name: "Elektrik Mavi", hex: "#38BDF8", label: "Buz Mavisi" },
      { name: "Mor Alev", hex: "#A855F7", label: "Asil Mor" },
      { name: "Altın Sarısı", hex: "#F59E0B", label: "Lüks Altın" },
      { name: "Kızıl Ateş", hex: "#EF4444", label: "Agresif Kırmızı" },
    ],
  },

  "modern-light": {
    id: "modern-light",
    name: "Modern Light",
    tagline: "Ferah beyaz ve kurumsal temizlik",
    description:
      "Bembeyaz arka plan, açık gri gölgeli kartlar, minimal ve ultra temiz tipografi. Sağlık, danışmanlık ve kurumsal güven veren işletmeler için ideal.",
    badge: "Önerilen",
    supportedCategories: ["KLINIK", "DIGER", "GUZELLIK"],
    categoryLabels: ["Klinik", "Danışmanlık", "Sağlık", "Kurumsal"],
    styleCategory: "light",
    isPremium: false,
    isBeta: false,
    orderIndex: 2,

    colors: {
      background: "#F8FAFC",
      surface: "#FFFFFF",
      surfaceHover: "#F1F5F9",
      primary: "#2563EB",
      primaryHover: "#1D4ED8",
      secondary: "#0EA5E9",
      text: "#0F172A",
      mutedText: "#64748B",
      border: "#E2E8F0",
      borderLight: "#CBD5E1",
      ring: "#2563EB",
      accentGlow: "rgba(37, 99, 235, 0.08)",
      badgeBg: "rgba(37, 99, 235, 0.08)",
      badgeText: "#2563EB",
    },

    typography: {
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "bold",
      bodyStyle: "clean" as any,
    },

    radius: "medium",

    hero: {
      layout: "split",
      backgroundType: "clean",
      showStats: true,
      align: "left",
    },

    sections: {
      services: "whiteClean",
      reviews: "minimalBorder",
      employees: "profileCards",
      booking: "cleanLight",
      location: "cleanBox",
    },

    suggestedAccents: [
      { name: "Safir Mavi", hex: "#2563EB", label: "Medikal & Kurumsal" },
      { name: "Deniz Turkuazı", hex: "#0D9488", label: "Sağlık Yeşili" },
      { name: "İndigo Asil", hex: "#6366F1", label: "Modern SaaS" },
      { name: "Haki / Doğa", hex: "#15803D", label: "Organik" },
    ],
  },

  "elegant-gold": {
    id: "elegant-gold",
    name: "Elegant Gold",
    tagline: "Şampanya ve altın yaldızlı lüks",
    description:
      "Koyu espresso ve siyah zemin üzerine altın ve krem detaylar. Yüksek kaliteli spa merkezleri, lüks restoranlar ve VIP güzellik salonları için kusursuz prestij.",
    badge: "Lüks",
    supportedCategories: ["GUZELLIK", "RESTORAN", "BERBER", "DIGER"],
    categoryLabels: ["Güzellik Merkezi", "Spa", "VIP Kuaför", "Lüks Restoran"],
    styleCategory: "luxury",
    isPremium: false,
    isBeta: false,
    orderIndex: 3,

    colors: {
      background: "#0C0A09",
      surface: "#171412",
      surfaceHover: "#231F1C",
      primary: "#D4AF37",
      primaryHover: "#C59B27",
      secondary: "#FDE68A",
      text: "#FAFAF9",
      mutedText: "#A8A29E",
      border: "#292524",
      borderLight: "#44403C",
      ring: "#D4AF37",
      accentGlow: "rgba(212, 175, 55, 0.15)",
      badgeBg: "rgba(212, 175, 55, 0.15)",
      badgeText: "#EAB308",
    },

    typography: {
      headingFont: "Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "serif",
      bodyStyle: "airy",
    },

    radius: "small",

    hero: {
      layout: "centered",
      backgroundType: "gradient",
      showStats: true,
      align: "center",
    },

    sections: {
      services: "luxuryGold",
      reviews: "goldCards",
      employees: "goldFramed",
      booking: "goldAccent",
      location: "goldBox",
    },

    suggestedAccents: [
      { name: "Kraliyet Altını", hex: "#D4AF37", label: "24K Parlak Altın" },
      { name: "Şampanya Krem", hex: "#F3E8C8", label: "Sıcak Şampanya" },
      { name: "Bronz Bakır", hex: "#C27803", label: "Asil Bronz" },
      { name: "Gül Altın (Rose Gold)", hex: "#E09891", label: "Feminen Rose" },
    ],
  },

  "soft-beauty": {
    id: "soft-beauty",
    name: "Soft Beauty",
    tagline: "Pastel tonlar ve yumuşak estetik",
    description:
      "Pudra, açık bej ve gül tonlarında yumuşak hatlı kartlar. Kadın kuaförleri, manikür/nail stüdyoları ve estetik merkezleri için ferahlatıcı görsel dil.",
    badge: "Çok Sevilen",
    supportedCategories: ["GUZELLIK", "DIGER"],
    categoryLabels: ["Güzellik Merkezi", "Nail Studio", "Kadın Kuaförü", "Estetik"],
    styleCategory: "light",
    isPremium: false,
    isBeta: false,
    orderIndex: 4,

    colors: {
      background: "#FFFBF9",
      surface: "#FFFFFF",
      surfaceHover: "#FFF4F2",
      primary: "#F43F5E",
      primaryHover: "#E11D48",
      secondary: "#FB7185",
      text: "#1E1B1B",
      mutedText: "#78716C",
      border: "#FCE7E7",
      borderLight: "#FDE2E4",
      ring: "#F43F5E",
      accentGlow: "rgba(244, 63, 94, 0.12)",
      badgeBg: "rgba(244, 63, 94, 0.08)",
      badgeText: "#E11D48",
    },

    typography: {
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "bold",
      bodyStyle: "airy",
    },

    radius: "full",

    hero: {
      layout: "centered",
      backgroundType: "warm",
      showStats: true,
      align: "center",
    },

    sections: {
      services: "whiteClean",
      reviews: "cleanPills",
      employees: "circularAvatar",
      booking: "cleanLight",
      location: "cleanBox",
    },

    suggestedAccents: [
      { name: "Gül Kurusu", hex: "#F43F5E", label: "Romantik Gül" },
      { name: "Tatlı Şeftali", hex: "#FB923C", label: "Işıltılı Şeftali" },
      { name: "Lavanta Lila", hex: "#C084FC", label: "Pastel Mor" },
      { name: "Nane Ferahlığı", hex: "#2DD4BF", label: "Yumuşak Turkuaz" },
    ],
  },

  "restaurant-classic": {
    id: "restaurant-classic",
    name: "Restaurant Classic",
    tagline: "Görsel menü ve sıcak bistro ortamı",
    description:
      "Büyük iştah açıcı lezzet fotoğrafları, menü kategorileri odaklı yapı ve hızlı masa rezervasyonu. Restoran, cafe ve bistrolar için özel geliştirildi.",
    badge: "Restoran Odaklı",
    supportedCategories: ["RESTORAN", "DIGER"],
    categoryLabels: ["Restoran", "Cafe", "Bistro", "Brunch"],
    styleCategory: "restaurant",
    isPremium: false,
    isBeta: false,
    orderIndex: 5,

    colors: {
      background: "#18181B",
      surface: "#27272A",
      surfaceHover: "#3F3F46",
      primary: "#EA580C",
      primaryHover: "#C2410C",
      secondary: "#F97316",
      text: "#FAFAFA",
      mutedText: "#A1A1AA",
      border: "#3F3F46",
      borderLight: "#52525B",
      ring: "#EA580C",
      accentGlow: "rgba(234, 88, 12, 0.18)",
      badgeBg: "rgba(234, 88, 12, 0.15)",
      badgeText: "#FB923C",
    },

    typography: {
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "bold",
      bodyStyle: "modern",
    },

    radius: "large",

    hero: {
      layout: "split",
      backgroundType: "warm",
      showStats: true,
      align: "left",
    },

    sections: {
      services: "foodCards",
      reviews: "gridQuotes",
      employees: "chefCards",
      booking: "restaurantBooking",
      location: "cardGlass",
    },

    suggestedAccents: [
      { name: "Bistro Turuncusu", hex: "#EA580C", label: "Sıcak & İştah Açıcı" },
      { name: "Şarap Bordosu", hex: "#9F1239", label: "Zengin Bordo" },
      { name: "Zeytin Yeşili", hex: "#65A30D", label: "Akdeniz Mutfağı" },
      { name: "Kahve Karamel", hex: "#B45309", label: "Cafe & Barista" },
    ],
  },

  "restaurant-dark": {
    id: "restaurant-dark",
    name: "Restaurant Dark",
    tagline: "Fine-dining ve loş gece atmosferi",
    description:
      "Karanlık ve gizemli gastronomi ortamı, büyük sinematik hero, özel şef spesiyalleri ve VIP rezervasyon hissi. Steakhouse, fine-dining ve lounge mekanları için.",
    badge: "Fine Dining",
    supportedCategories: ["RESTORAN", "DIGER"],
    categoryLabels: ["Steakhouse", "Fine Dining", "Lounge", "Gece Restoranı"],
    styleCategory: "dark",
    isPremium: false,
    isBeta: false,
    orderIndex: 6,

    colors: {
      background: "#080808",
      surface: "#121212",
      surfaceHover: "#1C1C1C",
      primary: "#F97316",
      primaryHover: "#EA580C",
      secondary: "#E11D48",
      text: "#FFFFFF",
      mutedText: "#A3A3A3",
      border: "#262626",
      borderLight: "#404040",
      ring: "#F97316",
      accentGlow: "rgba(249, 115, 22, 0.15)",
      badgeBg: "rgba(249, 115, 22, 0.15)",
      badgeText: "#FB923C",
    },

    typography: {
      headingFont: "Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "serif",
      bodyStyle: "modern",
    },

    radius: "medium",

    hero: {
      layout: "centered",
      backgroundType: "darkGlass",
      showStats: true,
      align: "center",
    },

    sections: {
      services: "foodCards",
      reviews: "goldCards",
      employees: "chefCards",
      booking: "restaurantBooking",
      location: "cardGlass",
    },

    suggestedAccents: [
      { name: "Köz Ateşi", hex: "#F97316", label: "Steakhouse Ateşi" },
      { name: "Koyu Yakut", hex: "#BE123C", label: "Şarap & Sommelier" },
      { name: "Eski Altın", hex: "#CA8A04", label: "Lüks Bar" },
    ],
  },

  "bold-business": {
    id: "bold-business",
    name: "Bold Business",
    tagline: "Yüksek kontrast, güçlü ve dinamik",
    description:
      "Büyük cesur başlıklar, enerjik vurgu renkleri ve aksiyon odaklı grid düzeni. Spor salonları, crossfit, oto servisler ve hareketli işletmeler için yüksek enerji.",
    badge: "Yüksek Enerji",
    supportedCategories: ["OTO_SERVIS", "BERBER", "DIGER"],
    categoryLabels: ["Spor Salonu", "Fitness", "Oto Servis", "Aktif Yaşam"],
    styleCategory: "bold",
    isPremium: false,
    isBeta: false,
    orderIndex: 7,

    colors: {
      background: "#0A0F1D",
      surface: "#111827",
      surfaceHover: "#1F2937",
      primary: "#3B82F6",
      primaryHover: "#2563EB",
      secondary: "#60A5FA",
      text: "#F9FAFB",
      mutedText: "#9CA3AF",
      border: "#1F2937",
      borderLight: "#374151",
      ring: "#3B82F6",
      accentGlow: "rgba(59, 130, 246, 0.20)",
      badgeBg: "rgba(59, 130, 246, 0.15)",
      badgeText: "#60A5FA",
    },

    typography: {
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "uppercase",
      bodyStyle: "modern",
    },

    radius: "small",

    hero: {
      layout: "banner",
      backgroundType: "mesh",
      showStats: true,
      align: "center",
    },

    sections: {
      services: "gridCards",
      reviews: "gridQuotes",
      employees: "badgeCards",
      booking: "modernDark",
      location: "cardGlass",
    },

    suggestedAccents: [
      { name: "Elektrik Kobalt", hex: "#3B82F6", label: "Performans Mavisi" },
      { name: "Neon Sarı", hex: "#EAB308", label: "Yarış Sarısı" },
      { name: "Ateş Turuncu", hex: "#F97316", label: "Crossfit Turuncusu" },
      { name: "Zehir Yeşili", hex: "#10B981", label: "Enerji Yeşili" },
    ],
  },

  minimal: {
    id: "minimal",
    name: "Minimal",
    tagline: "Saf monokrom ve kusursuz okunabilirlik",
    description:
      "Gereksiz tüm süslemelerden arındırılmış, tipografik zarafet, geniş nefes alan boşluklar ve net çizgiler. Tüm sektörlere mükemmel uyum sağlar.",
    badge: "Zamansız",
    supportedCategories: ["BERBER", "GUZELLIK", "RESTORAN", "KLINIK", "OTO_SERVIS", "DIGER"],
    categoryLabels: ["Tüm Sektörler", "Kurumsal", "Mimarlık", "Danışmanlık"],
    styleCategory: "minimal",
    isPremium: false,
    isBeta: false,
    orderIndex: 8,

    colors: {
      background: "#09090B",
      surface: "#18181B",
      surfaceHover: "#27272A",
      primary: "#FAFAFA",
      primaryHover: "#E4E4E7",
      secondary: "#A1A1AA",
      text: "#FAFAFA",
      mutedText: "#A1A1AA",
      border: "#27272A",
      borderLight: "#3F3F46",
      ring: "#FAFAFA",
      accentGlow: "rgba(250, 250, 250, 0.06)",
      badgeBg: "rgba(255, 255, 255, 0.08)",
      badgeText: "#FAFAFA",
    },

    typography: {
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "clean" as any,
      bodyStyle: "compact",
    },

    radius: "none",

    hero: {
      layout: "minimal",
      backgroundType: "clean",
      showStats: false,
      align: "center",
    },

    sections: {
      services: "borderedMinimal",
      reviews: "minimalBorder",
      employees: "profileCards",
      booking: "minimal",
      location: "minimalLine",
    },

    suggestedAccents: [
      { name: "Monokrom Beyaz", hex: "#FAFAFA", label: "Siyah & Beyaz" },
      { name: "Platin Gümüş", hex: "#CBD5E1", label: "Sade Gri" },
      { name: "Sıcak Taş", hex: "#D6D3D1", label: "Mat Taş Tonu" },
    ],
  },
};

/**
 * Get Theme by ID with fallback to "premium-dark"
 */
export function getThemeConfig(themeId?: string | null): ThemeConfig {
  if (!themeId) return THEME_REGISTRY["premium-dark"];
  return THEME_REGISTRY[themeId] || THEME_REGISTRY["premium-dark"];
}

/**
 * Returns sector recommendations
 */
export function getSectorRecommendations(sector?: string | null): string[] {
  const norm = (sector || "").toUpperCase();
  switch (norm) {
    case "BERBER":
      return ["premium-dark", "minimal", "bold-business"];
    case "RESTORAN":
      return ["restaurant-classic", "restaurant-dark", "elegant-gold"];
    case "GUZELLIK":
      return ["soft-beauty", "elegant-gold", "modern-light"];
    case "KLINIK":
      return ["modern-light", "minimal"];
    case "OTO_SERVIS":
      return ["bold-business", "premium-dark", "minimal"];
    default:
      return ["premium-dark", "modern-light", "minimal"];
  }
}
