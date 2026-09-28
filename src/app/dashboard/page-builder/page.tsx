import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PageBuilderClient from "./PageBuilderClient";

export default async function PageBuilderPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const business = await prisma.business.findUnique({
    where: { id: user.business.id },
    include: {
      page: true,
      services: { where: { isActive: true }, include: { category: true } },
      employees: { where: { isActive: true } },
      reviews: { where: { isApproved: true } },
      gallery: {
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      workingHours: { orderBy: { dayOfWeek: "asc" } },
      appointments: {
        where: {
          date: new Date().toISOString().split("T")[0],
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      },
    },
  });

  if (!business) return null;

  // Ensure default gallery exists if not created yet
  let galleryData = business.gallery;
  if (!galleryData) {
    try {
      const defaultAspectRatio =
        business.sector === "OTO_SERVIS"
          ? "16:9"
          : business.sector === "RESTORAN"
          ? "3:2"
          : "4:5";

      galleryData = await prisma.gallery.create({
        data: {
          businessId: business.id,
          enabled: true,
          showTitle: true,
          title: "Galerimiz & Çalışmalarımız",
          subtitle: "Özenle hazırladığımız hizmet ve çalışmalarımızdan kareler.",
          layout: "INFINITE_FLOW",
          direction: "right-to-left",
          speed: "NORMAL",
          pauseOnHover: true,
          imageSize: "MEDIUM",
          aspectRatio: defaultAspectRatio,
          borderRadius: "rounded",
          scrollAnimation: "Fade Up",
          parallaxEnabled: false,
          scrollReactive: false,
          scrollDirectionTracking: false,
          clickAction: "LIGHTBOX",
        },
        include: {
          items: true,
        },
      });
    } catch (e) {
      console.error("Gallery auto-init error:", e);
    }
  }

  let initialBlocks = [];
  try {
    if (business.page?.blocksJson) {
      initialBlocks = JSON.parse(business.page.blocksJson);
    }
  } catch (e) {
    console.error(e);
  }

  if (initialBlocks.length === 0) {
    initialBlocks = [
      { id: "hero-1", type: "Hero", title: business.name, subtitle: business.description, badge: "Online Rezervasyon Açık", ctaText: "Hemen Randevu Al" },
      { id: "about-1", type: "About", title: "Hakkımızda", content: business.description },
      { id: "services-1", type: "Services", title: "Hizmetlerimiz & Fiyatlar", showPrice: true, showDuration: true },
      { id: "staff-1", type: "Staff", title: "Uzman Ekibimiz" },
      { id: "gallery-1", type: "Gallery", title: "Fotoğraf Galerisi", subtitle: "Çalışmalarımızdan ve hizmetlerimizden kareler" },
      { id: "booking-1", type: "Booking", title: "Online Rezervasyon" },
      { id: "reviews-1", type: "Reviews", title: "Müşteri Değerlendirmeleri" },
      { id: "location-1", type: "Location", title: "İletişim & Ulaşım" },
    ];
  }

  let themeOverrides = null;
  try {
    if (business.page?.themeOverrides) {
      themeOverrides = JSON.parse(business.page.themeOverrides);
    }
  } catch (e) {
    console.error(e);
  }

  let sectionOrder = ["Hero", "Services", "Staff", "Gallery", "Reviews", "Booking", "Location"];
  try {
    if (business.page?.sectionOrder) {
      sectionOrder = JSON.parse(business.page.sectionOrder);
      if (!sectionOrder.includes("Gallery")) {
        const staffIndex = sectionOrder.indexOf("Staff");
        if (staffIndex !== -1) {
          sectionOrder.splice(staffIndex + 1, 0, "Gallery");
        } else {
          sectionOrder.push("Gallery");
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  let hiddenSections: string[] = [];
  try {
    if (business.page?.hiddenSections) {
      hiddenSections = JSON.parse(business.page.hiddenSections);
    }
  } catch (e) {
    console.error(e);
  }

  const activeThemeId = business.themeId || business.page?.themeId || "premium-dark";

  return (
    <div className="space-y-6">
      <PageBuilderClient
        business={business}
        initialBlocks={initialBlocks}
        initialTheme={business.page?.themeColor || "indigo"}
        initialFont={business.page?.font || "Inter"}
        initialThemeId={activeThemeId}
        initialThemeOverrides={themeOverrides}
        initialSectionOrder={sectionOrder}
        initialHiddenSections={hiddenSections}
        initialGallery={galleryData}
        initialGalleryItems={galleryData?.items || []}
        workingHours={business.workingHours}
        appointments={business.appointments}
      />
    </div>
  );
}
