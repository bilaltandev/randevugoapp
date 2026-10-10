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
  "gece-safiri": {
    id: "gece-safiri",
    name: "Gece Safiri",
    tagline: "Derin lacivert, safir parıltısı",
    description:
      "Gece mavisi zemin, safir mavisi vurgular ve keskin modern başlıklar. Teknolojik, güven veren ve göz alıcı bir premium atmosfer.",
    badge: "Yeni",
    supportedCategories: ["BERBER", "KLINIK", "OTO_SERVIS", "DIGER"],
    categoryLabels: ["Premium Berber", "Estetik Klinik", "Danışmanlık", "Modern Stüdyo"],
    styleCategory: "dark",
    isPremium: false,
    isBeta: false,
    orderIndex: 9,

    colors: {
      background: "#070B18",
      surface: "#0E1426",
      surfaceHover: "#151D35",
      primary: "#6E8BFF",
      primaryHover: "#5A78F5",
      secondary: "#A5B4FC",
      text: "#F1F4FF",
      mutedText: "#94A0BF",
      border: "#1C2542",
      borderLight: "#2A3558",
      ring: "#6E8BFF",
      accentGlow: "rgba(110, 139, 255, 0.16)",
      badgeBg: "rgba(110, 139, 255, 0.14)",
      badgeText: "#A5B4FC",
    },

    typography: {
      headingFont: "var(--font-manrope), system-ui, sans-serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "extraBold",
      bodyStyle: "modern",
    },

    radius: "large",

    hero: {
      layout: "centered",
      backgroundType: "mesh",
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
      { name: "Safir", hex: "#6E8BFF", label: "Orijinal Safir" },
      { name: "Buz Mavisi", hex: "#7DD3FC", label: "Serin Turkuaz" },
      { name: "Ametist", hex: "#A78BFA", label: "Asil Mor" },
      { name: "Platin", hex: "#CBD5E1", label: "Soğuk Gümüş" },
    ],
  },

  sampanya: {
    id: "sampanya",
    name: "Şampanya",
    tagline: "Fildişi zemin, şampanya altını",
    description:
      "Krem ve fildişi tonlarda ferah bir zemin, şampanya altını detaylar ve zarif serif başlıklar. Butik salonlar ve şık mekânlar için sessiz lüks.",
    badge: "Yeni",
    supportedCategories: ["GUZELLIK", "RESTORAN", "DIGER"],
    categoryLabels: ["Butik Güzellik", "Gelinlik & Stil", "Bistro", "Butik Otel"],
    styleCategory: "luxury",
    isPremium: false,
    isBeta: false,
    orderIndex: 10,

    colors: {
      background: "#FBF8F3",
      surface: "#FFFFFF",
      surfaceHover: "#F4EEE4",
      primary: "#8C6D3F",
      primaryHover: "#7A5E35",
      secondary: "#C9A96E",
      text: "#1F1A14",
      mutedText: "#6F6556",
      border: "#EAE2D5",
      borderLight: "#DCD0BD",
      ring: "#8C6D3F",
      accentGlow: "rgba(201, 169, 110, 0.18)",
      badgeBg: "rgba(140, 109, 63, 0.1)",
      badgeText: "#7A5E35",
    },

    typography: {
      headingFont: "var(--font-cormorant), Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "serif",
      bodyStyle: "airy",
    },

    radius: "small",

    hero: {
      layout: "split",
      backgroundType: "warm",
      showStats: false,
      align: "left",
    },

    sections: {
      services: "luxuryGold",
      reviews: "goldCards",
      employees: "goldFramed",
      booking: "goldAccent",
      location: "goldBox",
    },

    suggestedAccents: [
      { name: "Şampanya Altını", hex: "#8C6D3F", label: "Orijinal Altın" },
      { name: "Gül Kurusu", hex: "#A35D63", label: "Romantik Gül" },
      { name: "Zeytin", hex: "#5F6B3A", label: "Doğal Yeşil" },
      { name: "Espresso", hex: "#4A3426", label: "Koyu Kahve" },
    ],
  },

  "obsidyen-bakir": {
    id: "obsidyen-bakir",
    name: "Obsidyen & Bakır",
    tagline: "Sıcak siyah, parlak bakır",
    description:
      "Sıcak siyah zemin, bakır vurgular ve büyük harfli güçlü başlıklar. Karakteri olan berberler ve atölyeler için cesur, endüstriyel bir duruş.",
    badge: "Yeni",
    supportedCategories: ["BERBER", "OTO_SERVIS", "DIGER"],
    categoryLabels: ["Berber", "Barbershop", "Oto Detay", "Dövme Stüdyosu"],
    styleCategory: "bold",
    isPremium: false,
    isBeta: false,
    orderIndex: 11,

    colors: {
      background: "#0D0B0A",
      surface: "#171311",
      surfaceHover: "#211B18",
      primary: "#D9864F",
      primaryHover: "#C97540",
      secondary: "#F0B48A",
      text: "#F7F2EE",
      mutedText: "#A89A90",
      border: "#2A221E",
      borderLight: "#3D322C",
      ring: "#D9864F",
      accentGlow: "rgba(217, 134, 79, 0.16)",
      badgeBg: "rgba(217, 134, 79, 0.14)",
      badgeText: "#F0B48A",
    },

    typography: {
      headingFont: "var(--font-manrope), system-ui, sans-serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "uppercase",
      bodyStyle: "compact",
    },

    radius: "small",

    hero: {
      layout: "banner",
      backgroundType: "darkGlass",
      showStats: true,
      align: "left",
    },

    sections: {
      services: "gridCards",
      reviews: "minimalBorder",
      employees: "badgeCards",
      booking: "modernDark",
      location: "cardGlass",
    },

    suggestedAccents: [
      { name: "Bakır", hex: "#D9864F", label: "Orijinal Bakır" },
      { name: "Pirinç", hex: "#C9A227", label: "Eskitme Pirinç" },
      { name: "Kızıl Kil", hex: "#E0674A", label: "Sıcak Kırmızı" },
      { name: "Kemik", hex: "#E7DCCB", label: "Açık Krem" },
    ],
  },

  adacayi: {
    id: "adacayi",
    name: "Adaçayı",
    tagline: "Doğal, sakin ve ferah",
    description:
      "Yumuşak adaçayı yeşili zemin, derin yeşil vurgular ve yuvarlak hatlar. Spa, terapi ve bütünsel sağlık mekânlarına huzur veren bir görünüm.",
    badge: "Yeni",
    supportedCategories: ["GUZELLIK", "KLINIK", "DIGER"],
    categoryLabels: ["Spa & Masaj", "Psikolog", "Diyetisyen", "Yoga Stüdyosu"],
    styleCategory: "light",
    isPremium: false,
    isBeta: false,
    orderIndex: 12,

    colors: {
      background: "#F3F5F0",
      surface: "#FFFFFF",
      surfaceHover: "#E9EDE4",
      primary: "#4A6B4E",
      primaryHover: "#3E5B42",
      secondary: "#9DB59F",
      text: "#1E2A20",
      mutedText: "#5E6B5F",
      border: "#DDE3D7",
      borderLight: "#C9D2C1",
      ring: "#4A6B4E",
      accentGlow: "rgba(74, 107, 78, 0.12)",
      badgeBg: "rgba(74, 107, 78, 0.1)",
      badgeText: "#3E5B42",
    },

    typography: {
      headingFont: "var(--font-playfair), Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "serif",
      bodyStyle: "airy",
    },

    radius: "full",

    hero: {
      layout: "centered",
      backgroundType: "clean",
      showStats: false,
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
      { name: "Adaçayı", hex: "#4A6B4E", label: "Orijinal Yeşil" },
      { name: "Okaliptüs", hex: "#3F6E6A", label: "Serin Yeşil" },
      { name: "Toprak", hex: "#8A5A3C", label: "Sıcak Kahve" },
      { name: "Lavanta", hex: "#6B5B8C", label: "Sakin Mor" },
    ],
  },

  "bordo-kadife": {
    id: "bordo-kadife",
    name: "Bordo Kadife",
    tagline: "Şarap kırmızısı, gül kurusu",
    description:
      "Koyu şarap rengi zemin, gül kurusu detaylar ve klasik serif başlıklar. Fine dining restoranlar ve seçkin güzellik salonları için sıcak bir lüks.",
    badge: "Yeni",
    supportedCategories: ["RESTORAN", "GUZELLIK", "DIGER"],
    categoryLabels: ["Fine Dining", "Şarap Evi", "Lüks Güzellik", "Kokteyl Bar"],
    styleCategory: "luxury",
    isPremium: false,
    isBeta: false,
    orderIndex: 13,

    colors: {
      background: "#12080B",
      surface: "#1C0F13",
      surfaceHover: "#27151B",
      primary: "#D9918A",
      primaryHover: "#CC7F78",
      secondary: "#F2C4B8",
      text: "#FBF1EF",
      mutedText: "#B49A9C",
      border: "#331D23",
      borderLight: "#4A2B33",
      ring: "#D9918A",
      accentGlow: "rgba(217, 145, 138, 0.15)",
      badgeBg: "rgba(217, 145, 138, 0.14)",
      badgeText: "#F2C4B8",
    },

    typography: {
      headingFont: "var(--font-playfair), Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "serif",
      bodyStyle: "airy",
    },

    radius: "medium",

    hero: {
      layout: "split",
      backgroundType: "warm",
      showStats: true,
      align: "left",
    },

    sections: {
      services: "foodCards",
      reviews: "goldCards",
      employees: "chefCards",
      booking: "restaurantBooking",
      location: "goldBox",
    },

    suggestedAccents: [
      { name: "Gül Kurusu", hex: "#D9918A", label: "Orijinal Gül" },
      { name: "Şampanya", hex: "#E3C48D", label: "Altın Işıltı" },
      { name: "Mercan", hex: "#F08A6C", label: "Canlı Mercan" },
      { name: "İnci", hex: "#EDE6E3", label: "Sade İnci" },
    ],
  },

  nordik: {
    id: "nordik",
    name: "Nordik",
    tagline: "Saf beyaz, net ve ferah",
    description:
      "Bembeyaz zemin, petrol yeşili vurgular ve bol boşluklu sade düzen. Klinikler, danışmanlar ve profesyonel hizmetler için güven veren modern sadelik.",
    badge: "Yeni",
    supportedCategories: ["KLINIK", "DIGER", "GUZELLIK"],
    categoryLabels: ["Klinik", "Diş Hekimi", "Avukat & Danışman", "Fizyoterapi"],
    styleCategory: "minimal",
    isPremium: false,
    isBeta: false,
    orderIndex: 14,

    colors: {
      background: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceHover: "#F5F7F8",
      primary: "#0F766E",
      primaryHover: "#0B5F58",
      secondary: "#5EEAD4",
      text: "#0B1215",
      mutedText: "#5B6770",
      border: "#E8ECEE",
      borderLight: "#D5DCDF",
      ring: "#0F766E",
      accentGlow: "rgba(15, 118, 110, 0.1)",
      badgeBg: "rgba(15, 118, 110, 0.08)",
      badgeText: "#0B5F58",
    },

    typography: {
      headingFont: "var(--font-manrope), system-ui, sans-serif",
      bodyFont: "'Inter', sans-serif",
      headingStyle: "clean",
      bodyStyle: "airy",
    },

    radius: "medium",

    hero: {
      layout: "minimal",
      backgroundType: "clean",
      showStats: false,
      align: "center",
    },

    sections: {
      services: "borderedMinimal",
      reviews: "minimalBorder",
      employees: "circularAvatar",
      booking: "minimal",
      location: "minimalLine",
    },

    suggestedAccents: [
      { name: "Petrol", hex: "#0F766E", label: "Orijinal Petrol" },
      { name: "Okyanus", hex: "#1D4ED8", label: "Derin Mavi" },
      { name: "Grafit", hex: "#1F2937", label: "Kurumsal Siyah" },
      { name: "Mürdüm", hex: "#7E22CE", label: "Modern Mor" },
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
      return ["premium-dark", "obsidyen-bakir", "gece-safiri", "bold-business"];
    case "RESTORAN":
      return ["restaurant-classic", "bordo-kadife", "restaurant-dark", "sampanya"];
    case "GUZELLIK":
      return ["soft-beauty", "sampanya", "adacayi", "elegant-gold"];
    case "KLINIK":
      return ["nordik", "adacayi", "modern-light", "minimal"];
    case "OTO_SERVIS":
      return ["bold-business", "obsidyen-bakir", "premium-dark"];
    default:
      return ["premium-dark", "gece-safiri", "nordik", "modern-light"];
  }
}
