export type ThemeId =
  | "premium-dark"
  | "modern-light"
  | "elegant-gold"
  | "soft-beauty"
  | "restaurant-classic"
  | "restaurant-dark"
  | "bold-business"
  | "minimal"
  | string;

export type SectorType =
  | "BERBER"
  | "GUZELLIK"
  | "RESTORAN"
  | "KLINIK"
  | "OTO_SERVIS"
  | "DIGER";

export type ThemeStyleCategory = "dark" | "light" | "luxury" | "minimal" | "bold" | "restaurant";

export interface ThemeColors {
  background: string;       // Main background color (e.g. #0B0B0B)
  surface: string;          // Card / section surface (e.g. #151515)
  surfaceHover: string;     // Card hover state
  primary: string;          // Accent / primary brand color (e.g. #00C98D)
  primaryText?: string;      // Button text color (computed dynamically if not set)
  primaryHover: string;     // Hover state for primary buttons
  secondary: string;        // Secondary elements
  text: string;             // Headings and high-contrast text
  mutedText: string;        // Body and subtitle text
  border: string;           // Border color
  borderLight: string;      // Subtle border / divider
  ring: string;             // Focus ring / glow
  accentGlow: string;       // Ambient background glow color
  badgeBg: string;          // Badge background
  badgeText: string;        // Badge text
}

export interface ThemeTypography {
  headingFont: string;      // Font family for titles
  bodyFont: string;         // Font family for content
  headingStyle: "bold" | "extraBold" | "serif" | "clean" | "uppercase";
  bodyStyle: "modern" | "compact" | "airy";
}

export interface ThemeHeroConfig {
  layout: "centered" | "split" | "banner" | "minimal";
  backgroundType: "gradient" | "mesh" | "darkGlass" | "clean" | "warm";
  showStats: boolean;
  align: "center" | "left";
}

export interface ThemeSectionStyles {
  services: "darkGlass" | "whiteClean" | "borderedMinimal" | "foodCards" | "gridCards" | "luxuryGold";
  reviews: "gridQuotes" | "minimalBorder" | "goldCards" | "cleanPills";
  employees: "profileCards" | "circularAvatar" | "goldFramed" | "badgeCards" | "chefCards";
  booking: "modernDark" | "cleanLight" | "goldAccent" | "minimal" | "restaurantBooking";
  location: "cardGlass" | "cleanBox" | "goldBox" | "minimalLine";
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  supportedCategories: SectorType[];
  categoryLabels: string[];
  styleCategory: ThemeStyleCategory;
  isPremium?: boolean;
  isBeta?: boolean;
  orderIndex: number;

  colors: ThemeColors;
  typography: ThemeTypography;
  radius: "none" | "small" | "medium" | "large" | "full";

  hero: ThemeHeroConfig;
  sections: ThemeSectionStyles;

  suggestedAccents: Array<{
    name: string;
    hex: string;
    label: string;
  }>;
}

export interface ThemeOverrides {
  primaryColor?: string;
  heroLayout?: "centered" | "split" | "banner" | "minimal";
  fontFamily?: string;
  customTitle?: string;
  customSubtitle?: string;
  customBadge?: string;
  customCtaText?: string;
  coverImage?: string;
  showReviews?: boolean;
  showStaff?: boolean;
  showServices?: boolean;
  showLocation?: boolean;
  showAbout?: boolean;
  showBooking?: boolean;
  heroActions?: import("@/lib/hero/types").HeroActionItem[];
  instagramUsername?: string;
  googleMapsUrl?: string;
  heroBgType?: "image" | "video" | "color";
  showLogo?: boolean;
  showSlogan?: boolean;
  sloganText?: string;
  ctaColor?: "purple" | "green" | "custom";
}

export interface PageSectionOrder {
  id: string;
  type: "Hero" | "About" | "Services" | "Staff" | "Gallery" | "Reviews" | "Location" | "Booking" | "Contact";
  label: string;
  isCritical?: boolean; // Critical sections (e.g. Services/Menu & Booking) cannot be deleted
}
