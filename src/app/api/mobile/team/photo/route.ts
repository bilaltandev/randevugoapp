import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getStaffActor } from "@/lib/staffActor";
import { subscriptionLock } from "@/lib/subscriptionAccess";

// Team member (mobile Bearer): POST multipart `file` sets their own staff photo (shown on the booking page).
// Stored like logos and gallery images (public/uploads); only JPG, PNG and WebP, at most 5 MB.

const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DIR = path.join(process.cwd(), "public", "uploads", "staff");

export async function POST(req: Request) {
  try {
    const actor = await getStaffActor();
    if (!actor || actor.kind !== "member") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const locked = subscriptionLock(actor.subscription);
    if (locked) return locked;

    const file = (await req.formData()).get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Lütfen bir fotoğraf seçin." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Dosya boyutu çok büyük (Maksimum 5MB)." }, { status: 400 });
    }
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Geçersiz dosya formatı. JPG, PNG veya WebP yükleyebilirsiniz." }, { status: 400 });
    }

    await fs.mkdir(DIR, { recursive: true });
    const current = await prisma.employee.findUniqueOrThrow({ where: { id: actor.employeeId }, select: { photo: true } });
    const filename = `staff-${actor.employeeId}-${Date.now()}.${ext}`;
    await fs.writeFile(path.join(DIR, filename), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/staff/${filename}`;
    await prisma.employee.update({ where: { id: actor.employeeId }, data: { photo: url } });

    // Remove the previous own upload; stock photos and other folders are never touched.
    if (current.photo?.startsWith("/uploads/staff/")) {
      await fs.unlink(path.join(DIR, path.basename(current.photo))).catch(() => {});
    }
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("[team-member] photo upload failed", { name: (error as Error)?.name });
    return NextResponse.json({ error: "Fotoğraf yüklenirken bir hata oluştu." }, { status: 500 });
  }
}
