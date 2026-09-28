"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Maximize2,
  ZoomIn,
  Eye,
  Camera,
} from "lucide-react";
import {
  GalleryData,
  GalleryItemData,
  SPEED_DURATION_MAP,
  IMAGE_SIZES,
  ASPECT_RATIOS,
} from "@/lib/gallery/types";

interface GalleryRendererProps {
  gallery: GalleryData | null;
  items?: GalleryItemData[];
  theme?: any;
  radius?: any;
  businessName?: string;
  previewDevice?: "desktop" | "tablet" | "mobile";
}

export function GalleryRenderer({
  gallery,
  items: directItems,
  theme,
  radius,
  businessName = "İşletme",
  previewDevice = "desktop",
}: GalleryRendererProps) {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [scrollSpeedFactor, setScrollSpeedFactor] = useState(1);
  const [scrollDirection, setScrollDirection] = useState<"down" | "up">("down");
  const [inView, setInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Active items (only active ones)
  const items = (directItems || gallery?.items || []).filter((item) => item.isActive);

  // If gallery is disabled or has no active items, do not render
  if (!gallery || !gallery.enabled || items.length === 0) {
    return null;
  }

  // Theme defaults fallback
  const c = theme?.colors || {
    surface: "#101620",
    surfaceHover: "#1E293B",
    primary: "#6366F1",
    primaryText: "#FFFFFF",
    text: "#F1F5F9",
    mutedText: "#94A3B8",
    border: "#1E293B",
    accentGlow: "rgba(99,102,241,0.18)",
    badgeBg: "rgba(99,102,241,0.12)",
    badgeText: "#818CF8",
  };

  const rClass = radius?.card || "rounded-2xl";
  const rButton = radius?.button || "rounded-xl";
  const rBadge = radius?.badge || "rounded-lg";

  // Border radius map
  const customRadiusClass =
    gallery.borderRadius === "none"
      ? "rounded-none"
      : gallery.borderRadius === "subtle"
      ? "rounded-lg"
      : gallery.borderRadius === "extra"
      ? "rounded-3xl"
      : rClass;

  // Aspect ratio class
  const activeAspect =
    ASPECT_RATIOS.find((a) => a.id === gallery.aspectRatio)?.ratioClass || "aspect-[4/5]";

  // Image size config
  const sizeConfig = IMAGE_SIZES[gallery.imageSize] || IMAGE_SIZES.MEDIUM;

  // Animation duration
  const baseDuration = SPEED_DURATION_MAP[gallery.speed] || 35;
  const effectiveDuration = Math.max(8, baseDuration / scrollSpeedFactor);

  // Direction: if scrollDirectionTracking is enabled and scrolling up, invert
  let activeDirection = gallery.direction || "right-to-left";
  if (gallery.scrollDirectionTracking && scrollDirection === "up") {
    activeDirection = activeDirection === "right-to-left" ? "left-to-right" : "right-to-left";
  }

  // Entrance scroll animation observer
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Scroll reaction (Scroll Tepkisi & Scroll Yönü)
  useEffect(() => {
    if (!gallery.scrollReactive && !gallery.scrollDirectionTracking) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      if (gallery.scrollDirectionTracking && Math.abs(diff) > 4) {
        setScrollDirection(diff > 0 ? "down" : "up");
      }

      if (gallery.scrollReactive) {
        const speed = Math.min(Math.abs(diff), 80);
        const factor = 1 + (speed / 80) * 1.8; // up to ~2.8x speed
        setScrollSpeedFactor(factor);

        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          setScrollSpeedFactor(1); // smoothly ease back
        }, 300);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [gallery.scrollReactive, gallery.scrollDirectionTracking]);

  // Handle click on image
  const handleItemClick = (index: number) => {
    if (gallery.clickAction === "NONE") return;
    setActiveLightboxIndex(index);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setActiveLightboxIndex((prev) =>
          prev !== null ? (prev === 0 ? items.length - 1 : prev - 1) : null
        );
      } else if (e.key === "ArrowRight") {
        setActiveLightboxIndex((prev) =>
          prev !== null ? (prev === items.length - 1 ? 0 : prev + 1) : null
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightboxIndex, items.length]);

  // Entrance animation classes
  const getEntranceClass = () => {
    if (!inView) {
      switch (gallery.scrollAnimation) {
        case "Fade In":
          return "opacity-0 transition-opacity duration-1000";
        case "Fade Up":
          return "opacity-0 translate-y-12 transition-all duration-1000 ease-out";
        case "Fade Down":
          return "opacity-0 -translate-y-12 transition-all duration-1000 ease-out";
        case "Slide Left":
          return "opacity-0 translate-x-16 transition-all duration-1000 ease-out";
        case "Slide Right":
          return "opacity-0 -translate-x-16 transition-all duration-1000 ease-out";
        case "Scale In":
          return "opacity-0 scale-90 transition-all duration-1000 ease-out";
        case "Blur Reveal":
          return "opacity-0 blur-md transition-all duration-1000 ease-out";
        case "Clip Reveal":
          return "opacity-0 scale-95 transition-all duration-1000 ease-out";
        case "Stagger Reveal":
          return "opacity-0 translate-y-8 transition-all duration-1000 ease-out";
        default:
          return "";
      }
    }
    return "opacity-100 translate-y-0 translate-x-0 scale-100 blur-0";
  };

  // Render Section Header
  const renderHeader = () => {
    if (!gallery.showTitle) return null;
    return (
      <div className="text-center mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
        <span
          className="text-xs font-bold uppercase tracking-wider block mb-2"
          style={{ color: c.primary }}
        >
          {businessName} Portföy
        </span>
        <h2
          className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight"
          style={{
            color: c.text,
            fontFamily: theme?.typography?.headingFont,
          }}
        >
          {gallery.title || "Fotoğraf Galerisi"}
        </h2>
        {gallery.subtitle && (
          <p className="text-xs sm:text-sm max-w-xl mx-auto" style={{ color: c.mutedText }}>
            {gallery.subtitle}
          </p>
        )}
      </div>
    );
  };

  // Ensure enough items so that 50% of the track is wider than the viewport
  let baseItems = [...items];
  while (baseItems.length < 6 && baseItems.length > 0) {
    baseItems = [...baseItems, ...items];
  }
  // Exactly 2 equal halves for seamless 0% -> -50% infinite translation
  const marqueeItems = [...baseItems, ...baseItems];

  const isPaused = isHovered && gallery.pauseOnHover;

  const rtlTrackStyle: React.CSSProperties = {
    animationName: "marquee-rtl",
    animationDuration: `${effectiveDuration}s`,
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    animationPlayState: isPaused ? "paused" : "running",
    display: "flex",
    width: "max-content",
    willChange: "transform",
  };

  const ltrTrackStyle: React.CSSProperties = {
    animationName: "marquee-ltr",
    animationDuration: `${effectiveDuration}s`,
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    animationPlayState: isPaused ? "paused" : "running",
    display: "flex",
    width: "max-content",
    willChange: "transform",
  };

  const primaryTrackStyle = activeDirection === "right-to-left" ? rtlTrackStyle : ltrTrackStyle;
  const secondaryTrackStyle = activeDirection === "right-to-left" ? ltrTrackStyle : rtlTrackStyle;

  return (
    <section
      ref={sectionRef}
      id="gallery-section"
      className={`relative py-8 sm:py-14 overflow-hidden transition-all duration-700 ${getEntranceClass()}`}
    >
      {/* Fallback Keyframes Injection */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes marquee-rtl {
              0% { transform: translate3d(0%, 0, 0); }
              100% { transform: translate3d(-50%, 0, 0); }
            }
            @keyframes marquee-ltr {
              0% { transform: translate3d(-50%, 0, 0); }
              100% { transform: translate3d(0%, 0, 0); }
            }
          `,
        }}
      />

      {renderHeader()}

      {/* ──────────────── LAYOUT 1: INFINITE FLOW (Default Seamless Marquee) ──────────────── */}
      {gallery.layout === "INFINITE_FLOW" && (
        <div
          className="relative w-full overflow-hidden marquee-track-container py-2"
          onMouseEnter={() => gallery.pauseOnHover && setIsHovered(true)}
          onMouseLeave={() => gallery.pauseOnHover && setIsHovered(false)}
        >
          {/* Subtle edge fade overlays for infinite gradient look */}
          <div
            className="absolute left-0 top-0 bottom-0 w-12 sm:w-28 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${theme?.colors?.background || "#0B0B0B"}, transparent)`,
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-12 sm:w-28 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to left, ${theme?.colors?.background || "#0B0B0B"}, transparent)`,
            }}
          />

          <div
            className="flex w-max items-center gap-4 sm:gap-6 will-change-transform"
            style={primaryTrackStyle}
          >
            {marqueeItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => handleItemClick(idx % items.length)}
                className={`group relative shrink-0 overflow-hidden cursor-pointer border transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${customRadiusClass} ${sizeConfig.heightClass} ${sizeConfig.widthClass}`}
                style={{
                  borderColor: c.border,
                  backgroundColor: c.surface,
                  boxShadow: `0 8px 30px rgba(0,0,0,0.12)`,
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.altText || item.title || "Galeri Görseli"}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${activeAspect}`}
                />

                {/* Subtle Vignette & Title Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                  {item.title && (
                    <h4 className="text-white text-sm font-bold tracking-wide drop-shadow-md line-clamp-1">
                      {item.title}
                    </h4>
                  )}
                  {item.description && (
                    <p className="text-white/80 text-xs mt-0.5 line-clamp-2 drop-shadow">
                      {item.description}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/90 mt-2">
                    <Maximize2 className="w-3.5 h-3.5" style={{ color: c.primary }} />
                    <span>Büyüt</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────── LAYOUT 2: DUAL FLOW (Çift Şeritli Zıt Yönlü Marquee) ──────────────── */}
      {gallery.layout === "DUAL_FLOW" && (
        <div
          className="space-y-4 sm:space-y-6 relative w-full overflow-hidden marquee-track-container py-2"
          onMouseEnter={() => gallery.pauseOnHover && setIsHovered(true)}
          onMouseLeave={() => gallery.pauseOnHover && setIsHovered(false)}
        >
          {/* Subtle edge fades */}
          <div
            className="absolute left-0 top-0 bottom-0 w-12 sm:w-28 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${theme?.colors?.background || "#0B0B0B"}, transparent)`,
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-12 sm:w-28 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to left, ${theme?.colors?.background || "#0B0B0B"}, transparent)`,
            }}
          />

          {/* Row 1: Primary Direction */}
          <div
            className="flex w-max items-center gap-4 sm:gap-6 will-change-transform"
            style={primaryTrackStyle}
          >
            {marqueeItems.map((item, idx) => (
              <div
                key={`row1-${item.id}-${idx}`}
                onClick={() => handleItemClick(idx % items.length)}
                className={`group relative shrink-0 overflow-hidden cursor-pointer border transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${customRadiusClass} ${sizeConfig.heightClass} ${sizeConfig.widthClass}`}
                style={{
                  borderColor: c.border,
                  backgroundColor: c.surface,
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.altText || item.title || "Galeri Görseli"}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${activeAspect}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                  {item.title && (
                    <h4 className="text-white text-sm font-bold tracking-wide drop-shadow-md line-clamp-1">
                      {item.title}
                    </h4>
                  )}
                  {item.description && (
                    <p className="text-white/80 text-xs mt-0.5 line-clamp-2 drop-shadow">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Row 2: Secondary / Opposite Direction */}
          <div
            className="flex w-max items-center gap-4 sm:gap-6 will-change-transform"
            style={secondaryTrackStyle}
          >
            {[...marqueeItems].reverse().map((item, idx) => (
              <div
                key={`row2-${item.id}-${idx}`}
                onClick={() => handleItemClick(idx % items.length)}
                className={`group relative shrink-0 overflow-hidden cursor-pointer border transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${customRadiusClass} ${sizeConfig.heightClass} ${sizeConfig.widthClass}`}
                style={{
                  borderColor: c.border,
                  backgroundColor: c.surface,
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.altText || item.title || "Galeri Görseli"}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${activeAspect}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                  {item.title && (
                    <h4 className="text-white text-sm font-bold tracking-wide drop-shadow-md line-clamp-1">
                      {item.title}
                    </h4>
                  )}
                  {item.description && (
                    <p className="text-white/80 text-xs mt-0.5 line-clamp-2 drop-shadow">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────── LAYOUT 3: CINEMATIC STRIP ──────────────── */}
      {gallery.layout === "CINEMATIC_STRIP" && (
        <div
          className="relative w-full overflow-hidden marquee-track-container py-4"
          onMouseEnter={() => gallery.pauseOnHover && setIsHovered(true)}
          onMouseLeave={() => gallery.pauseOnHover && setIsHovered(false)}
        >
          <div
            className="flex w-max items-center gap-6 sm:gap-8 will-change-transform"
            style={primaryTrackStyle}
          >
            {marqueeItems.map((item, idx) => (
              <div
                key={`cinematic-${item.id}-${idx}`}
                onClick={() => handleItemClick(idx % items.length)}
                className={`group relative shrink-0 overflow-hidden cursor-pointer border transition-all duration-500 hover:shadow-2xl ${customRadiusClass} h-72 sm:h-96 w-80 sm:w-[460px]`}
                style={{
                  borderColor: c.border,
                  backgroundColor: c.surface,
                  boxShadow: `0 12px 40px ${c.accentGlow}`,
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.altText || item.title || "Sinematik Görsel"}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-6 flex flex-col justify-end">
                  <div className="transform transition-transform duration-300 group-hover:-translate-y-1">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider block mb-1"
                      style={{ color: c.primary }}
                    >
                      Koleksiyon
                    </span>
                    <h3 className="text-white text-lg font-bold drop-shadow-md line-clamp-1">
                      {item.title || "Seçkin Hizmet"}
                    </h3>
                    {item.description && (
                      <p className="text-white/80 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────── LAYOUT 4: CARDS (Interactive Horizontal Track) ──────────────── */}
      {gallery.layout === "CARDS" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x snap-mandatory">
            {items.map((item, idx) => (
              <div
                key={`card-${item.id}`}
                onClick={() => handleItemClick(idx)}
                className={`shrink-0 snap-center cursor-pointer border p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${customRadiusClass} ${sizeConfig.widthClass}`}
                style={{
                  backgroundColor: c.surface,
                  borderColor: c.border,
                }}
              >
                <div className={`overflow-hidden ${customRadiusClass} ${activeAspect} mb-3 relative`}>
                  <img
                    src={item.imageUrl}
                    alt={item.altText || item.title || "Kart Görseli"}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </div>
                </div>
                {item.title && (
                  <h4 className="font-semibold text-sm line-clamp-1" style={{ color: c.text }}>
                    {item.title}
                  </h4>
                )}
                {item.description && (
                  <p className="text-xs line-clamp-2 mt-1" style={{ color: c.mutedText }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────── LAYOUT 5: MASONRY (Multi-Column Grid) ──────────────── */}
      {gallery.layout === "MASONRY" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
            {items.map((item, idx) => (
              <div
                key={`masonry-${item.id}`}
                onClick={() => handleItemClick(idx)}
                className={`break-inside-avoid group relative overflow-hidden cursor-pointer border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${customRadiusClass}`}
                style={{
                  borderColor: c.border,
                  backgroundColor: c.surface,
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.altText || item.title || "Masonry Görseli"}
                  loading="lazy"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                  {item.title && (
                    <h4 className="text-white text-sm font-bold drop-shadow">{item.title}</h4>
                  )}
                  {item.description && (
                    <p className="text-white/80 text-xs mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────── LAYOUT 6: EDITORIAL (Magazine Feature Grid) ──────────────── */}
      {gallery.layout === "EDITORIAL" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
            {items.slice(0, 6).map((item, idx) => {
              // Asymmetric bento-like arrangement
              const isLarge = idx === 0 || idx === 3;
              const colSpan = isLarge ? "md:col-span-8 h-80 sm:h-[460px]" : "md:col-span-4 h-80 sm:h-[460px]";

              return (
                <div
                  key={`editorial-${item.id}`}
                  onClick={() => handleItemClick(idx)}
                  className={`group relative overflow-hidden cursor-pointer border transition-all duration-500 hover:shadow-2xl ${customRadiusClass} ${colSpan}`}
                  style={{
                    borderColor: c.border,
                    backgroundColor: c.surface,
                  }}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.altText || item.title || "Editorial Görsel"}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-6 flex flex-col justify-end">
                    <span
                      className="text-xs font-bold uppercase tracking-wider block mb-1"
                      style={{ color: c.primary }}
                    >
                      Özel Seri #{idx + 1}
                    </span>
                    <h3 className="text-white text-base sm:text-xl font-bold drop-shadow line-clamp-1">
                      {item.title || "Seçkin Hizmet Detayı"}
                    </h3>
                    {item.description && (
                      <p className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2 max-w-md">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────── LAYOUT 7: FULL BLEED ──────────────── */}
      {gallery.layout === "FULL_BLEED" && (
        <div
          className="relative w-full overflow-hidden marquee-track-container py-1"
          onMouseEnter={() => gallery.pauseOnHover && setIsHovered(true)}
          onMouseLeave={() => gallery.pauseOnHover && setIsHovered(false)}
        >
          <div
            className="flex w-max items-center gap-3 sm:gap-4 will-change-transform"
            style={primaryTrackStyle}
          >
            {marqueeItems.map((item, idx) => (
              <div
                key={`bleed-${item.id}-${idx}`}
                onClick={() => handleItemClick(idx % items.length)}
                className={`group relative shrink-0 overflow-hidden cursor-pointer h-72 sm:h-[420px] w-72 sm:w-[420px]`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.altText || item.title || "Full Bleed Görsel"}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────── LIGHTBOX MODAL ──────────────── */}
      {activeLightboxIndex !== null && items[activeLightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-xl animate-fade-in"
          onClick={() => setActiveLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setActiveLightboxIndex(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
            title="Kapat (ESC)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveLightboxIndex((prev) =>
                prev !== null ? (prev === 0 ? items.length - 1 : prev - 1) : null
              );
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-50"
            title="Önceki Görsel"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveLightboxIndex((prev) =>
                prev !== null ? (prev === items.length - 1 ? 0 : prev + 1) : null
              );
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-50"
            title="Sonraki Görsel"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Content Box */}
          <div
            className="relative max-w-5xl max-h-[88vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-white/10 max-h-[72vh] flex items-center justify-center">
              <img
                src={items[activeLightboxIndex].imageUrl}
                alt={items[activeLightboxIndex].altText || items[activeLightboxIndex].title || ""}
                className="max-h-[72vh] max-w-full object-contain"
              />
            </div>

            {/* Bottom Caption & Counter */}
            <div className="mt-4 text-center max-w-xl text-white">
              <span className="text-xs text-white/50 block font-mono mb-1">
                {activeLightboxIndex + 1} / {items.length}
              </span>
              {items[activeLightboxIndex].title && (
                <h3 className="text-base sm:text-lg font-bold tracking-wide">
                  {items[activeLightboxIndex].title}
                </h3>
              )}
              {items[activeLightboxIndex].description && (
                <p className="text-xs sm:text-sm text-white/70 mt-1">
                  {items[activeLightboxIndex].description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
