import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

// Add or Update Gallery Item
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const business = user.business;
    const body = await req.json();

    const { id, imageUrl, title, description, altText, sortOrder, isActive } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Görsel URL zorunludur." }, { status: 400 });
    }

    // Ensure business has a gallery record
    let gallery = await prisma.gallery.findUnique({
      where: { businessId: business.id },
    });

    if (!gallery) {
      gallery = await prisma.gallery.create({
        data: {
          businessId: business.id,
          enabled: true,
          title: "Galerimiz",
        },
      });
    }

    if (id) {
      // Update existing item - verify ownership
      const existing = await prisma.galleryItem.findUnique({
        where: { id },
      });

      if (!existing || existing.businessId !== business.id) {
        return NextResponse.json({ error: "Bu görseli düzenleme yetkiniz yok." }, { status: 403 });
      }

      const updated = await prisma.galleryItem.update({
        where: { id },
        data: {
          imageUrl,
          title: title !== undefined ? title : existing.title,
          description: description !== undefined ? description : existing.description,
          altText: altText !== undefined ? altText : existing.altText,
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : existing.sortOrder,
          isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        },
      });

      return NextResponse.json({ success: true, item: updated });
    } else {
      // Determine next sortOrder
      const lastItem = await prisma.galleryItem.findFirst({
        where: { galleryId: gallery.id },
        orderBy: { sortOrder: "desc" },
      });
      const nextOrder = lastItem ? lastItem.sortOrder + 1 : 0;

      const created = await prisma.galleryItem.create({
        data: {
          galleryId: gallery.id,
          businessId: business.id,
          imageUrl,
          title: title || null,
          description: description || null,
          altText: altText || title || null,
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : nextOrder,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      return NextResponse.json({ success: true, item: created });
    }
  } catch (error) {
    console.error("POST /api/gallery/items error:", error);
    return NextResponse.json({ error: "Görsel kaydedilirken bir hata oluştu." }, { status: 500 });
  }
}

// Delete Gallery Item
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Görsel ID belirtilmedi." }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.galleryItem.findUnique({
      where: { id },
    });

    if (!existing || existing.businessId !== user.business.id) {
      return NextResponse.json({ error: "Bu görseli silme yetkiniz yok." }, { status: 403 });
    }

    // Clean up file if local upload
    if (existing.imageUrl?.startsWith("/uploads/gallery/")) {
      try {
        const filename = path.basename(existing.imageUrl);
        const filePath = path.join(process.cwd(), "public", "uploads", "gallery", filename);
        await fs.unlink(filePath).catch(() => {});
      } catch {}
    }

    await prisma.galleryItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/gallery/items error:", error);
    return NextResponse.json({ error: "Görsel silinirken bir hata oluştu." }, { status: 500 });
  }
}
