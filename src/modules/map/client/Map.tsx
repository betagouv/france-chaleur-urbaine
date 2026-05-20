import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

import type { MapProps } from './core/MapImpl';

/**
 * High-level map component. Forced client-only via `dynamic({ ssr: false })`
 * because the implementation pulls in `maplibre-gl` (which references `window`
 * at module load) and is not SSR-safe. Consumers can `import { Map }` from any
 * page — Next.js will defer the chunk to the browser.
 */
export const Map = dynamic<MapProps>(() => import('./core/MapImpl').then((mod) => mod.Map), {
  ssr: false,
}) as ComponentType<MapProps>;

export type { MapProps };
