import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = (formData.get("file") || formData.get("logo")) as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Lütfen bir logo dosyası seçin." },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dosya boyutu çok büyük (Maksimum 5MB)." },
        { status: 400 }
      );
    }

    // Check file type
    const mimeType = file.type;
    let ext = ALLOWED_MIME_TYPES[mimeType];

    if (!ext) {
      // Fallback check extension from filename
      const originalExt = path.extname(file.name).toLowerCase().replace(".", "");
      if (["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(originalExt)) {
        ext = originalExt === "jpeg" ? "jpg" : originalExt;
      } else {
        return NextResponse.json(
          { error: "Geçersiz dosya formatı. PNG, JPG, WebP veya SVG yükleyebilirsiniz." },
          { status: 400 }
        );
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "logos");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Clean old logo if it was a local upload for this business
    try {
      const currentBusiness = await prisma.business.findUnique({
        where: { id: user.business.id },
        select: { logo: true },
      });
      if (currentBusiness?.logo?.startsWith("/uploads/logos/")) {
        const oldFilename = path.basename(currentBusiness.logo);
        const oldFilePath = path.join(uploadsDir, oldFilename);
        await fs.unlink(oldFilePath).catch(() => {});
      }
    } catch {
      // Ignore cleanup error
    }

    // Generate safe filename
    const filename = `logo-${user.business.id}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/logos/${filename}`;

    // Update in database
    const updatedBusiness = await prisma.business.update({
      where: { id: user.business.id },
      data: { logo: publicUrl },
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Logo yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    // Try to remove local file if any
    try {
      const currentBusiness = await prisma.business.findUnique({
        where: { id: user.business.id },
        select: { logo: true },
      });
      if (currentBusiness?.logo?.startsWith("/uploads/logos/")) {
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "logos");
        const oldFilename = path.basename(currentBusiness.logo);
        await fs.unlink(path.join(uploadsDir, oldFilename)).catch(() => {});
      }
    } catch {
      // Ignore file delete error
    }

    await prisma.business.update({
      where: { id: user.business.id },
      data: { logo: null },
    });

    return NextResponse.json({ success: true, message: "Logo kaldırıldı." });
  } catch (error) {
    console.error("Logo delete error:", error);
    return NextResponse.json(
      { error: "Logo kaldırılırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
