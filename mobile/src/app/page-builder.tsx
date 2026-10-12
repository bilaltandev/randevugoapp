import { WebPanel } from '@/components/WebPanel';

/** The web panel's page builder inside the app, with every option the web has. */
export default function PageBuilderScreen() {
  return <WebPanel next="/dashboard/page-builder" />;
}
