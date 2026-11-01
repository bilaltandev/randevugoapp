import type { PageSectionKey } from "./types";

/** The sections an owner can reorder on the booking page. The opening stays on top. */
export const PAGE_SECTIONS: { id: PageSectionKey; name: string; defaultTitle: string; required?: boolean }[] = [
  { id: "Services", name: "Hizmetler ve menü", defaultTitle: "Hizmetler", required: true },
  { id: "Gallery", name: "Fotoğraf galerisi", defaultTitle: "Galeri" },
  { id: "Staff", name: "Ekip", defaultTitle: "Ekip" },
  { id: "Reviews", name: "Yorumlar", defaultTitle: "Yorumlar" },
  { id: "Location", name: "Konum ve iletişim", defaultTitle: "İletişim" },
];

/** The owner's order, ignoring retired entries; sections they never placed follow in the default order. */
export function pageSectionOrder(order?: string[] | null): PageSectionKey[] {
  const known = PAGE_SECTIONS.map((s) => s.id);
  const placed = (order ?? []).filter((id, i, all): id is PageSectionKey => known.includes(id as PageSectionKey) && all.indexOf(id) === i);
  return [...placed, ...known.filter((id) => !placed.includes(id))];
}
