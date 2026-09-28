export type GalleryLayout =
  | "INFINITE_FLOW"
  | "DUAL_FLOW"
  | "CINEMATIC_STRIP"
  | "CARDS"
  | "MASONRY"
  | "EDITORIAL"
  | "FULL_BLEED";

export type GalleryDirection = "right-to-left" | "left-to-right";

export type GallerySpeed = "VERY_SLOW" | "SLOW" | "NORMAL" | "FAST" | "VERY_FAST";

export type GalleryImageSize = "SMALL" | "MEDIUM" | "LARGE" | "XL" | "FULL";

export type GalleryAspectRatio =
  | "1:1"
  | "4:5"
  | "3:2"
  | "16:9"
  | "portrait"
  | "landscape";

export type GalleryBorderRadius = "none" | "subtle" | "rounded" | "extra";

export type GalleryScrollAnimation =
  | "None"
  | "Fade In"
  | "Fade Up"
  | "Fade Down"
  | "Slide Left"
  | "Slide Right"
  | "Scale In"
  | "Blur Reveal"
  | "Clip Reveal"
  | "Stagger Reveal";

export type GalleryClickAction = "NONE" | "LIGHTBOX" | "FULLSCREEN";

export interface GalleryItemData {
  id: string;
  galleryId?: string;
  businessId?: string;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  altText?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface GalleryData {
  id?: string;
  businessId?: string;
  enabled: boolean;
  showTitle: boolean;
  title?: string | null;
  subtitle?: string | null;
  layout: GalleryLayout;
  direction: GalleryDirection;
  speed: GallerySpeed;
  pauseOnHover: boolean;
  imageSize: GalleryImageSize;
  aspectRatio: GalleryAspectRatio;
  borderRadius: GalleryBorderRadius;
  scrollAnimation: GalleryScrollAnimation;
  parallaxEnabled: boolean;
  scrollReactive: boolean;
  scrollDirectionTracking: boolean;
  clickAction: GalleryClickAction;
  items?: GalleryItemData[];
}

export const SPEED_DURATION_MAP: Record<GallerySpeed, number> = {
  VERY_SLOW: 90,
  SLOW: 60,
  NORMAL: 35,
  FAST: 22,
  VERY_FAST: 14,
};

export const SPEED_LABEL_MAP: Record<GallerySpeed, { label: string; desc: string }> = {
  VERY_SLOW: { label: "Çok Yavaş", desc: "90 sn döngü, sakin ve vitrin tarzı" },
  SLOW: { label: "Yavaş", desc: "60 sn döngü, zarif akış" },
  NORMAL: { label: "Normal", desc: "35 sn döngü, optimum portföy deneyimi" },
  FAST: { label: "Hızlı", desc: "22 sn döngü, dinamik ve enerjik" },
  VERY_FAST: { label: "Çok Hızlı", desc: "14 sn döngü, hızlı geçişler" },
};

export const LAYOUT_METADATA: Record<
  GalleryLayout,
  { name: string; tagline: string; icon: string; badge?: string }
> = {
  INFINITE_FLOW: {
    name: "Infinite Flow",
    tagline: "Varsayılan: Kesintisiz sağdan sola kayan sonsuz marquee",
    icon: "Infinity",
    badge: "Varsayılan",
  },
  DUAL_FLOW: {
    name: "Dual Flow",
    tagline: "Çift şeritli, zıt yönlere akan lüks görsel şölen",
    icon: "Layers",
    badge: "Premium",
  },
  CINEMATIC_STRIP: {
    name: "Cinematic Strip",
    tagline: "Geniş sinematik kartlar ve zarif tipografi",
    icon: "Film",
  },
  CARDS: {
    name: "Cards",
    tagline: "Gezilebilir, kart yapısında yatay carousel",
    icon: "LayoutGrid",
  },
  MASONRY: {
    name: "Masonry",
    tagline: "Instagram tarzı çok sütunlu duvar ızgarası",
    icon: "Grid",
  },
  EDITORIAL: {
    name: "Editorial",
    tagline: "Dergi kapakları tarzında asimetrik prestij düzeni",
    icon: "BookOpen",
    badge: "Yeni",
  },
  FULL_BLEED: {
    name: "Full Width",
    tagline: "Kenarlardan taşan tam ekran görsel akışı",
    icon: "Maximize2",
  },
};

export const ASPECT_RATIOS: Array<{
  id: GalleryAspectRatio;
  label: string;
  ratioClass: string;
  bestFor: string;
}> = [
  { id: "4:5", label: "4:5 (Dikey Portre)", ratioClass: "aspect-[4/5]", bestFor: "Berber, Kuaför, Güzellik" },
  { id: "1:1", label: "1:1 (Kare)", ratioClass: "aspect-square", bestFor: "Instagram & Ürünler" },
  { id: "3:2", label: "3:2 (Klasik Foto)", ratioClass: "aspect-[3/2]", bestFor: "Restoran & Mekan" },
  { id: "16:9", label: "16:9 (Geniş Ekran)", ratioClass: "aspect-video", bestFor: "Oto Detailing & Klinik" },
  { id: "portrait", label: "9:16 (Story / Reel)", ratioClass: "aspect-[9/16]", bestFor: "Mobil Odaklı" },
  { id: "landscape", label: "21:9 (Panoramik)", ratioClass: "aspect-[21/9]", bestFor: "Mimari & Dış Çekim" },
];

export const IMAGE_SIZES: Record<
  GalleryImageSize,
  { label: string; heightClass: string; widthClass: string; pixelDesc: string }
> = {
  SMALL: { label: "Küçük", heightClass: "h-44 sm:h-52", widthClass: "w-44 sm:w-52 min-w-[176px]", pixelDesc: "~200px" },
  MEDIUM: { label: "Orta", heightClass: "h-64 sm:h-72", widthClass: "w-56 sm:w-64 min-w-[224px]", pixelDesc: "~280px" },
  LARGE: { label: "Büyük", heightClass: "h-80 sm:h-96", widthClass: "w-72 sm:w-80 min-w-[288px]", pixelDesc: "~360px" },
  XL: { label: "XL", heightClass: "h-[380px] sm:h-[450px]", widthClass: "w-88 sm:w-96 min-w-[350px]", pixelDesc: "~450px" },
  FULL: { label: "Tam Ekran", heightClass: "h-[500px] sm:h-[600px]", widthClass: "w-full min-w-[320px]", pixelDesc: "Tam Genişlik" },
};

export const SECTOR_SAMPLE_IMAGES: Record<string, Array<{ url: string; title: string; desc: string }>> = {
  BERBER: [
    {
      url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80",
      title: "Klasik Makas Kesimi & Fön",
      desc: "Kişiye özel saç anatomisine uygun makas işçiliği",
    },
    {
      url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1000&q=80",
      title: "Modern Skin Fade",
      desc: "Sıfırdan başlayan milimetrik geçişli fade tasarımı",
    },
    {
      url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1000&q=80",
      title: "Geleneksel Sıcak Havlu & Ustura Tıraşı",
      desc: "Okaliptüs buharı ve organik sakal bakım masajı",
    },
    {
      url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1000&q=80",
      title: "Sakal Şekillendirme & Çizgi",
      desc: "Yüz hatlarını belirginleştiren simetrik sakal hattı",
    },
    {
      url: "https://images.unsplash.com/photo-1517832606589-7629c3395909?auto=format&fit=crop&w=1000&q=80",
      title: "Premium Salon Deneyimi",
      desc: "Konforlu deri koltuklar ve özel ikram alanı",
    },
  ],
  GUZELLIK: [
    {
      url: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1000&q=80",
      title: "Hydrafacial Cilt Bakımı",
      desc: "Derinlemesine gözenek arındırma ve nem terapisi",
    },
    {
      url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80",
      title: "Nail Art & Kalıcı Oje",
      desc: "Sezonun trend desenleri ve dayanıklı protez tırnak",
    },
    {
      url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
      title: "İpek Kirpik & Lash Lifting",
      desc: "Doğal kıvrım ve hacimli bakışlar",
    },
    {
      url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1000&q=80",
      title: "Gelin & Özel Gün Makyajı",
      desc: "HD profesyonel makyaj ve ışıltılı kontür",
    },
    {
      url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1000&q=80",
      title: "Organik Saç Boyama & Ombre",
      desc: "Saç yapısını koruyan mikro pigmentasyon",
    },
  ],
  RESTORAN: [
    {
      url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80",
      title: "Şefin İmzası Dry-Aged Antrikot",
      desc: "Meşe odunu ızgarasında dinlendirilmiş özel et",
    },
    {
      url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80",
      title: "Akşam Yemeği Atmosferi",
      desc: "Loş ışıklar, sıcak dekorasyon ve canlı piyano",
    },
    {
      url: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1000&q=80",
      title: "Açık Mutfak & Tabaklama",
      desc: "Usta şeflerin taze ve özenli sunum anı",
    },
    {
      url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80",
      title: "Gurme Tatlı & Kahve",
      desc: "Taze çekilmiş özel harman espresso ve sufle",
    },
  ],
  OTO_SERVIS: [
    {
      url: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1000&q=80",
      title: "Seramik Kaplama & Boya Koruma",
      desc: "9H sertliğinde ayna parlaklığı ve su itici kalkan",
    },
    {
      url: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1000&q=80",
      title: "Detaylı İç Kuaför & Ozon Temizliği",
      desc: "Deri koltuk kondisyonlama ve mikrop arındırma",
    },
    {
      url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1000&q=80",
      title: "Jant & Kaliper Yenileme",
      desc: "Isıya dayanıklı seramik boya ve parlatma",
    },
    {
      url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1000&q=80",
      title: "Profesyonel Servis İstasyonu",
      desc: "Son teknoloji kaldırma liftleri ve sertifikalı ustalar",
    },
  ],
  KLINIK: [
    {
      url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80",
      title: "Modern Diş Tedavi Ünitesi",
      desc: "Ağrısız dijital diş hekimliği ve gülüş tasarımı",
    },
    {
      url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80",
      title: "Steril Klinik Odaları",
      desc: "Uluslararası hijyen standartlarında VIP muayene odası",
    },
    {
      url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80",
      title: "Uzman Hekim Danışmanlığı",
      desc: "Detaylı konsültasyon ve kişiselleştirilmiş tedavi planı",
    },
  ],
};
