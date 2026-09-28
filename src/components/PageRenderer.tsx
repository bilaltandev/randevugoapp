"use client";

import React, { useRef } from "react";
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
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { BookingWizard } from "./BookingWizard";
import { GalleryRenderer } from "./gallery/GalleryRenderer";
import { SectorBadge } from "./SectorBadge";
import { formatCurrency } from "@/lib/utils";

interface PageBlock {
  id: string;
  type: "Hero" | "About" | "Services" | "Staff" | "Gallery" | "Reviews" | "Location" | "Booking" | "Contact";
  title?: string;
  subtitle?: string;
  badge?: string;
  ctaText?: string;
  content?: string;
  image?: string;
  images?: string[];
  stats?: Array<{ label: string; value: string }>;
  showPrice?: boolean;
  showDuration?: boolean;
  address?: string;
  phone?: string;
  whatsapp?: string;
}

interface PageRendererProps {
  business: any;
  blocks: PageBlock[];
  services: any[];
  employees: any[];
  reviews: any[];
  themeColor?: string;
}

// Tailwind class maps per theme color
// All possible classes must be listed explicitly so Tailwind includes them in the build.
const THEME_MAP: Record<string, {
  bg: string;          // e.g. bg-indigo-600
  bgHover: string;     // e.g. hover:bg-indigo-500
  bgLight: string;     // e.g. bg-indigo-500/10
  bgLighter: string;   // e.g. bg-indigo-950/20
  text: string;        // e.g. text-indigo-400
  textBold: string;    // e.g. text-indigo-400  (same, used on headings)
  border: string;      // e.g. border-indigo-500
  borderLight: string; // e.g. border-indigo-500/20
  ring: string;        // e.g. ring-indigo-500
  shadow: string;      // e.g. shadow-indigo-600/30
  glow: string;        // e.g. bg-indigo-600/10
  staffAvatar: string; // e.g. bg-indigo-500/20 text-indigo-400 border-indigo-500/30
}> = {
  indigo: {
    bg: "bg-indigo-600",
    bgHover: "hover:bg-indigo-500",
    bgLight: "bg-indigo-500/10",
    bgLighter: "bg-indigo-950/20",
    text: "text-indigo-400",
    textBold: "text-indigo-400",
    border: "border-indigo-500",
    borderLight: "border-indigo-500/20",
    ring: "ring-indigo-500",
    shadow: "shadow-indigo-600/30",
    glow: "bg-indigo-600/10",
    staffAvatar: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  },
  emerald: {
    bg: "bg-emerald-600",
    bgHover: "hover:bg-emerald-500",
    bgLight: "bg-emerald-500/10",
    bgLighter: "bg-emerald-950/20",
    text: "text-emerald-400",
    textBold: "text-emerald-400",
    border: "border-emerald-500",
    borderLight: "border-emerald-500/20",
    ring: "ring-emerald-500",
    shadow: "shadow-emerald-600/30",
    glow: "bg-emerald-600/10",
    staffAvatar: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  amber: {
    bg: "bg-amber-500",
    bgHover: "hover:bg-amber-400",
    bgLight: "bg-amber-500/10",
    bgLighter: "bg-amber-950/20",
    text: "text-amber-400",
    textBold: "text-amber-400",
    border: "border-amber-500",
    borderLight: "border-amber-500/20",
    ring: "ring-amber-500",
    shadow: "shadow-amber-500/30",
    glow: "bg-amber-500/10",
    staffAvatar: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  rose: {
    bg: "bg-rose-600",
    bgHover: "hover:bg-rose-500",
    bgLight: "bg-rose-500/10",
    bgLighter: "bg-rose-950/20",
    text: "text-rose-400",
    textBold: "text-rose-400",
    border: "border-rose-500",
    borderLight: "border-rose-500/20",
    ring: "ring-rose-500",
    shadow: "shadow-rose-600/30",
    glow: "bg-rose-600/10",
    staffAvatar: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  },
  cyan: {
    bg: "bg-cyan-600",
    bgHover: "hover:bg-cyan-500",
    bgLight: "bg-cyan-500/10",
    bgLighter: "bg-cyan-950/20",
    text: "text-cyan-400",
    textBold: "text-cyan-400",
    border: "border-cyan-500",
    borderLight: "border-cyan-500/20",
    ring: "ring-cyan-500",
    shadow: "shadow-cyan-600/30",
    glow: "bg-cyan-600/10",
    staffAvatar: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
  violet: {
    bg: "bg-violet-600",
    bgHover: "hover:bg-violet-500",
    bgLight: "bg-violet-500/10",
    bgLighter: "bg-violet-950/20",
    text: "text-violet-400",
    textBold: "text-violet-400",
    border: "border-violet-500",
    borderLight: "border-violet-500/20",
    ring: "ring-violet-500",
    shadow: "shadow-violet-600/30",
    glow: "bg-violet-600/10",
    staffAvatar: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  },
};

export function PageRenderer({
  business,
  blocks,
  services,
  employees,
  reviews,
  themeColor = "indigo",
}: PageRendererProps) {
  const bookingRef = useRef<HTMLDivElement>(null);

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const theme = THEME_MAP[themeColor] ?? THEME_MAP["indigo"];

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 selection:${theme.bgLight}`}>
      {/* Top Floating Mini Header */}
      <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="w-10 h-10 rounded-xl object-contain bg-slate-900 border border-slate-700/80 p-0.5 shadow-sm"
              />
            ) : (
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.bg} font-bold text-white text-sm`}>
                {business.name.slice(0, 1)}
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                {business.name}
                {business.isVerified && (
                  <span title="Onaylı İşletme">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </span>
                )}
              </h1>
              <span className="text-[11px] text-slate-400">{business.city}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{business.phone}</span>
              </a>
            )}
            <button
              onClick={scrollToBooking}
              className={`rounded-xl ${theme.bg} px-4 py-2 text-xs font-semibold text-white shadow-md ${theme.shadow} ${theme.bgHover} transition-all active:scale-95`}
            >
              Randevu Al
            </button>
          </div>
        </div>
      </nav>

      {/* Render Dynamic Blocks */}
      <main className="space-y-16 pb-20">
        {blocks.map((block) => {
          switch (block.type) {
            case "Hero":
              return (
                <section
                  key={block.id}
                  className="relative pt-20 pb-28 px-4 overflow-hidden border-b border-slate-800/80"
                >
                  {/* Subtle Background Glow */}
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 ${theme.glow} blur-[120px] pointer-events-none rounded-full`} />

                  <div className="max-w-4xl mx-auto text-center relative z-10">
                    {business.logo && (
                      <div className="mb-6 flex justify-center">
                        <div className="relative group">
                          <div className={`absolute -inset-1 rounded-2xl ${theme.bg} opacity-20 blur-xl group-hover:opacity-30 transition`} />
                          <img
                            src={business.logo}
                            alt={business.name}
                            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-contain bg-slate-900/90 border border-slate-700/80 p-2 shadow-2xl"
                          />
                        </div>
                      </div>
                    )}

                    <div className={`inline-flex items-center gap-2 rounded-full ${theme.borderLight} border ${theme.bgLight} px-3.5 py-1 text-xs font-semibold ${theme.text} mb-6`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{block.badge || "Online Rezervasyon Açık"}</span>
                    </div>

                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
                      {block.title || business.name}
                    </h2>

                    <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8">
                      {block.subtitle || business.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                      <button
                        onClick={scrollToBooking}
                        className={`rounded-2xl ${theme.bg} px-8 py-4 text-base font-semibold text-white shadow-xl ${theme.shadow} ${theme.bgHover} transition-all active:scale-95`}
                      >
                        {block.ctaText || "Hemen Randevu Al"}
                      </button>

                      {business.whatsappNumber && (
                        <a
                          href={`https://wa.me/${business.whatsappNumber.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-4 text-sm font-semibold text-emerald-400 hover:bg-slate-800 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>WhatsApp Destek</span>
                        </a>
                      )}
                    </div>

                    {/* Stats & Rating preview */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-400 border-t border-slate-800/80 pt-8">
                      <div className="flex items-center gap-1.5">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-4 h-4 fill-amber-400" />
                          ))}
                        </div>
                        <span className="font-bold text-slate-200 ml-1">{averageRating}</span>
                        <span>({reviews.length} Değerlendirme)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Sıra Beklemeden Hizmet</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-4 h-4 ${theme.text}`} />
                        <span>7/24 Randevu Oluşturma</span>
                      </div>
                    </div>
                  </div>
                </section>
              );

            case "About":
              return (
                <section key={block.id} className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4">
                        {block.title || "Hakkımızda"}
                      </h3>
                      <p className="text-slate-300 leading-relaxed text-sm mb-6 whitespace-pre-line">
                        {block.content || business.description}
                      </p>

                      {block.stats && block.stats.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                          {block.stats.map((st, i) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                              <span className={`text-2xl font-bold ${theme.text}`}>{st.value}</span>
                              <p className="text-xs text-slate-400 mt-0.5">{st.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <img
                        src={
                          block.image ||
                          business.coverImage ||
                          "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop"
                        }
                        alt={business.name}
                        className="w-full h-80 rounded-3xl object-cover border border-slate-800 shadow-2xl"
                      />
                    </div>
                  </div>
                </section>
              );

            case "Services":
              return (
                <section key={block.id} className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="text-center mb-10">
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
                      {block.title || "Hizmetlerimiz & Fiyatlar"}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {block.subtitle || "Dilediğiniz hizmeti seçerek randevunuzu hemen ayırtın."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((srv) => (
                      <div
                        key={srv.id}
                        className="flex justify-between items-start rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-colors"
                      >
                        <div className="pr-4">
                          <h4 className="font-semibold text-base text-slate-100 mb-1">{srv.name}</h4>
                          {srv.description && (
                            <p className="text-xs text-slate-400 mb-3">{srv.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className={`w-3.5 h-3.5 ${theme.text}`} />
                            <span>{srv.durationMinutes} dakika</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block text-base font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 mb-2">
                            {srv.price === 0 ? "Ücretsiz" : formatCurrency(srv.price)}
                          </span>
                          <div>
                            <button
                              onClick={scrollToBooking}
                              className={`text-xs ${theme.text} font-medium transition-colors hover:opacity-80`}
                            >
                              Seç ve Randevu Al →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );

            case "Staff":
              return (
                <section key={block.id} className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="text-center mb-10">
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
                      {block.title || "Uzman Ekibimiz"}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {block.subtitle || "Alanında deneyimli çalışma arkadaşlarımız."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {employees.map((emp) => (
                      <div
                        key={emp.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center hover:border-slate-700 transition-colors"
                      >
                        {emp.photo ? (
                          <img
                            src={emp.photo}
                            alt={emp.name}
                            className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 border border-slate-700"
                          />
                        ) : (
                          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-4 border ${theme.staffAvatar}`}>
                            {emp.name.slice(0, 1)}
                          </div>
                        )}
                        <h4 className="font-semibold text-slate-100 text-base">{emp.name}</h4>
                        <p className={`text-xs ${theme.text} mt-0.5`}>{emp.specialty}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );

            case "Booking":
              return (
                <section
                  key={block.id}
                  ref={bookingRef}
                  id="booking-section"
                  className="max-w-4xl mx-auto px-4 sm:px-6 pt-6"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
                      {block.title || "Online Rezervasyon"}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {block.subtitle || "Tarih ve saatinizi belirleyin, randevunuzu hemen onaylayalım."}
                    </p>
                  </div>

                  <BookingWizard
                    business={business}
                    services={services}
                    employees={employees}
                    themeColors={{
                      background: "#080C10",
                      surface: "#101620",
                      surfaceHover: "#1E293B",
                      primary:
                        themeColor === "rose"
                          ? "#F43F5E"
                          : themeColor === "emerald"
                          ? "#10B981"
                          : themeColor === "amber"
                          ? "#F59E0B"
                          : themeColor === "cyan"
                          ? "#06B6D4"
                          : themeColor === "violet"
                          ? "#8B5CF6"
                          : "#6366F1",
                      primaryText: "#FFFFFF",
                      text: "#F1F5F9",
                      mutedText: "#94A3B8",
                      border: "#1E293B",
                      borderLight: "#334155",
                      accentGlow: "rgba(99,102,241,0.18)",
                      badgeBg: "rgba(255,255,255,0.06)",
                      badgeText:
                        themeColor === "rose"
                          ? "#F43F5E"
                          : themeColor === "emerald"
                          ? "#10B981"
                          : themeColor === "amber"
                          ? "#F59E0B"
                          : themeColor === "cyan"
                          ? "#06B6D4"
                          : themeColor === "violet"
                          ? "#8B5CF6"
                          : "#6366F1",
                    }}
                  />
                </section>
              );
            case "Gallery": {
              if (!business.gallery || !business.gallery.enabled) return null;
              return (
                <GalleryRenderer
                  key={block.id}
                  gallery={business.gallery}
                  items={business.gallery.items || business.galleryItems || []}
                  businessName={business.name}
                />
              );
            }

            case "Reviews":
              return (
                <section key={block.id} className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="text-center mb-10">
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
                      {block.title || "Müşteri Değerlendirmeleri"}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Randevusunu tamamlayan gerçek müşterilerimizin görüşleri.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.length === 0 ? (
                      <div className="col-span-2 text-center p-8 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                        Henüz değerlendirme yapılmamış. Randevunuzu tamamladıktan sonra siz de yorum bırakabilirsiniz!
                      </div>
                    ) : (
                      reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-semibold text-slate-100 text-sm">{rev.customerName}</h5>
                              <div className="flex text-amber-400 mt-1">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                                ))}
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {new Date(rev.createdAt).toLocaleDateString("tr-TR")}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs mt-2 italic leading-relaxed">
                            "{rev.comment}"
                          </p>

                          {rev.businessReply && (
                            <div className="mt-3.5 pt-3 border-t border-slate-800 bg-slate-950/40 p-3 rounded-xl text-xs">
                              <span className={`font-semibold ${theme.text} block mb-1`}>
                                İşletme Yanıtı:
                              </span>
                              <p className="text-slate-400 text-[11px]">{rev.businessReply}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              );

            case "Location":
              return (
                <section key={block.id} className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
                    <h3 className="text-2xl font-bold text-slate-100 mb-6">
                      {block.title || "İletişim & Ulaşım"}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                      <div className="flex items-start gap-3">
                        <MapPin className={`w-5 h-5 ${theme.text} shrink-0 mt-0.5`} />
                        <div>
                          <span className="font-semibold text-slate-200 block mb-1">Adres</span>
                          <p className="text-xs text-slate-400">{block.address || business.address}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className={`w-5 h-5 ${theme.text} shrink-0 mt-0.5`} />
                        <div>
                          <span className="font-semibold text-slate-200 block mb-1">Telefon</span>
                          <a
                            href={`tel:${block.phone || business.phone}`}
                            className={`text-xs ${theme.text} hover:underline`}
                          >
                            {block.phone || business.phone}
                          </a>
                        </div>
                      </div>

                      {business.whatsappNumber && (
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-200 block mb-1">WhatsApp</span>
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

            default:
              return null;
          }
        })}
      </main>

      {/* Floating WhatsApp Action Button (Bottom Right) */}
      {business.whatsappNumber && (
        <a
          href={`https://wa.me/${business.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
            `Merhaba ${business.name}, randevu hakkında bilgi almak istiyorum.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 hover:bg-emerald-400 hover:scale-110 active:scale-95 transition-all"
          title="WhatsApp ile İletişime Geçin"
        >
          <MessageSquare className="w-7 h-7" />
        </a>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-3 mb-4">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.name}
              className="w-10 h-10 rounded-xl object-contain bg-slate-900 border border-slate-800 p-1 shadow-sm"
            />
          ) : null}
          <p className="font-semibold text-slate-300">{business.name}</p>
        </div>
        <p>
          © {new Date().getFullYear()} {business.name}. Bu sayfa{" "}
          <Link href="/" className={`${theme.text} hover:underline font-semibold`}>
            RandevuGo SaaS
          </Link>{" "}
          altyapısı ile oluşturulmuştur.
        </p>
      </footer>
    </div>
  );
}
