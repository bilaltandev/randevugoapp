"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { cn, SECTORS } from "@/lib/utils";
import { DEFAULT_HERO_ACTION_ITEMS, type HeroActionItemId } from "@/lib/hero/types";
import type { ThemeOverrides } from "@/lib/themes/types";
import { getThemeConfig } from "@/lib/themes/registry";
import { getCustomAccent } from "@/lib/themes/utils";
import { bookingPalette } from "./theme";
import { useBooking } from "./useBooking";
import {
  STEP_LABELS,
  type BookingEmployee,
  type BookingService,
  type BusinessPageData,
  type FlowStep,
  type GalleryPhotoData,
  type PublicReview,
  type Stage,
} from "./types";
import { getOpenStatus, minuteToDate, toDateKey, useClientMinute, type WorkingHour } from "./time";
import { btn, focusRing, headingCls, Initial, SectionTitle } from "./ui";
import { PhotoGridSection, Lightbox, type Photo } from "./PhotoGallery";
import { VitrinHeader } from "./VitrinHeader";
import { EditorialLayout } from "./layouts/EditorialLayout";
import { CinematicLayout } from "./layouts/CinematicLayout";
import type { StorefrontLayoutProps } from "./layouts/types";
import { getLayoutId } from "@/lib/themes/layouts";
import { SectionNav } from "./SectionNav";
import { ServiceCatalog } from "./ServiceCatalog";
import { AboutSection, ReviewsSection, TeamSection } from "./InfoSections";
import { MobileActionBar, SummaryCard, type PrimaryAction } from "./BookingSummary";
import { StaffStep } from "./steps/StaffStep";
import { DateTimeStep } from "./steps/DateTimeStep";
import { DetailsStep, DETAILS_FORM_ID } from "./steps/DetailsStep";
import { Confirmation } from "./steps/Confirmation";

export interface BusinessBookingPageProps {
  business: BusinessPageData;
  services: BookingService[];
  employees: BookingEmployee[];
  reviews: PublicReview[];
  workingHours?: WorkingHour[];
  gallery?: { enabled?: boolean } | null;
  galleryItems?: GalleryPhotoData[];
  /** Theme picked in the dashboard (Sayfa Düzenleyici → Temalar). */
  themeId?: string | null;
  themeOverrides?: ThemeOverrides | null;
  hiddenSections?: string[] | null;
  /** Set by the dashboard's live preview; the public page leaves it undefined. */
  previewDevice?: "desktop" | "tablet" | "mobile";
}

const STEP_TITLES: Record<FlowStep, string> = {
  staff: "Uzman seçin",
  datetime: "Tarih ve saat seçin",
  details: "Bilgilerinizi girin",
};

export function BusinessBookingPage({
  business,
  services,
  employees,
  reviews,
  workingHours = [],
  gallery,
  galleryItems = [],
  themeId,
  themeOverrides,
  hiddenSections,
  previewDevice,
}: BusinessBookingPageProps) {
  const isPreview = previewDevice !== undefined;
  const booking = useBooking(business, services, employees);
  const [stage, setStage] = useState<Stage>("browse");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // ── Page data (only real business data; nothing is invented) ──
  const hidden = useMemo(() => new Set(hiddenSections || []), [hiddenSections]);
  const hours: WorkingHour[] = workingHours.length > 0 ? workingHours : business.workingHours || [];
  const minute = useClientMinute();
  const now = minute !== null ? minuteToDate(minute) : null;
  const todayKey = now ? toDateKey(now) : "";

  const heroItems = themeOverrides?.heroActions?.length ? themeOverrides.heroActions : DEFAULT_HERO_ACTION_ITEMS;
  const enabled = (id: HeroActionItemId) => heroItems.some((i) => i.id === id && i.enabled);

  const title = themeOverrides?.customTitle || business.name;
  const description = themeOverrides?.customSubtitle || business.description;
  const sectorName = SECTORS.find((s) => s.id === business.sector)?.name;
  const whatsappDigits = (business.whatsappNumber || business.phone || "").replace(/\D/g, "");
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Merhaba ${business.name}, bilgi almak istiyorum.`)}`
    : null;
  const mapsUrl =
    themeOverrides?.googleMapsUrl ||
    (business.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${business.name} ${business.address} ${business.city || ""}`
        )}`
      : null);
  const instagramUrl = themeOverrides?.instagramUsername
    ? `https://instagram.com/${themeOverrides.instagramUsername.replace(/^@/, "")}`
    : null;

  // Hero backdrop (Sayfa Düzenleyici → Hero → Arka plan). Old "video" values fall back to the photo.
  const heroBgType = themeOverrides?.heroBgType;
  const heroImage = heroBgType === "color" ? null : themeOverrides?.coverImage || business.coverImage || null;

  // Gallery photos only; the hero image is the backdrop, not a tile.
  // URLs are compared without their query (?w=1200&h=600 resizing params differ between copies).
  const sameImage = (a: string, b: string | null) => !!b && a.split("?")[0] === b.split("?")[0];
  const photos: Photo[] = useMemo(() => {
    const list: Photo[] = [];
    const galleryOn = !hidden.has("Gallery") && gallery?.enabled !== false && !!gallery;
    if (galleryOn) {
      for (const item of galleryItems) {
        if (item?.imageUrl && item.isActive !== false && !sameImage(item.imageUrl, heroImage) && !list.some((p) => p.src === item.imageUrl)) {
          list.push({ src: item.imageUrl, alt: item.altText || item.title || business.name, caption: item.title });
        }
      }
    }
    return list;
  }, [business.name, gallery, galleryItems, hidden, heroImage]);

  // Owner badges/slogan, minus anything that just repeats the sector line.
  const badges = Array.from(
    new Set(
      [themeOverrides?.customBadge, themeOverrides?.showSlogan !== false ? themeOverrides?.sloganText : undefined].filter(
        (b): b is string => Boolean(b) && b !== sectorName && b !== business.sector
      )
    )
  );

  const ratingAverage = reviews.length ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length : 0;
  const showStaff = !hidden.has("Staff") && employees.length > 0;
  const showReviews = !hidden.has("Reviews") && reviews.length > 0;
  const showAbout =
    !hidden.has("Location") && Boolean(description || business.address || business.phone || hours.length > 0);

  // Only a deliberately chosen accent overrides the theme's own color.
  const ownerAccent = getCustomAccent(themeOverrides);
  const palette = useMemo(() => bookingPalette(getThemeConfig(themeId), ownerAccent), [themeId, ownerAccent]);

  const showPhotoSection = photos.length > 0;

  const storefrontProps = {
    name: title,
    logo: business.logo,
    showLogo: themeOverrides?.showLogo !== false,
    hasPhotos: photos.length > 0,
    categoryLine: [sectorName, business.city].filter(Boolean) as string[],
    verified: business.isVerified,
    description,
    rating: showReviews ? { average: ratingAverage, count: reviews.length } : null,
    openStatus: now && (enabled("open_status") || enabled("working_hours")) ? getOpenStatus(hours, now) : null,
    address: business.address,
    badges,
    contact: {
      phone: enabled("call") ? business.phone : null,
      whatsappUrl: enabled("whatsapp") ? whatsappUrl : null,
      mapsUrl: enabled("location") ? mapsUrl : null,
      instagramUrl: enabled("instagram") ? instagramUrl : null,
    },
  };

  const navItems = useMemo(
    () =>
      [
        { id: "hizmetler", label: booking.isRestaurant ? "Rezervasyon" : "Hizmetler" },
        showPhotoSection && { id: "fotograflar", label: "Fotoğraflar" },
        showStaff && { id: "ekip", label: "Ekip" },
        showReviews && { id: "yorumlar", label: "Değerlendirmeler" },
        showAbout && { id: "hakkinda", label: "Hakkında" },
      ].filter(Boolean) as { id: string; label: string }[],
    [booking.isRestaurant, showPhotoSection, showStaff, showReviews, showAbout]
  );

  // ── Flow navigation (browser back button steps back through the flow) ──
  const useHistory = !isPreview;
  const { flowSteps, selectedService } = booking;
  const stageIndex = (s: Stage) => (s === "browse" ? -1 : flowSteps.indexOf(s as FlowStep));
  const stageRef = useRef<Stage>(stage);
  const hasServiceRef = useRef(Boolean(selectedService));
  useEffect(() => {
    stageRef.current = stage;
    hasServiceRef.current = Boolean(selectedService);
  }, [stage, selectedService]);

  const resetToBrowse = booking.resetForNewBooking;
  useEffect(() => {
    if (!useHistory) return;
    const onPop = (e: PopStateEvent) => {
      const target: Stage = e.state?.bkStage ?? "browse";
      if (stageRef.current === "done") {
        resetToBrowse();
        setStage("browse");
        return;
      }
      setStage(target !== "browse" && !hasServiceRef.current ? "browse" : target);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [useHistory, resetToBrowse]);

  // Bring the top of the page into view whenever the stage changes.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    rootRef.current?.scrollIntoView({ block: "start" });
  }, [stage]);

  const goTo = useCallback(
    (to: Stage) => {
      if (useHistory) window.history.pushState({ bkStage: to }, "");
      setStage(to);
    },
    [useHistory]
  );

  /** Jump back to an earlier stage (summary "Değiştir" links, back button). */
  const goBackTo = (to: Stage) => {
    const delta = stageIndex(stage) - stageIndex(to);
    if (delta <= 0) return;
    if (useHistory && window.history.state?.bkStage) window.history.go(-delta);
    else setStage(to);
  };

  const goBack = () => {
    const i = stageIndex(stage);
    goBackTo(i <= 0 ? "browse" : flowSteps[i - 1]);
  };

  const goNext = () => {
    const i = stageIndex(stage);
    if (i < flowSteps.length - 1) goTo(flowSteps[i + 1]);
  };

  const submit = async () => {
    const ok = await booking.submitBooking();
    if (ok) {
      if (useHistory) window.history.replaceState({ bkStage: "done" }, "");
      setStage("done");
    }
  };

  const startNewBooking = () => {
    booking.resetForNewBooking();
    if (useHistory) window.history.replaceState(null, "");
    setStage("browse");
  };

  const effectiveStage: Stage = stage !== "browse" && stage !== "done" && !selectedService ? "browse" : stage;
  const inFlow = effectiveStage !== "browse" && effectiveStage !== "done";

  const action: PrimaryAction | null = booking.isExpired
    ? null
    : effectiveStage === "browse"
    ? { label: "Devam et", disabled: !selectedService, onClick: () => goTo(flowSteps[0]) }
    : effectiveStage === "staff"
    ? { label: "Devam et", onClick: goNext }
    : effectiveStage === "datetime"
    ? { label: "Devam et", disabled: !booking.selectedTime, onClick: goNext }
    : effectiveStage === "details"
    ? { label: "Randevuyu onayla", formId: DETAILS_FORM_ID, busy: booking.isSubmitting }
    : null;

  const deviceFrame =
    previewDevice === "mobile"
      ? "mx-auto my-6 min-h-[750px] max-w-[400px] overflow-hidden rounded-[36px] border-8 border-black/80"
      : previewDevice === "tablet"
      ? "mx-auto my-6 min-h-[800px] max-w-[768px] overflow-hidden rounded-3xl border-4 border-black/80"
      : "";

  const currentStepNumber = inFlow ? stageIndex(effectiveStage) + 1 : 0;

  // Editoryal / Sinematik replace the storefront; the booking flow below stays shared.
  const layoutId = getLayoutId(themeOverrides?.layoutId);
  if (layoutId !== "vitrin" && effectiveStage === "browse") {
    const layoutProps: StorefrontLayoutProps = {
      name: title,
      logo: business.logo,
      showLogo: storefrontProps.showLogo,
      description,
      categoryLine: storefrontProps.categoryLine,
      verified: business.isVerified,
      heroImage,
      photos,
      services,
      employees: showStaff ? employees : [],
      reviews: showReviews ? reviews : [],
      ratingAverage,
      hours,
      todayIndex: now ? now.getDay() : null,
      openStatus: storefrontProps.openStatus,
      address: business.address,
      city: business.city,
      badges,
      contact: storefrontProps.contact,
      isRestaurant: booking.isRestaurant,
      bookingClosed: booking.isExpired,
      onBook: (service) => {
        booking.selectService(service);
        goTo(flowSteps[0]);
      },
      onOpenPhoto: setLightboxIndex,
      footerYear: now ? now.getFullYear() : null,
    };
    const Layout = layoutId === "editorial" ? EditorialLayout : CinematicLayout;

    return (
      <div ref={rootRef} style={palette.style} className={cn("min-h-screen bg-canvas font-sans text-ink", deviceFrame)}>
        {!isPreview && (
          <style>{`html{background:${palette.canvas};color-scheme:${palette.isDark ? "dark" : "light"};scroll-behavior:smooth}`}</style>
        )}
        <Layout {...layoutProps} />
        {lightboxIndex !== null && photos.length > 0 && (
          <Lightbox photos={photos} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} style={palette.style} className={cn("min-h-screen bg-canvas font-sans text-ink", deviceFrame)}>
      {/* Match the window background and scrollbars to the theme (the app-wide scrollbar styling is dark). */}
      {!isPreview && (
        <style>{`html{background:${palette.canvas};color-scheme:${palette.isDark ? "dark" : "light"}}::-webkit-scrollbar-track{background:${palette.surfaceMuted}}::-webkit-scrollbar-thumb{background:${palette.lineStrong}}::-webkit-scrollbar-thumb:hover{background:${palette.mutedText}}`}</style>
      )}
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          {inFlow ? (
            <>
              <button type="button" onClick={goBack} className={btn("ghost", "sm", "-ml-2 w-9 px-0")} aria-label="Geri">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{title}</p>
                <p className="text-xs text-ink-3">
                  Adım {currentStepNumber} / {flowSteps.length} · {STEP_LABELS[effectiveStage as FlowStep]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => goBackTo("browse")}
                className={btn("ghost", "sm", "-mr-2 w-9 px-0")}
                aria-label="Rezervasyondan çık"
                title="Seçimleriniz korunur"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {business.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={business.logo} alt="" className="h-8 w-8 shrink-0 rounded-(--bk-r-ctl) border border-line object-contain p-0.5" />
                ) : (
                  <Initial name={business.name} className="h-8 w-8 shrink-0 rounded-(--bk-r-ctl) text-sm" />
                )}
                <span className="truncate text-sm font-semibold text-ink">{title}</span>
              </div>
              {effectiveStage === "browse" && !booking.isExpired && services.length > 0 && (
                <a href="#hizmetler" className={btn("primary", "sm")}>
                  Randevu al
                </a>
              )}
            </>
          )}
        </div>
        {inFlow && (
          <div className="flex h-0.5 bg-line" aria-hidden="true">
            <span
              className="bg-brand transition-[width] duration-300"
              style={{ width: `${(currentStepNumber / flowSteps.length) * 100}%` }}
            />
          </div>
        )}
      </header>

      {effectiveStage === "done" ? (
        <main className="px-4 pb-16 sm:px-6">
          <Confirmation booking={booking} businessName={business.name} onNewBooking={startNewBooking} />
        </main>
      ) : inFlow ? (
        /* ── Booking flow ── */
        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-16">
          <div className="min-w-0">
            <h1 className={cn(headingCls, "text-xl text-ink sm:text-2xl")}>
              {STEP_TITLES[effectiveStage as FlowStep]}
            </h1>

            {/* Phones: what's been picked so far, collapsible */}
            <details className="group mt-4 rounded-(--bk-r-ctl) border border-line bg-surface lg:hidden">
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden",
                  focusRing
                )}
              >
                <span className="min-w-0 truncate">
                  <span className="text-ink-3">Seçiminiz: </span>
                  <span className="font-medium text-ink">{selectedService?.name}</span>
                </span>
                <span className="shrink-0 text-brand-ink group-open:hidden">Detaylar</span>
                <span className="hidden shrink-0 text-brand-ink group-open:inline">Gizle</span>
              </summary>
              <div className="border-t border-line">
                <SummaryCardBody booking={booking} stage={effectiveStage} onEdit={goBackTo} />
              </div>
            </details>

            <div className="mt-6">
              {effectiveStage === "staff" && <StaffStep booking={booking} />}
              {effectiveStage === "datetime" && <DateTimeStep booking={booking} todayKey={todayKey} />}
              {effectiveStage === "details" && <DetailsStep booking={booking} onSubmit={submit} />}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-20">
              <SummaryCard booking={booking} stage={effectiveStage} action={action} onEdit={goBackTo} phone={business.phone} />
            </div>
          </div>
        </main>
      ) : (
        /* ── Storefront ── */
        <>
          <VitrinHeader
            name={title}
            logo={business.logo}
            showLogo={storefrontProps.showLogo}
            coverImage={heroBgType === "color" ? null : heroImage}
            categoryLine={storefrontProps.categoryLine}
            verified={business.isVerified}
            description={description}
            badges={badges}
            rating={storefrontProps.rating}
            openStatus={storefrontProps.openStatus}
            address={business.address}
            serviceCount={services.length}
            lowestPrice={services.length ? Math.min(...services.map((s) => s.price)) : null}
            contact={storefrontProps.contact}
            canBook={!booking.isExpired && services.length > 0}
          />

          <div className="mt-10">
            <SectionNav items={navItems} />
          </div>

          <main className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-32 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-16">
            <div className="min-w-0 space-y-12">
              {booking.isExpired && (
                <p role="status" className="rounded-(--bk-r-ctl) border border-pending-line bg-pending-soft px-4 py-3 text-sm text-pending lg:hidden">
                  Bu işletme şu an online randevu almıyor.
                  {business.phone && (
                    <>
                      {" "}Randevu için{" "}
                      <a href={`tel:${business.phone}`} className="font-medium underline">
                        {business.phone}
                      </a>{" "}
                      numarasını arayabilirsiniz.
                    </>
                  )}
                </p>
              )}

              <ServiceCatalog
                services={services}
                selectedId={selectedService?.id}
                onSelect={booking.selectService}
                isRestaurant={booking.isRestaurant}
                readOnly={booking.isExpired}
                phone={business.phone}
              />

              {showPhotoSection && (
                <section id="fotograflar" aria-labelledby="fotograflar-baslik" className="scroll-mt-28">
                  <SectionTitle id="fotograflar-baslik">Fotoğraflar</SectionTitle>
                  <PhotoGridSection photos={photos} onOpen={setLightboxIndex} />
                </section>
              )}

              {showStaff && <TeamSection employees={employees} />}
              {showReviews && <ReviewsSection reviews={reviews} average={ratingAverage} />}
              {showAbout && (
                <AboutSection
                  // The header already shows this text; repeat it here only if it was clipped there.
                  description={description && description.length > 220 ? description : null}
                  address={business.address}
                  city={business.city}
                  mapsUrl={mapsUrl}
                  phone={business.phone}
                  whatsappUrl={business.whatsappNumber ? whatsappUrl : null}
                  hours={hours}
                  todayIndex={now ? now.getDay() : null}
                />
              )}
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-28">
                <SummaryCard booking={booking} stage="browse" action={action} onEdit={goBackTo} phone={business.phone} />
              </div>
            </div>
          </main>

          <footer className="border-t border-line bg-surface py-8 text-center text-xs text-ink-3">
            <p>© {now ? now.getFullYear() : ""} {business.name}</p>
            <p className="mt-1">
              Online randevu altyapısı{" "}
              <Link href="/" className="font-medium text-ink-2 hover:underline">
                CalendlyGo
              </Link>
            </p>
          </footer>
        </>
      )}

      {/* ── Phones: pinned action ── */}
      {action && (inFlow || (effectiveStage === "browse" && selectedService)) && (
        <MobileActionBar booking={booking} action={action} sticky={isPreview} />
      )}

      {lightboxIndex !== null && photos.length > 0 && (
        <Lightbox photos={photos} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}

/** Summary rows without the card chrome, for the collapsible mobile panel. */
function SummaryCardBody({
  booking,
  stage,
  onEdit,
}: {
  booking: ReturnType<typeof useBooking>;
  stage: Stage;
  onEdit: (s: Stage) => void;
}) {
  return (
    <div className="[&_aside]:rounded-none [&_aside]:border-0 [&_aside>h2]:hidden">
      <SummaryCard booking={booking} stage={stage} action={null} onEdit={onEdit} />
    </div>
  );
}
