// Builds the Expo app icons, the mobile login wordmark and the web logo files / favicons from the
// CalendlyGo logo (public/brand/calendlygo-icon.png and calendlygo-wordmark.png).
//
//   node scripts/generate-mobile-icons.mjs
//
// The mascot is drawn on pure black, so its brightness becomes the alpha channel: the glow edges stay
// soft on any dark background and the face cut-outs become transparent (needed for the Android
// monochrome/themed icon). Output goes to mobile/assets/images; app.json already points there.
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public", "brand", "calendlygo-icon.png");
const wordmarkSource = path.join(root, "public", "brand", "calendlygo-wordmark.png");
const out = (name) => path.join(root, "mobile", "assets", "images", name);

const CANVAS = "#0B0E13"; // mobile theme `colors.canvas`, also the splash/adaptive background in app.json

/** Mascot on a transparent background, alpha taken from brightness. */
async function transparentMascot() {
  // The source already has a soft alpha glow; put it on black first so brightness → alpha holds.
  const { data, info } = await sharp(source)
    .flatten({ background: "#000000" })
    .trim({ background: "#000000", threshold: 8 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
    const alpha = Math.min(255, Math.round(max * 1.6)); // lift the dim glow so edges don't look grey
    if (alpha > 0) {
      // Un-premultiply against black so colors keep their full strength where alpha is partial.
      const k = 255 / alpha;
      pixels[i] = Math.min(255, Math.round(pixels[i] * k));
      pixels[i + 1] = Math.min(255, Math.round(pixels[i + 1] * k));
      pixels[i + 2] = Math.min(255, Math.round(pixels[i + 2] * k));
    }
    pixels[i + 3] = alpha;
  }
  return sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

/** `art` scaled to `scale` of a square `size` canvas, centered, on `background` (or transparent). */
async function compose(art, size, scale, background) {
  const inner = Math.round(size * scale);
  const resized = await sharp(art).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png();
}

/** White silhouette with the mascot's alpha — Android 13+ tints it with the wallpaper colors. */
async function monochrome(art) {
  const { data, info } = await sharp(art).raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = pixels[i + 1] = pixels[i + 2] = 255;
    pixels[i + 3] = pixels[i + 3] > 200 ? 255 : 0; // crisp edges read better at launcher size
  }
  return sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

const art = await transparentMascot();

// iOS + generic icon: opaque, the system rounds the corners.
await (await compose(art, 1024, 0.78, CANVAS)).flatten({ background: CANVAS }).removeAlpha().toFile(out("icon.png"));
// Android adaptive icon: the launcher crops to the inner ~66%, so the mascot stays inside it.
await (await compose(art, 512, 0.6)).toFile(out("android-icon-foreground.png"));
await sharp({ create: { width: 512, height: 512, channels: 4, background: CANVAS } }).png().toFile(out("android-icon-background.png"));
await (await compose(await monochrome(art), 432, 0.6)).toFile(out("android-icon-monochrome.png"));
// Splash: drawn by expo-splash-screen at `imageWidth` on the canvas color.
await (await compose(art, 512, 1)).toFile(out("splash-icon.png"));
await (await compose(art, 48, 0.92, CANVAS)).toFile(out("favicon.png"));

/**
 * Wordmark for the login screen. The original has a white "Calendly" (dark theme); the light-theme copy
 * paints it in the light `colors.ink` and darkens the lime "Go" so it stays readable on white.
 */
async function wordmarks() {
  const trimmed = await sharp(wordmarkSource).trim({ threshold: 1 }).png().toBuffer();
  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const light = Buffer.from(data);
  for (let i = 0; i < light.length; i += 4) {
    const [r, g, b] = [light[i], light[i + 1], light[i + 2]];
    const isWhite = Math.max(r, g, b) - Math.min(r, g, b) < 40;
    const [nr, ng, nb] = isWhite ? [0x0d, 0x11, 0x17] : [0x4d, 0x8a, 0x0a];
    light[i] = nr;
    light[i + 1] = ng;
    light[i + 2] = nb;
  }
  const width = 900;
  await sharp(trimmed).resize({ width }).png().toFile(out("wordmark-dark.png"));
  await sharp(light, { raw: { width: info.width, height: info.height, channels: 4 } }).resize({ width }).png().toFile(out("wordmark-light.png"));
}
await wordmarks();

/** ICO container holding PNG images (supported by every current browser). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

// Web: transparent mark, white wordmark for dark headers, favicons.
const web = (...parts) => path.join(root, ...parts);
await (await compose(art, 512, 1)).toFile(web("public", "brand", "calendlygo-mark.png"));
await (await compose(art, 512, 1)).toFile(out("logo-mark.png")); // in-app logo, no background
await sharp(wordmarkSource).trim({ threshold: 1 }).resize({ width: 600 }).png().toFile(web("public", "brand", "calendlygo-text-logo.png"));
const faviconSizes = [16, 32, 48];
const favicons = await Promise.all(
  faviconSizes.map(async (size) => ({ size, data: await (await compose(art, size, 0.96)).toBuffer() }))
);
const { writeFile } = await import("fs/promises");
await writeFile(web("src", "app", "favicon.ico"), ico(favicons));
await (await compose(art, 180, 0.8, CANVAS)).flatten({ background: CANVAS }).removeAlpha().toFile(web("src", "app", "apple-icon.png"));

console.log("✓ Mobil ikonlar (mobile/assets/images) ve web logoları (public/brand, src/app) yazıldı.");
