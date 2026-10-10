import type { BookingEmployee, BookingService, PublicReview } from "../types";
import type { Photo } from "../PhotoGallery";
import type { WorkingHour } from "../time";

/**
 * Everything an alternative storefront layout needs, already filtered to real,
 * visible data (hidden sections and empty lists are removed by the page).
 */
export interface StorefrontLayoutProps {
  name: string;
  logo?: string | null;
  showLogo: boolean;
  description?: string | null;
  categoryLine: string[];
  verified?: boolean;
  /** Owner's hero background photo; null when they chose the theme color. */
  heroImage: string | null;
  /** Gallery photos (the hero image is not one of them). */
  photos: Photo[];
  services: BookingService[];
  employees: BookingEmployee[];
  reviews: PublicReview[];
  ratingAverage: number;
  hours: WorkingHour[];
  /** 0 = Sunday; null before hydration. */
  todayIndex: number | null;
  openStatus: { open: boolean; label: string } | null;
  address?: string | null;
  city?: string | null;
  badges: string[];
  contact: {
    phone?: string | null;
    whatsappUrl?: string | null;
    instagramUrl?: string | null;
    mapsUrl?: string | null;
  };
  isRestaurant: boolean;
  /** Online booking closed (expired subscription): show services, hide booking buttons. */
  bookingClosed: boolean;
  /** Pick a service and enter the booking flow. */
  onBook: (service: BookingService) => void;
  onOpenPhoto: (index: number) => void;
  footerYear: number | null;
}

/** Services grouped by category, keeping the owner's order. */
export function groupServices(services: BookingService[]) {
  const map = new Map<string, BookingService[]>();
  for (const s of services) {
    const key = s.category?.name || "";
    map.set(key, [...(map.get(key) ?? []), s]);
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
}

/** Reviews worth quoting (a real sentence), highest rated first. */
export function featuredReviews(reviews: PublicReview[]) {
  return reviews
    .filter((r) => r.comment && r.comment.trim().length > 20)
    .sort((a, b) => b.rating - a.rating);
}
