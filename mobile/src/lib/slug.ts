// Copy of the rules in the server's src/lib/slug.ts, for the address preview at sign-up. Change both together.

const TR_FROM = 'çÇğĞıİöÖşŞüÜ';
const TR_TO = 'ccggiioossuu';

/** Top-level addresses the site itself uses: a business with one of these slugs could never be reached. */
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'aydinlatma-metni',
  'brand',
  'dashboard',
  'davet',
  'hero',
  'hosgeldin',
  'landing',
  'login',
  'register',
  'review',
  'support',
  'uploads',
]);

function slugify(text: string): string {
  return text
    .split('')
    .map((c) => {
      const i = TR_FROM.indexOf(c);
      return i === -1 ? c : TR_TO[i];
    })
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** "Çiçek Şölen" → "cicek-solen". */
export function businessSlug(businessName: string): string {
  const slug = slugify(businessName) || 'isletme';
  return RESERVED_SLUGS.has(slug) ? `${slug}-isletme` : slug;
}
