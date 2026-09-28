"use client";

import React from "react";
import {
  CalendarCheck,
  MessageSquare,
  Phone,
  MapPin,
  Scissors,
  UtensilsCrossed,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { HeroActionItem, HeroActionItemId, DEFAULT_HERO_ACTION_ITEMS } from "@/lib/hero/types";
import { HeroRealtimeStats } from "@/lib/hero/stats";

// Custom Instagram icon — lucide-react doesn't export one in this version
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

interface HeroActionsBarProps {
  business: {
    name: string;
    phone: string;
    address: string;
    city?: string;
    whatsappNumber?: string | null;
    slug: string;
    sector?: string;
  };
  stats: HeroRealtimeStats;
  theme: any;
  itemsConfig?: HeroActionItem[] | null;
  instagramUsername?: string;
  googleMapsUrl?: string;
  customCtaText?: string;
  onBookingClick?: () => void;
  align?: "left" | "center";
}

export function HeroActionsBar({
  business,
  stats,
  theme,
  itemsConfig,
  instagramUsername,
  googleMapsUrl,
  customCtaText,
  onBookingClick,
  align = "center",
}: HeroActionsBarProps) {
  const isRestaurant = business.sector === "RESTORAN";

  // Use configured items or fall back to default items
  const activeItems = (itemsConfig && itemsConfig.length > 0
    ? itemsConfig
    : DEFAULT_HERO_ACTION_ITEMS
  ).filter((item) => {
    if (!item.enabled) return false;
    if (item.id === "menu" && !isRestaurant) return false;
    return true;
  });

  const scrollToBooking = () => {
    if (onBookingClick) {
      onBookingClick();
      return;
    }
    const bookingSection = document.getElementById("booking");
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToServices = () => {
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cleanPhone = business.phone ? business.phone.replace(/\D/g, "") : "";
  const cleanWhatsapp = business.whatsappNumber
    ? business.whatsappNumber.replace(/\D/g, "")
    : cleanPhone;

  const mapsUrl =
    googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${business.name} ${business.address} ${business.city || ""}`
    )}`;

  const instaUrl = instagramUsername
    ? `https://instagram.com/${instagramUsername.replace(/^@/, "")}`
    : `https://instagram.com/${business.slug}`;

  // Categorize items into primary action buttons vs info/status chips
  const actionIds: HeroActionItemId[] = ["booking_cta", "whatsapp", "call", "services", "menu"];
  const statusIds: HeroActionItemId[] = [
    "open_status",
    "remaining_slots",
    "first_available",
    "working_hours",
    "location",
    "instagram",
  ];

  const primaryActions = activeItems.filter((i) => actionIds.includes(i.id));
  const statusChips = activeItems.filter((i) => statusIds.includes(i.id));

  // Determine button text color based on primary brightness
  const radius = theme?.radius?.button || "rounded-2xl";
  const badgeRadius = theme?.radius?.badge || "rounded-full";

  const renderSingleItem = (item: HeroActionItem) => {
    switch (item.id) {
      // 1. Primary Booking CTA
      case "booking_cta":
        return (
          <button
            key="booking_cta"
            onClick={scrollToBooking}
            className={`inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm sm:text-base font-bold shadow-xl transition-all active:scale-95 group shrink-0 ${radius}`}
            style={{
              backgroundColor: theme?.colors?.primary || "#00C98D",
              color: "#FFFFFF",
              boxShadow: `0 8px 24px ${theme?.colors?.accentGlow || "rgba(0,201,141,0.25)"}`,
            }}
          >
            <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
            <span>{item.customLabel || customCtaText || "Hemen Randevu Al"}</span>
            <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </button>
        );

      // 2. WhatsApp Button
      case "whatsapp":
        return (
          <a
            key="whatsapp"
            href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
              `Merhaba ${business.name}, bilgi ve randevu almak istiyorum.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold border transition-all hover:scale-[1.02] active:scale-95 shrink-0 ${radius}`}
            style={{
              backgroundColor: theme?.colors?.surface || "#0E1528",
              borderColor: theme?.colors?.border || "#1E2742",
              color: theme?.colors?.text || "#F1F5F9",
            }}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp</span>
          </a>
        );

      // 3. Call Button
      case "call":
        return (
          <a
            key="call"
            href={`tel:${cleanPhone}`}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold border transition-all hover:scale-[1.02] active:scale-95 shrink-0 ${radius}`}
            style={{
              backgroundColor: theme?.colors?.surface || "#0E1528",
              borderColor: theme?.colors?.border || "#1E2742",
              color: theme?.colors?.text || "#F1F5F9",
            }}
          >
            <Phone className="w-4 h-4 text-sky-400" />
            <span>Hemen Ara</span>
          </a>
        );

      // 4. Services Button
      case "services":
        return (
          <button
            key="services"
            onClick={scrollToServices}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold border transition-all hover:scale-[1.02] active:scale-95 shrink-0 ${radius}`}
            style={{
              backgroundColor: theme?.colors?.surface || "#0E1528",
              borderColor: theme?.colors?.border || "#1E2742",
              color: theme?.colors?.text || "#F1F5F9",
            }}
          >
            <Scissors className="w-4 h-4 text-indigo-400" />
            <span>Hizmetleri Gör</span>
          </button>
        );

      // 5. Restaurant Menu Button
      case "menu":
        return (
          <button
            key="menu"
            onClick={scrollToServices}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold border transition-all hover:scale-[1.02] active:scale-95 shrink-0 ${radius}`}
            style={{
              backgroundColor: theme?.colors?.surface || "#0E1528",
              borderColor: theme?.colors?.border || "#1E2742",
              color: theme?.colors?.text || "#F1F5F9",
            }}
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            <span>Menüye Git</span>
          </button>
        );

      // 6. Open / Closed Status Badge
      case "open_status":
        return (
          <div
            key="open_status"
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border transition-all shrink-0 ${badgeRadius}`}
            style={{
              backgroundColor: stats.isOpenNow
                ? "rgba(0, 201, 141, 0.12)"
                : "rgba(239, 68, 68, 0.12)",
              borderColor: stats.isOpenNow
                ? "rgba(0, 201, 141, 0.3)"
                : "rgba(239, 68, 68, 0.3)",
              color: stats.isOpenNow ? "#00C98D" : "#F87171",
            }}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                stats.isOpenNow ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`}
            />
            <span>{stats.openStatusText}</span>
          </div>
        );

      // 7. Remaining Slots Badge
      case "remaining_slots":
        return (
          <div
            key="remaining_slots"
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border transition-all shrink-0 ${badgeRadius}`}
            style={{
              backgroundColor:
                stats.remainingSlotsCount > 0
                  ? "rgba(98, 70, 234, 0.12)"
                  : "rgba(100, 116, 139, 0.15)",
              borderColor:
                stats.remainingSlotsCount > 0
                  ? "rgba(98, 70, 234, 0.3)"
                  : "rgba(100, 116, 139, 0.3)",
              color:
                stats.remainingSlotsCount > 0
                  ? theme?.colors?.primary || "#6246EA"
                  : "#94A3B8",
            }}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{stats.remainingSlotsText}</span>
          </div>
        );

      // 8. First Available Time
      case "first_available":
        return (
          <div
            key="first_available"
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border transition-all shrink-0 ${badgeRadius}`}
            style={{
              backgroundColor: stats.firstAvailableTime
                ? "rgba(245, 158, 11, 0.12)"
                : "rgba(100, 116, 139, 0.15)",
              borderColor: stats.firstAvailableTime
                ? "rgba(245, 158, 11, 0.3)"
                : "rgba(100, 116, 139, 0.3)",
              color: stats.firstAvailableTime ? "#F59E0B" : "#94A3B8",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{stats.firstAvailableText}</span>
          </div>
        );

      // 9. Today's Working Hours
      case "working_hours":
        return (
          <div
            key="working_hours"
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border transition-all shrink-0 ${badgeRadius}`}
            style={{
              backgroundColor: theme?.colors?.surface || "#0E1528",
              borderColor: theme?.colors?.border || "#1E2742",
              color: theme?.colors?.mutedText || "#94A3B8",
            }}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{stats.todayWorkingHoursText}</span>
          </div>
        );

      // 10. Location Link
      case "location":
        return (
          <a
            key="location"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-all hover:opacity-90 shrink-0 ${badgeRadius}`}
            style={{
              backgroundColor: theme?.colors?.surface || "#0E1528",
              borderColor: theme?.colors?.border || "#1E2742",
              color: theme?.colors?.text || "#F1F5F9",
            }}
            title="Google Haritalar'da Aç"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Konum & Yol Tarifi</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        );

      // 11. Instagram Link
      case "instagram":
        return (
          <a
            key="instagram"
            href={instaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-all hover:opacity-90 shrink-0 ${badgeRadius}`}
            style={{
              backgroundColor: theme?.colors?.surface || "#0E1528",
              borderColor: theme?.colors?.border || "#1E2742",
              color: theme?.colors?.text || "#F1F5F9",
            }}
            title="Instagram Profilini Ziyaret Et"
          >
            <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>Instagram</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        );

      default:
        return null;
    }
  };

  const justifyClass = align === "left" ? "justify-start" : "justify-center";

  return (
    <div className="space-y-4 pt-2 w-full">
      {/* Primary Action Buttons Row */}
      {primaryActions.length > 0 && (
        <div
          className={`flex flex-wrap items-center gap-3 sm:gap-4 ${justifyClass}`}
        >
          {primaryActions.map(renderSingleItem)}
        </div>
      )}

      {/* Real-time Status and Info Chips Bar (Wrapped & mobile-friendly horizontal scroll if needed) */}
      {statusChips.length > 0 && (
        <div
          className={`flex flex-wrap items-center gap-2 sm:gap-2.5 max-w-full overflow-x-auto no-scrollbar py-1 ${justifyClass}`}
        >
          {statusChips.map(renderSingleItem)}
        </div>
      )}
    </div>
  );
}
