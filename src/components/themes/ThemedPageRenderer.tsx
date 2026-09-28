"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  Phone,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Utensils,
  Award,
  ArrowRight,
  Info,
} from "lucide-react";
import { ThemeConfig, ThemeOverrides } from "@/lib/themes/types";
import { getThemeConfig } from "@/lib/themes/registry";
import { mergeThemeWithOverrides, getRadiusClass, getButtonTextColor } from "@/lib/themes/utils";
import { BookingWizard } from "@/components/BookingWizard";
import { GalleryRenderer } from "@/components/gallery/GalleryRenderer";
import { HeroActionsBar } from "@/components/hero/HeroActionsBar";
import { calculateHeroStats } from "@/lib/hero/stats";
import { formatCurrency } from "@/lib/utils";

export interface ThemedPageRendererProps {
  business: any;
  services: any[];
  employees: any[];
  reviews: any[];
  workingHours?: any[];
  appointments?: any[];
  gallery?: any;
  galleryItems?: any[];
  themeId?: string | null;
  themeOverrides?: ThemeOverrides | null;
  sectionOrder?: string[] | null;
  hiddenSections?: string[] | null;
  customBlocks?: any[] | null;
  previewDevice?: "desktop" | "tablet" | "mobile";
}

const DEFAULT_SECTIONS = ["Hero", "Services", "Staff", "Gallery", "Reviews", "Booking", "Location"];

export function ThemedPageRenderer({
  business,
  services = [],
  employees = [],
  reviews = [],
  workingHours = [],
  appointments = [],
  gallery = null,
  galleryItems = [],
  themeId = "premium-dark",
  themeOverrides = null,
  sectionOrder = null,
  hiddenSections = [],
  customBlocks = null,
  previewDevice = "desktop",
}: ThemedPageRendererProps) {
  const bookingRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const heroStats = calculateHeroStats({
    workingHours: workingHours.length > 0 ? workingHours : business.workingHours || [],
    appointments: appointments.length > 0 ? appointments : business.appointments || [],
    services,
    employees,
  });

  const baseConfig = getThemeConfig(themeId);
  const theme = mergeThemeWithOverrides(baseConfig, themeOverrides);
  const radius = getRadiusClass(theme.radius);

  // Compute accessible text color for primary-colored buttons
  const btnTextColor = getButtonTextColor(theme.colors.primary);

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const activeHiddenSections = new Set(hiddenSections || []);
  const sectionsToRender = (sectionOrder && sectionOrder.length > 0
    ? sectionOrder
    : DEFAULT_SECTIONS
  ).filter((s) => !activeHiddenSections.has(s) || s === "Booking" || s === "Services");

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : "5.0";

  // Categories if available
  const categories = Array.from(
    new Set(services.map((s) => s.category?.name).filter(Boolean))
  ) as string[];

  const filteredServices =
    activeCategory === "ALL"
      ? services
      : services.filter((s) => s.category?.name === activeCategory);

  // Responsive container class based on previewDevice mode
  const deviceContainerClass =
    previewDevice === "mobile"
      ? "max-w-[400px] mx-auto shadow-2xl rounded-[40px] border-8 border-slate-800 my-6 overflow-hidden min-h-[750px]"
      : previewDevice === "tablet"
      ? "max-w-[768px] mx-auto shadow-2xl rounded-3xl border-4 border-slate-800 my-6 overflow-hidden min-h-[800px]"
      : "w-full";

  return (
    <div
      className={`min-h-screen text-slate-100 transition-colors duration-300 ${deviceContainerClass}`}
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.typography.bodyFont,
      }}
    >
      {/* ────────────────── TOP NAVBAR ────────────────── */}
      <header
        className="sticky top-0 z-40 px-4 py-3 sm:px-8 border-b backdrop-blur-xl transition-colors"
        style={{
          backgroundColor: `${theme.colors.surface}EE`,
          borderColor: theme.colors.border,
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className={`w-10 h-10 object-contain p-1 border shadow-sm ${radius.badge}`}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }}
              />
            ) : (
              <div
                className={`flex h-10 w-10 items-center justify-center font-bold text-white text-sm shadow-md ${radius.badge}`}
                style={{ backgroundColor: theme.colors.primary }}
              >
                {business.name.slice(0, 1)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-bold tracking-tight"
                  style={{ color: theme.colors.text }}
                >
                  {business.name}
                </span>
                {business.isVerified && (
                  <span title="Doğrulanmış İşletme">
                    <ShieldCheck
                      className="w-4 h-4"
                      style={{ color: theme.colors.primary }}
                    />
                  </span>
                )}
              </div>
              <span className="text-[11px]" style={{ color: theme.colors.mutedText }}>
                {business.city || "Türkiye"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
                style={{ color: theme.colors.mutedText }}
              >
                <Phone className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} />
                <span>{business.phone}</span>
              </a>
            )}

            <button
              onClick={scrollToBooking}
              className={`px-4 py-2 text-xs font-semibold shadow-md transition-all active:scale-95 ${radius.button}`}
              style={{
                backgroundColor: theme.colors.primary,
                color: btnTextColor,
                boxShadow: `0 4px 14px ${theme.colors.accentGlow}`,
              }}
            >
              Hemen Randevu Al
            </button>
          </div>
        </div>
      </header>

      {/* ────────────────── MAIN DYNAMIC SECTIONS ────────────────── */}
      <main className="space-y-16 sm:space-y-24 pb-20">
        {sectionsToRender.map((sectionType) => {
          switch (sectionType) {
            // ──────── HERO SECTION ────────
            case "Hero": {
              const isCentered = theme.hero.layout === "centered" || theme.hero.layout === "minimal";
              const isSplit = theme.hero.layout === "split";
              const isBanner = theme.hero.layout === "banner";

              return (
                <section
                  key="hero"
                  className="relative pt-16 sm:pt-24 pb-20 sm:pb-28 px-4 overflow-hidden border-b"
                  style={{ borderColor: theme.colors.border }}
                >
                  {/* Atmospheric Glow */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 blur-[130px] pointer-events-none rounded-full"
                    style={{ backgroundColor: theme.colors.accentGlow }}
                  />

                  <div className="max-w-5xl mx-auto relative z-10">
                    {isSplit ? (
                      /* Split Layout (e.g. Modern Light / Restaurant Classic) */
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
                        <div className="md:col-span-7 text-left space-y-6">
                          <div
                            className={`inline-flex items-center gap-2 px-3.5 py-1 text-xs font-semibold border ${radius.badge}`}
                            style={{
                              backgroundColor: theme.colors.badgeBg,
                              color: theme.colors.badgeText,
                              borderColor: theme.colors.borderLight,
                            }}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{themeOverrides?.customBadge || "Online Rezervasyon Açık"}</span>
                          </div>

                          <h1
                            className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight"
                            style={{
                              color: theme.colors.text,
                              fontFamily: theme.typography.headingFont,
                            }}
                          >
                            {themeOverrides?.customTitle || business.name}
                          </h1>

                          <p
                            className="text-base sm:text-lg max-w-xl leading-relaxed"
                            style={{ color: theme.colors.mutedText }}
                          >
                            {themeOverrides?.customSubtitle ||
                              business.description ||
                              "Kaliteli hizmet ve profesyonel randevu deneyimi için hoş geldiniz."}
                          </p>

                          {/* Customizable Hero Action & Status Buttons */}
                          <HeroActionsBar
                            business={business}
                            stats={heroStats}
                            theme={theme}
                            itemsConfig={themeOverrides?.heroActions}
                            instagramUsername={themeOverrides?.instagramUsername}
                            googleMapsUrl={themeOverrides?.googleMapsUrl}
                            customCtaText={themeOverrides?.customCtaText}
                            onBookingClick={scrollToBooking}
                            align="left"
                          />

                          {/* Stats Preview */}
                          <div
                            className="pt-6 border-t flex items-center gap-6 text-xs"
                            style={{ borderColor: theme.colors.border }}
                          >
                            <div className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="font-bold" style={{ color: theme.colors.text }}>
                                {averageRating}
                              </span>
                              <span style={{ color: theme.colors.mutedText }}>
                                ({reviews.length} Değerlendirme)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span style={{ color: theme.colors.mutedText }}>Anında Onay</span>
                            </div>
                          </div>
                        </div>

                        {/* Split Hero Image */}
                        <div className="md:col-span-5">
                          <div className="relative group">
                            <div
                              className="absolute -inset-2 rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition"
                              style={{ backgroundColor: theme.colors.primary }}
                            />
                            <img
                              src={
                                business.coverImage ||
                                "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop"
                              }
                              alt={business.name}
                              className={`relative w-full h-80 sm:h-96 object-cover border shadow-2xl ${radius.card}`}
                              style={{ borderColor: theme.colors.border }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Centered / Banner / Minimal Layout */
                      <div className="text-center max-w-3xl mx-auto space-y-6">
                        {business.logo && (
                          <div className="flex justify-center mb-4">
                            <div className="relative group">
                              <div
                                className="absolute -inset-1 rounded-2xl opacity-20 blur-lg transition"
                                style={{ backgroundColor: theme.colors.primary }}
                              />
                              <img
                                src={business.logo}
                                alt={business.name}
                                className={`relative w-20 h-20 sm:w-24 sm:h-24 object-contain p-2 border shadow-2xl ${radius.card}`}
                                style={{
                                  backgroundColor: theme.colors.surface,
                                  borderColor: theme.colors.border,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div
                          className={`inline-flex items-center gap-2 px-3.5 py-1 text-xs font-semibold border ${radius.badge}`}
                          style={{
                            backgroundColor: theme.colors.badgeBg,
                            color: theme.colors.badgeText,
                            borderColor: theme.colors.borderLight,
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{themeOverrides?.customBadge || "Online Rezervasyon Açık"}</span>
                        </div>

                        <h1
                          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
                          style={{
                            color: theme.colors.text,
                            fontFamily: theme.typography.headingFont,
                          }}
                        >
                          {themeOverrides?.customTitle || business.name}
                        </h1>

                        <p
                          className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
                          style={{ color: theme.colors.mutedText }}
                        >
                          {themeOverrides?.customSubtitle ||
                            business.description ||
                            "Online randevunuzu kolayca oluşturun, sıra beklemeden kaliteli hizmet alın."}
                        </p>

                        {/* Customizable Hero Action & Status Buttons */}
                        <HeroActionsBar
                          business={business}
                          stats={heroStats}
                          theme={theme}
                          itemsConfig={themeOverrides?.heroActions}
                          instagramUsername={themeOverrides?.instagramUsername}
                          googleMapsUrl={themeOverrides?.googleMapsUrl}
                          customCtaText={themeOverrides?.customCtaText}
                          onBookingClick={scrollToBooking}
                          align="center"
                        />

                        {/* Centered Rating bar */}
                        <div
                          className="pt-8 border-t flex flex-wrap items-center justify-center gap-8 text-xs"
                          style={{ borderColor: theme.colors.border }}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="flex text-amber-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className="w-4 h-4 fill-amber-400" />
                              ))}
                            </div>
                            <span className="font-bold ml-1" style={{ color: theme.colors.text }}>
                              {averageRating}
                            </span>
                            <span style={{ color: theme.colors.mutedText }}>
                              ({reviews.length} Yorum)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span style={{ color: theme.colors.mutedText }}>
                              Garantili Randevu
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" style={{ color: theme.colors.primary }} />
                            <span style={{ color: theme.colors.mutedText }}>
                              7/24 Rezervasyon
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            // ──────── SERVICES / MENU SECTION ────────
            case "Services": {
              const isFoodCards = theme.sections.services === "foodCards";
              const isLuxuryGold = theme.sections.services === "luxuryGold";
              const isBorderedMinimal = theme.sections.services === "borderedMinimal";

              return (
                <section key="services" className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="text-center mb-10">
                    <span
                      className="text-xs font-bold uppercase tracking-wider block mb-1.5"
                      style={{ color: theme.colors.primary }}
                    >
                      {business.sector === "RESTORAN" ? "Menü & Lezzetler" : "Hizmetlerimiz"}
                    </span>
                    <h2
                      className="text-2xl sm:text-4xl font-extrabold"
                      style={{
                        color: theme.colors.text,
                        fontFamily: theme.typography.headingFont,
                      }}
                    >
                      {business.sector === "RESTORAN" ? "Özenle Hazırlanmış Menü" : "Hizmet ve Fiyat Listesi"}
                    </h2>
                    <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: theme.colors.mutedText }}>
                      Dilediğiniz hizmeti inceleyin ve anında randevunuzu oluşturun.
                    </p>
                  </div>

                  {/* Category Pills (if categories exist) */}
                  {categories.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                      <button
                        onClick={() => setActiveCategory("ALL")}
                        className={`px-4 py-1.5 text-xs font-semibold transition-all ${radius.badge}`}
                        style={{
                          backgroundColor:
                            activeCategory === "ALL" ? theme.colors.primary : theme.colors.surface,
                          color: activeCategory === "ALL" ? "#FFF" : theme.colors.mutedText,
                          border: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        Tümü ({services.length})
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4 py-1.5 text-xs font-semibold transition-all ${radius.badge}`}
                          style={{
                            backgroundColor:
                              activeCategory === cat ? theme.colors.primary : theme.colors.surface,
                            color: activeCategory === cat ? "#FFF" : theme.colors.mutedText,
                            border: `1px solid ${theme.colors.border}`,
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Section Render Mode */}
                  {isFoodCards ? (
                    /* Food Cards Layout (Restaurant Theme) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredServices.map((srv) => (
                        <div
                          key={srv.id}
                          className={`border overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${radius.card}`}
                          style={{
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          }}
                        >
                          {srv.image ? (
                            <img
                              src={srv.image}
                              alt={srv.name}
                              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div
                              className="w-full h-44 flex items-center justify-center"
                              style={{ backgroundColor: `${theme.colors.surfaceHover}` }}
                            >
                              <Utensils
                                className="w-10 h-10 opacity-30"
                                style={{ color: theme.colors.primary }}
                              />
                            </div>
                          )}

                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3
                                  className="font-bold text-base line-clamp-1"
                                  style={{ color: theme.colors.text }}
                                >
                                  {srv.name}
                                </h3>
                                <span
                                  className="font-bold text-sm shrink-0 px-2.5 py-0.5 rounded-lg border"
                                  style={{
                                    backgroundColor: theme.colors.badgeBg,
                                    color: theme.colors.primary,
                                    borderColor: theme.colors.borderLight,
                                  }}
                                >
                                  {srv.price === 0 ? "Ücretsiz" : formatCurrency(srv.price)}
                                </span>
                              </div>

                              {srv.description && (
                                <p
                                  className="text-xs line-clamp-2 mb-4"
                                  style={{ color: theme.colors.mutedText }}
                                >
                                  {srv.description}
                                </p>
                              )}
                            </div>

                            <div
                              className="pt-3 border-t flex items-center justify-between text-xs"
                              style={{ borderColor: theme.colors.border }}
                            >
                              <span style={{ color: theme.colors.mutedText }}>
                                {srv.durationMinutes} dk
                              </span>
                              <button
                                onClick={scrollToBooking}
                                className="font-semibold flex items-center gap-1 hover:underline"
                                style={{ color: theme.colors.primary }}
                              >
                                Seç & Rezervasyon →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isBorderedMinimal ? (
                    /* Minimal Bordered Rows */
                    <div
                      className={`border divide-y ${radius.card}`}
                      style={{
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      }}
                    >
                      {filteredServices.map((srv) => (
                        <div
                          key={srv.id}
                          className="p-5 sm:p-6 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          style={{ borderColor: theme.colors.border }}
                        >
                          <div>
                            <h3 className="font-semibold text-base" style={{ color: theme.colors.text }}>
                              {srv.name}
                            </h3>
                            {srv.description && (
                              <p className="text-xs mt-1" style={{ color: theme.colors.mutedText }}>
                                {srv.description}
                              </p>
                            )}
                            <span className="text-[11px] block mt-1" style={{ color: theme.colors.mutedText }}>
                              Süre: {srv.durationMinutes} dakika
                            </span>
                          </div>

                          <div className="text-right shrink-0 ml-4">
                            <span className="text-base font-bold block" style={{ color: theme.colors.text }}>
                              {srv.price === 0 ? "Ücretsiz" : formatCurrency(srv.price)}
                            </span>
                            <button
                              onClick={scrollToBooking}
                              className="text-xs font-semibold mt-1 hover:underline"
                              style={{ color: theme.colors.primary }}
                            >
                              Randevu Al →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Standard / Dark Glass / White Clean Cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredServices.map((srv) => (
                        <div
                          key={srv.id}
                          className={`p-5 sm:p-6 border flex justify-between items-start transition-all hover:scale-[1.01] ${radius.card}`}
                          style={{
                            backgroundColor: theme.colors.surface,
                            borderColor: isLuxuryGold ? `${theme.colors.primary}40` : theme.colors.border,
                            boxShadow: isLuxuryGold ? `0 4px 20px ${theme.colors.accentGlow}` : undefined,
                          }}
                        >
                          <div className="pr-4">
                            <h3
                              className="font-bold text-base mb-1"
                              style={{ color: theme.colors.text }}
                            >
                              {srv.name}
                            </h3>
                            {srv.description && (
                              <p
                                className="text-xs mb-3 leading-relaxed"
                                style={{ color: theme.colors.mutedText }}
                              >
                                {srv.description}
                              </p>
                            )}
                            <div
                              className="flex items-center gap-1.5 text-xs"
                              style={{ color: theme.colors.mutedText }}
                            >
                              <Clock className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} />
                              <span>{srv.durationMinutes} dakika</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`inline-block text-base font-bold px-3 py-1 border mb-2 ${radius.badge}`}
                              style={{
                                backgroundColor: theme.colors.badgeBg,
                                color: theme.colors.badgeText,
                                borderColor: theme.colors.borderLight,
                              }}
                            >
                              {srv.price === 0 ? "Ücretsiz" : formatCurrency(srv.price)}
                            </span>
                            <div>
                              <button
                                onClick={scrollToBooking}
                                className="text-xs font-semibold transition-opacity hover:opacity-80 block"
                                style={{ color: theme.colors.primary }}
                              >
                                Seç & Randevu Al →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            }

            // ──────── EMPLOYEES / STAFF SECTION ────────
            case "Staff": {
              if (employees.length === 0) return null;
              const isCircular = theme.sections.employees === "circularAvatar";
              const isChef = theme.sections.employees === "chefCards";

              return (
                <section key="staff" className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="text-center mb-10">
                    <span
                      className="text-xs font-bold uppercase tracking-wider block mb-1.5"
                      style={{ color: theme.colors.primary }}
                    >
                      {isChef ? "Mutfak & Servis Ekibimiz" : "Deneyimli Kadromuz"}
                    </span>
                    <h2
                      className="text-2xl sm:text-4xl font-extrabold"
                      style={{
                        color: theme.colors.text,
                        fontFamily: theme.typography.headingFont,
                      }}
                    >
                      {isChef ? "Usta Şeflerimiz & Ekibimiz" : "Uzmanlarımız ile Tanışın"}
                    </h2>
                    <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: theme.colors.mutedText }}>
                      Alanında uzman profesyonellerimizden dilediğinizi seçerek randevu alabilirsiniz.
                    </p>
                  </div>

                  <div
                    className={`grid gap-6 ${
                      employees.length === 1
                        ? "grid-cols-1 max-w-xs mx-auto"
                        : employees.length === 2
                        ? "grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto"
                        : employees.length === 3
                        ? "grid-cols-1 sm:grid-cols-3 max-w-2xl mx-auto"
                        : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    }`}
                  >
                    {employees.map((emp) => (
                      <div
                        key={emp.id}
                        className={`p-6 text-center border transition-all hover:scale-[1.02] ${radius.card}`}
                        style={{
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        }}
                      >
                        {emp.photo ? (
                          <img
                            src={emp.photo}
                            alt={emp.name}
                            className={`w-24 h-24 object-cover mx-auto mb-4 border ${
                              isCircular ? "rounded-full" : radius.card
                            }`}
                            style={{ borderColor: theme.colors.borderLight }}
                          />
                        ) : (
                          <div
                            className={`w-24 h-24 flex items-center justify-center font-bold text-2xl mx-auto mb-4 border shadow-inner ${
                              isCircular ? "rounded-full" : radius.card
                            }`}
                            style={{
                              backgroundColor: theme.colors.badgeBg,
                              color: theme.colors.primary,
                              borderColor: theme.colors.borderLight,
                            }}
                          >
                            {emp.name.slice(0, 1)}
                          </div>
                        )}

                        <h3 className="font-bold text-base" style={{ color: theme.colors.text }}>
                          {emp.name}
                        </h3>
                        <p className="text-xs mt-1 font-medium" style={{ color: theme.colors.primary }}>
                          {emp.specialty}
                        </p>
                        <button
                          onClick={scrollToBooking}
                          className={`mt-4 px-4 py-1.5 text-[11px] font-semibold block mx-auto transition-all hover:opacity-90 ${radius.badge}`}
                          style={{
                            backgroundColor: theme.colors.primary,
                            color: btnTextColor,
                          }}
                        >
                          Randevu Al →
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            // ──────── REVIEWS SECTION ────────
            case "Reviews": {
              return (
                <section key="reviews" className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="text-center mb-10">
                    <span
                      className="text-xs font-bold uppercase tracking-wider block mb-1.5"
                      style={{ color: theme.colors.primary }}
                    >
                      Müşteri Deneyimleri
                    </span>
                    <h2
                      className="text-2xl sm:text-4xl font-extrabold"
                      style={{
                        color: theme.colors.text,
                        fontFamily: theme.typography.headingFont,
                      }}
                    >
                      Gerçek Değerlendirmeler
                    </h2>
                    <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: theme.colors.mutedText }}>
                      Hizmet alan müşterilerimizin doğrulanmış yorumları.
                    </p>
                  </div>

                  {reviews.length === 0 ? (
                    <div
                      className={`text-center p-8 border ${radius.card}`}
                      style={{
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        color: theme.colors.mutedText,
                      }}
                    >
                      Henüz müşteri değerlendirmesi bulunmuyor. Hizmetinizi tamamladıktan sonra siz de yorum yapabilirsiniz!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className={`p-6 border ${radius.card}`}
                          style={{
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className="font-bold text-sm block" style={{ color: theme.colors.text }}>
                                {rev.customerName}
                              </span>
                              <div className="flex text-amber-400 mt-1">
                                {[...Array(rev.rating || 5)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                                ))}
                              </div>
                            </div>
                            <span className="text-[11px]" style={{ color: theme.colors.mutedText }}>
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("tr-TR") : ""}
                            </span>
                          </div>

                          <p
                            className="text-xs italic leading-relaxed"
                            style={{ color: theme.colors.mutedText }}
                          >
                            "{rev.comment}"
                          </p>

                          {rev.businessReply && (
                            <div
                              className={`mt-4 p-3 border text-xs ${radius.card}`}
                              style={{
                                backgroundColor: theme.colors.surfaceHover,
                                borderColor: theme.colors.borderLight,
                              }}
                            >
                              <span className="font-semibold block mb-1" style={{ color: theme.colors.primary }}>
                                İşletme Yanıtı:
                              </span>
                              <p style={{ color: theme.colors.mutedText }}>{rev.businessReply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            }

            // ──────── GALLERY SECTION ────────
            case "Gallery": {
              const galleryData = gallery || business?.gallery;
              const itemsData = galleryItems || galleryData?.items || business?.galleryItems || [];

              if (!galleryData || !galleryData.enabled) return null;

              return (
                <GalleryRenderer
                  key="gallery"
                  gallery={galleryData}
                  items={itemsData}
                  theme={theme}
                  radius={radius}
                  businessName={business.name}
                  previewDevice={previewDevice}
                />
              );
            }

            // ──────── ONLINE BOOKING ENGINE ────────
            case "Booking": {
              return (
                <section
                  key="booking"
                  ref={bookingRef}
                  id="booking-section"
                  className="max-w-5xl mx-auto px-4 sm:px-6 pt-4"
                >
                  {/* Booking header with a subtle accent band */}
                  <div
                    className={`relative overflow-hidden mb-8 p-6 sm:p-8 text-center ${radius.card}`}
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.surfaceHover} 100%)`,
                      borderTop: `3px solid ${theme.colors.primary}`,
                      boxShadow: `0 8px 32px ${theme.colors.accentGlow}`,
                    }}
                  >
                    {/* Glow blob */}
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 blur-[80px] pointer-events-none opacity-40 rounded-full"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div className="relative z-10">
                      <span
                        className="text-xs font-bold uppercase tracking-wider block mb-2"
                        style={{ color: theme.colors.primary }}
                      >
                        Hemen Başlayın
                      </span>
                      <h2
                        className="text-2xl sm:text-4xl font-extrabold mb-2"
                        style={{
                          color: theme.colors.text,
                          fontFamily: theme.typography.headingFont,
                        }}
                      >
                        Online Rezervasyon Motoru
                      </h2>
                      <p className="text-sm max-w-xl mx-auto" style={{ color: theme.colors.mutedText }}>
                        Tarih ve saatinizi seçin, randevunuzu birkaç saniye içinde tamamlayın.
                      </p>
                    </div>
                  </div>

                  <div className="w-full flex justify-center">
                    <BookingWizard
                      business={business}
                      services={services}
                      employees={employees}
                      themeColors={{
                        background: theme.colors.background,
                        surface: theme.colors.surface,
                        surfaceHover: theme.colors.surfaceHover,
                        primary: theme.colors.primary,
                        primaryText: theme.colors.primaryText || btnTextColor,
                        text: theme.colors.text,
                        mutedText: theme.colors.mutedText,
                        border: theme.colors.border,
                        borderLight: theme.colors.borderLight,
                        accentGlow: theme.colors.accentGlow,
                        badgeBg: theme.colors.badgeBg,
                        badgeText: theme.colors.badgeText,
                      }}
                      themeRadius={theme.radius}
                    />
                  </div>
                </section>
              );
            }

            // ──────── LOCATION & CONTACT ────────
            case "Location": {
              return (
                <section key="location" className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div
                    className={`border p-8 sm:p-10 ${radius.card}`}
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <h2
                      className="text-2xl font-bold mb-6"
                      style={{ color: theme.colors.text, fontFamily: theme.typography.headingFont }}
                    >
                      İletişim & Ulaşım Bilgileri
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 shrink-0 mt-0.5" style={{ color: theme.colors.primary }} />
                        <div>
                          <span className="font-semibold block mb-1" style={{ color: theme.colors.text }}>
                            Adres
                          </span>
                          <p className="text-xs leading-relaxed" style={{ color: theme.colors.mutedText }}>
                            {business.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 shrink-0 mt-0.5" style={{ color: theme.colors.primary }} />
                        <div>
                          <span className="font-semibold block mb-1" style={{ color: theme.colors.text }}>
                            Telefon
                          </span>
                          <a
                            href={`tel:${business.phone}`}
                            className="text-xs hover:underline"
                            style={{ color: theme.colors.primary }}
                          >
                            {business.phone}
                          </a>
                        </div>
                      </div>

                      {business.whatsappNumber && (
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block mb-1" style={{ color: theme.colors.text }}>
                              WhatsApp Destek
                            </span>
                            <a
                              href={`https://wa.me/${business.whatsappNumber.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-emerald-400 hover:underline"
                            >
                              Mesaj Gönder
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            }

            default:
              return null;
          }
        })}
      </main>

      {/* ────────────────── FLOATING WHATSAPP BUTTON ────────────────── */}
      {business.whatsappNumber && (
        <a
          href={`https://wa.me/${business.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
            `Merhaba ${business.name}, randevu hakkında bilgi almak istiyorum.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 hover:bg-emerald-400 hover:scale-110 active:scale-95 transition-all"
          title="WhatsApp İle İletişim"
        >
          <MessageSquare className="w-7 h-7" />
        </a>
      )}

      {/* ────────────────── FOOTER ────────────────── */}
      <footer
        className="border-t py-10 px-4 text-center text-xs"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: theme.colors.mutedText,
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-3 mb-4">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.name}
              className={`w-10 h-10 object-contain p-1 border shadow-sm ${radius.badge}`}
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              }}
            />
          ) : null}
          <p className="font-semibold" style={{ color: theme.colors.text }}>
            {business.name}
          </p>
        </div>
        <p>
          © {new Date().getFullYear()} {business.name}. Bu sayfa{" "}
          <Link href="/" className="font-semibold hover:underline" style={{ color: theme.colors.primary }}>
            RandevuGo SaaS
          </Link>{" "}
          hazır tema altyapısı ile sunulmaktadır.
        </p>
      </footer>
    </div>
  );
}
