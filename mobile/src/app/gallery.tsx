import { WebPanel } from '@/components/WebPanel';

/** The web panel's gallery editor (page builder → Galeri tab) inside the app. */
export default function GalleryScreen() {
  return <WebPanel next="/dashboard/page-builder?tab=gallery" />;
}
