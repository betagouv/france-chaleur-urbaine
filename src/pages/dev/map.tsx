import SimplePage from '@/components/shared/page/SimplePage';
import { Sandbox } from '@/modules/map/client/dev/Sandbox';

/**
 * Dev-only sandbox for the map module (not in navigation, accessible by URL).
 *
 * The shell (toggles, headers) is SSR-rendered. Map widgets inside the Sandbox
 * are loaded client-only via per-widget `dynamic()` (see Sandbox.tsx).
 */
const MapDevPage = () => {
  return (
    <SimplePage title="Map — sandbox" mode="public-fullscreen" includeFooter={false} noIndex>
      <Sandbox />
    </SimplePage>
  );
};

export default MapDevPage;
