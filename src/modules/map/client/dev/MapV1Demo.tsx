import MapV1 from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';

// Aligned with `MapV2Demo` so V1 vs V2 comparison is apples-to-apples.
const v1Configuration = createMapConfiguration({ reseauxDeChaleur: { show: true } });

/**
 * Self-contained V1 map widget for the sandbox.
 *
 * Imports `maplibre-gl` transitively, so this module is loaded via `dynamic()`
 * from the parent `<Sandbox>` to keep the shell SSR-friendly.
 */
export default function MapV1Demo() {
  return <MapV1 initialMapConfiguration={v1Configuration} initialCenter={[2.3522, 48.8566]} initialZoom={10} withoutLogo />;
}
