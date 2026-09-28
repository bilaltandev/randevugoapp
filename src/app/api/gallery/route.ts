import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SECTOR_SAMPLE_IMAGES } from "@/lib/gallery/types";

// Helper to check if gallery feature is active for this business
export async function isGalleryFeatureEnabled(businessId: string, sector: string): Promise<boolean> {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key: "gallerySystem" },
    });

    if (!flag) return true; // Enabled by default if flag not created
    if (!flag.isEnabled) return false;

    // Check disabled businesses
    if (flag.disabledBusinessIds) {
      try {
        const disabledList = JSON.parse(flag.disabledBusinessIds);
        if (Array.isArray(disabledList) && disabledList.includes(businessId)) return false;
      } catch {}
    }

    // Check sector filter
    if (flag.enabledSectors) {
      try {
        const sectorsList = JSON.parse(flag.enabledSectors);
        if (Array.isArray(sectorsList) && sectorsList.length > 0) {
          if (!sectorsList.includes(sector)) {
            // Check if explicitly whitelisted in enabledBusinessIds
            if (flag.enabledBusinessIds) {
              const enabledList = JSON.parse(flag.enabledBusinessIds);
              if (Array.isArray(enabledList) && enabledList.includes(businessId)) return true;
            }
            return false;
          }
        }
      } catch {}
    }

    return true;
  } catch (error) {
    console.error("isGalleryFeatureEnabled error:", error);
    return true;
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const business = user.business;
    const isFeatureEnabled = await isGalleryFeatureEnabled(business.id, business.sector);

    let gallery = await prisma.gallery.findUnique({
      where: { businessId: business.id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // If gallery does not exist yet, initialize it
    if (!gallery) {
      const defaultAspectRatio =
        business.sector === "OTO_SERVIS"
          ? "16:9"
          : business.sector === "RESTORAN"
          ? "3:2"
          : "4:5";

      gallery = await prisma.gallery.create({
        data: {
          businessId: business.id,
          enabled: true,
          showTitle: true,
          title: "Galerimiz & Çalışmalarımız",
          subtitle: "Özenle hazırladığımız hizmet ve çalışmalarımızdan öne çıkan kareler.",
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

      // Optionally populate sample items for instant impressive look
      const samples = SECTOR_SAMPLE_IMAGES[business.sector] || SECTOR_SAMPLE_IMAGES.BERBER;
      if (samples && samples.length > 0) {
        for (let i = 0; i < samples.length; i++) {
          await prisma.galleryItem.create({
            data: {
              galleryId: gallery.id,
              businessId: business.id,
              imageUrl: samples[i].url,
              title: samples[i].title,
              description: samples[i].desc,
              altText: samples[i].title,
              sortOrder: i,
              isActive: true,
            },
          });
        }

        // Refetch with items
        gallery = await prisma.gallery.findUnique({
          where: { businessId: business.id },
          include: {
            items: {
              orderBy: { sortOrder: "asc" },
            },
          },
        });
      }
    }

    return NextResponse.json({
      gallery,
      isFeatureEnabled,
    });
  } catch (error) {
    console.error("GET /api/gallery error:", error);
    return NextResponse.json({ error: "Galeri yüklenirken bir hata oluştu." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const business = user.business;
    const body = await req.json();

    const {
      enabled,
      showTitle,
      title,
      subtitle,
      layout,
      direction,
      speed,
      pauseOnHover,
      imageSize,
      aspectRatio,
      borderRadius,
      scrollAnimation,
      parallaxEnabled,
      scrollReactive,
      scrollDirectionTracking,
      clickAction,
    } = body;

    const updated = await prisma.gallery.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        enabled: enabled ?? true,
        showTitle: showTitle ?? true,
        title: title || "Galerimiz & Çalışmalarımız",
        subtitle: subtitle || "Hizmetlerimizden kareler.",
        layout: layout || "INFINITE_FLOW",
        direction: direction || "right-to-left",
        speed: speed || "NORMAL",
        pauseOnHover: pauseOnHover ?? true,
        imageSize: imageSize || "MEDIUM",
        aspectRatio: aspectRatio || "4:5",
        borderRadius: borderRadius || "rounded",
        scrollAnimation: scrollAnimation || "Fade Up",
        parallaxEnabled: parallaxEnabled ?? false,
        scrollReactive: scrollReactive ?? false,
        scrollDirectionTracking: scrollDirectionTracking ?? false,
        clickAction: clickAction || "LIGHTBOX",
      },
      update: {
        ...(enabled !== undefined ? { enabled } : {}),
        ...(showTitle !== undefined ? { showTitle } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(subtitle !== undefined ? { subtitle } : {}),
        ...(layout !== undefined ? { layout } : {}),
        ...(direction !== undefined ? { direction } : {}),
        ...(speed !== undefined ? { speed } : {}),
        ...(pauseOnHover !== undefined ? { pauseOnHover } : {}),
        ...(imageSize !== undefined ? { imageSize } : {}),
        ...(aspectRatio !== undefined ? { aspectRatio } : {}),
        ...(borderRadius !== undefined ? { borderRadius } : {}),
        ...(scrollAnimation !== undefined ? { scrollAnimation } : {}),
        ...(parallaxEnabled !== undefined ? { parallaxEnabled } : {}),
        ...(scrollReactive !== undefined ? { scrollReactive } : {}),
        ...(scrollDirectionTracking !== undefined ? { scrollDirectionTracking } : {}),
        ...(clickAction !== undefined ? { clickAction } : {}),
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, gallery: updated });
  } catch (error) {
    console.error("POST /api/gallery error:", error);
    return NextResponse.json({ error: "Galeri ayarları kaydedilemedi." }, { status: 500 });
  }
}
