import SimplePage from '@/components/shared/page/SimplePage';
import { Sandbox } from '@/modules/map/client/dev/Sandbox';

/**
 * Sandbox page for the new map module (V2).
 *
 * Each step of `.ai/plans/map-v2.md` is validated visually here before moving on.
 * Not listed in navigation — accessible only by URL.
 *
 * The shell (toggles, headers) is SSR-rendered. Map widgets inside the Sandbox
 * are loaded client-only via per-widget `dynamic()` (see Sandbox.tsx).
 */
const MapV2DevPage = () => {
  return (
    <SimplePage title="Map V2 — sandbox" mode="public-fullscreen" includeFooter={false} noIndex>
      <Sandbox />
    </SimplePage>
  );
};

export default MapV2DevPage;
