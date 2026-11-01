import fs from "fs/promises";
import path from "path";

// Uploaded images live in a public Supabase Storage bucket: Vercel's disk is read-only, so nothing can be
// written under public/ in production. Without the two env vars (local development) files go to public/uploads.

const BUCKET = "uploads";
const LOCAL_ROOT = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  gif: "image/gif",
};

function storage() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  // Newer sb_secret_ keys aren't JWTs and travel in apikey alone; legacy service_role keys need both headers.
  const headers: Record<string, string> = key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
  return { url, headers };
}

async function createBucket(s: NonNullable<ReturnType<typeof storage>>) {
  const res = await fetch(`${s.url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...s.headers, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  // Two first uploads at once can race; the second one finds the bucket already there.
  if (!res.ok && res.status !== 409 && !/already exists/i.test(await res.text())) {
    throw new Error(`Bucket could not be created (${res.status})`);
  }
}

async function putObject(s: NonNullable<ReturnType<typeof storage>>, objectPath: string, data: Buffer, contentType: string) {
  return fetch(`${s.url}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: { ...s.headers, "Content-Type": contentType, "Cache-Control": "max-age=31536000", "x-upsert": "false" },
    body: new Uint8Array(data),
  });
}

/** Stores a file under `folder` and returns the URL to keep in the database. */
export async function saveUpload(folder: string, filename: string, data: Buffer): Promise<string> {
  const objectPath = `${folder}/${filename}`;
  const s = storage();

  if (!s) {
    if (process.env.VERCEL) throw new Error("Upload storage is not configured");
    await fs.mkdir(path.join(LOCAL_ROOT, folder), { recursive: true });
    await fs.writeFile(path.join(LOCAL_ROOT, folder, filename), data);
    return `/uploads/${objectPath}`;
  }

  const contentType = CONTENT_TYPES[path.extname(filename).slice(1)] ?? "application/octet-stream";
  let res = await putObject(s, objectPath, data, contentType);
  if (!res.ok && /bucket not found/i.test(await res.clone().text())) {
    await createBucket(s);
    res = await putObject(s, objectPath, data, contentType);
  }
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return `${s.url}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

/** Best-effort removal of a file saveUpload stored. Stock photos and other URLs are left alone. */
export async function removeUpload(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    if (url.startsWith("/uploads/")) {
      const file = path.resolve(process.cwd(), "public", `.${url}`);
      if (file.startsWith(LOCAL_ROOT + path.sep)) await fs.unlink(file);
      return;
    }
    const s = storage();
    const prefix = s && `${s.url}/storage/v1/object/public/${BUCKET}/`;
    if (s && prefix && url.startsWith(prefix)) {
      await fetch(`${s.url}/storage/v1/object/${BUCKET}/${url.slice(prefix.length)}`, { method: "DELETE", headers: s.headers });
    }
  } catch {
    // The new file is already saved; a leftover old one does no harm.
  }
}
