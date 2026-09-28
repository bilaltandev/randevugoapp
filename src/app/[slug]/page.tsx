import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ThemedPageRenderer } from "@/components/themes/ThemedPageRenderer";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    include: { page: true },
  });

  if (!business) {
    return { title: "İşletme Bulunamadı | RandevuGo" };
  }

  return {
    title: business.page?.seoTitle || `${business.name} - Online Randevu Al | RandevuGo`,
    description:
      business.page?.seoDescription ||
      `${business.name} için 7/24 online rezervasyon yapın. Sıra beklemeden randevunuzu oluşturun.`,
  };
}

export default async function BusinessPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        include: { category: true },
      },
      employees: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
      },
      gallery: {
        include: {
          items: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      workingHours: {
        orderBy: { dayOfWeek: "asc" },
      },
      appointments: {
        where: {
          date: new Date().toISOString().split("T")[0],
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      },
      page: true,
      subscription: true,
    },
  });

  if (!business) {
    notFound();
  }

  // Check gallery feature flag
  let galleryData = business.gallery;
  if (galleryData && galleryData.enabled) {
    try {
      const { isGalleryFeatureEnabled } = await import("@/app/api/gallery/route");
      const isFeatureActive = await isGalleryFeatureEnabled(business.id, business.sector);
      if (!isFeatureActive) {
        galleryData = null;
      }
    } catch {}
  }

  // Parse theme overrides and section order
  let themeOverrides = null;
  let sectionOrder: string[] | null = null;
  let hiddenSections: string[] = [];

  try {
    if (business.page?.themeOverrides) {
      themeOverrides = JSON.parse(business.page.themeOverrides);
    }
  } catch (e) {
    console.error("Failed to parse themeOverrides:", e);
  }

  try {
    if (business.page?.sectionOrder) {
      sectionOrder = JSON.parse(business.page.sectionOrder);
    }
  } catch (e) {
    console.error("Failed to parse sectionOrder:", e);
  }

  try {
    if (business.page?.hiddenSections) {
      hiddenSections = JSON.parse(business.page.hiddenSections);
    }
  } catch (e) {
    console.error("Failed to parse hiddenSections:", e);
  }

  // Priority: Business.themeId -> Page.themeId -> "premium-dark"
  const activeThemeId = business.themeId || business.page?.themeId || "premium-dark";

  return (
    <ThemedPageRenderer
      business={business}
      services={business.services}
      employees={business.employees}
      reviews={business.reviews}
      workingHours={business.workingHours}
      appointments={business.appointments}
      gallery={galleryData}
      galleryItems={galleryData?.items || []}
      themeId={activeThemeId}
      themeOverrides={themeOverrides}
      sectionOrder={sectionOrder}
      hiddenSections={hiddenSections}
    />
  );
}
