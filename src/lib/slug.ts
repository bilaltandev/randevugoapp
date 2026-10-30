import { TR_FROM, TR_TO } from "@/lib/uniquenessKeys";

// Business pages live at calendlygo.com/<slug>. Pure (no database): the sign-up forms use it for the preview.
// mobile/src/lib/slug.ts is a copy of these rules; change both together.

/** Top-level addresses the site itself uses: a business with one of these slugs could never be reached. */
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "aydinlatma-metni",
  "brand",
  "dashboard",
  "davet",
  "hero",
  "hosgeldin",
  "landing",
  "login",
  "register",
  "review",
  "support",
  "uploads",
]);

export function slugify(text: string): string {
  return text
    .split("")
    .map((c) => {
      const i = TR_FROM.indexOf(c);
      return i === -1 ? c : TR_TO[i];
    })
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "Çiçek Şölen" → "cicek-solen". Before the uniqueness check: a taken slug gets a number in the sign-up route. */
export function businessSlug(businessName: string): string {
  const slug = slugify(businessName) || "isletme";
  return RESERVED_SLUGS.has(slug) ? `${slug}-isletme` : slug;
}
