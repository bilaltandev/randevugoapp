/**
 * Page layouts for the public booking page. A layout is the page's architecture
 * (hero, how services are presented, section rhythm, display type); the theme in
 * registry.ts supplies the colors. Owners pick the two independently.
 */
export type LayoutId = "vitrin" | "editorial" | "cinematic";

export interface LayoutMeta {
  id: LayoutId;
  name: string;
  description: string;
  bestFor: string;
}

export const LAYOUTS: LayoutMeta[] = [
  {
    id: "vitrin",
    name: "Vitrin",
    description: "Uygulama gibi pratik: hizmeti seç, saati seç, bitir. Bilgiler tek bakışta.",
    bestFor: "Her işletme",
  },
  {
    id: "editorial",
    name: "Editoryal",
    description: "Moda dergisi gibi: dev serif başlık, portre fotoğraf, menü düzeninde fiyat listesi ve bol boşluk.",
    bestFor: "Güzellik, lüks berber, fine dining",
  },
  {
    id: "cinematic",
    name: "Sinematik",
    description: "Tam ekran kapak görseli, büyük hizmet kartları, mozaik galeri ve güçlü bir kapanış.",
    bestFor: "Berber, dövme, oto detay, restoran",
  },
];

export function getLayoutId(value?: string | null): LayoutId {
  return LAYOUTS.some((l) => l.id === value) ? (value as LayoutId) : "vitrin";
}
