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
  CalendarClock,
  ExternalLink,
} from "lucide-react";
import { getButtonTextColor } from "@/lib/themes/utils";
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

  const radius = theme?.radius?.button || "rounded-xl";
  const badgeRadius = theme?.radius?.badge || "rounded-full";

  const colors = {
    primary: theme?.colors?.primary || "#00C98D",
    surface: theme?.colors?.surface || "#0E1528",
    border: theme?.colors?.border || "#1E2742",
    text: theme?.colors?.text || "#F1F5F9",
    muted: theme?.colors?.mutedText || "#94A3B8",
  };
  const onPrimary = getButtonTextColor(colors.primary);

  const secondaryStyle = { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text };
  const chipStyle = { backgroundColor: colors.surface, borderColor: colors.border, color: colors.muted };
  const secondaryCls = `inline-flex h-11 items-center justify-center gap-2 border px-4 text-sm font-medium transition-opacity hover:opacity-80 shrink-0 ${radius}`;
  const chipCls = `inline-flex h-8 items-center gap-1.5 border px-3 text-xs font-medium shrink-0 ${badgeRadius}`;

  const renderSingleItem = (item: HeroActionItem) => {
    switch (item.id) {
      case "booking_cta":
        return (
          <button
            key="booking_cta"
            type="button"
            onClick={scrollToBooking}
            className={`inline-flex h-11 items-center justify-center gap-2 px-5 text-sm font-semibold transition-opacity hover:opacity-90 shrink-0 ${radius}`}
            style={{ backgroundColor: colors.primary, color: onPrimary }}
          >
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            {item.customLabel || customCtaText || "Randevu al"}
          </button>
        );

      case "whatsapp":
        return (
          <a
            key="whatsapp"
            href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
              `Merhaba ${business.name}, bilgi ve randevu almak istiyorum.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryCls}
            style={secondaryStyle}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        );

      case "call":
        return (
          <a key="call" href={`tel:${cleanPhone}`} className={secondaryCls} style={secondaryStyle}>
            <Phone className="h-4 w-4" aria-hidden="true" />
            Ara
          </a>
        );

      case "services":
        return (
          <button key="services" type="button" onClick={scrollToServices} className={secondaryCls} style={secondaryStyle}>
            <Scissors className="h-4 w-4" aria-hidden="true" />
            Hizmetler
          </button>
        );

      case "menu":
        return (
          <button key="menu" type="button" onClick={scrollToServices} className={secondaryCls} style={secondaryStyle}>
            <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
            Menü
          </button>
        );

      case "open_status":
        return (
          <span key="open_status" className={chipCls} style={chipStyle}>
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: stats.isOpenNow ? "#22C55E" : "#EF4444" }}
              aria-hidden="true"
            />
            <span style={{ color: colors.text }}>{stats.openStatusText}</span>
          </span>
        );

      case "remaining_slots":
        return (
          <span key="remaining_slots" className={chipCls} style={chipStyle}>
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {stats.remainingSlotsText}
          </span>
        );

      case "first_available":
        return (
          <span key="first_available" className={chipCls} style={chipStyle}>
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            {stats.firstAvailableText}
          </span>
        );

      case "working_hours":
        return (
          <span key="working_hours" className={chipCls} style={chipStyle}>
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {stats.todayWorkingHoursText}
          </span>
        );

      case "location":
        return (
          <a
            key="location"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${chipCls} transition-opacity hover:opacity-80`}
            style={chipStyle}
            title="Google Haritalar'da aç"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Yol tarifi
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        );

      case "instagram":
        return (
          <a
            key="instagram"
            href={instaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${chipCls} transition-opacity hover:opacity-80`}
            style={chipStyle}
            title="Instagram profilini aç"
          >
            <InstagramIcon className="h-3.5 w-3.5" />
            Instagram
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        );

      default:
        return null;
    }
  };

  const justifyClass = align === "left" ? "justify-start" : "justify-center";

  return (
    <div className="w-full space-y-3">
      {primaryActions.length > 0 && (
        <div className={`flex flex-wrap items-center gap-2 ${justifyClass}`}>{primaryActions.map(renderSingleItem)}</div>
      )}

      {statusChips.length > 0 && (
        <div className={`flex flex-wrap items-center gap-1.5 ${justifyClass}`}>{statusChips.map(renderSingleItem)}</div>
      )}
    </div>
  );
}
