// Builds the Expo app icons from the RandevuGo mascot (public/brand/mascot-logo.png).
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
const source = path.join(root, "public", "brand", "mascot-logo.png");
const out = (name) => path.join(root, "mobile", "assets", "images", name);

const CANVAS = "#0B0E13"; // mobile theme `colors.canvas`, also the splash/adaptive background in app.json

/** Mascot on a transparent background, alpha taken from brightness. */
async function transparentMascot() {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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
    pixels[i + 3] = pixels[i + 3] > 40 ? 255 : 0; // crisp edges read better at launcher size
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

console.log("✓ Mobil uygulama ikonları mobile/assets/images altına yazıldı.");
