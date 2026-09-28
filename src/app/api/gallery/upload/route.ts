import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "image/gif": "gif",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Lütfen bir görsel dosyası seçin." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dosya boyutu çok büyük (Maksimum 10MB)." },
        { status: 400 }
      );
    }

    const mimeType = file.type;
    let ext = ALLOWED_MIME_TYPES[mimeType];

    if (!ext) {
      const originalExt = path.extname(file.name).toLowerCase().replace(".", "");
      if (["jpg", "jpeg", "png", "webp", "avif", "svg", "gif"].includes(originalExt)) {
        ext = originalExt === "jpeg" ? "jpg" : originalExt;
      } else {
        return NextResponse.json(
          { error: "Geçersiz dosya formatı. JPG, PNG, WebP, AVIF veya SVG yükleyebilirsiniz." },
          { status: 400 }
        );
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "gallery");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `gallery-${user.business.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/gallery/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Gallery upload error:", error);
    return NextResponse.json({ error: "Görsel yüklenirken bir hata oluştu." }, { status: 500 });
  }
}
