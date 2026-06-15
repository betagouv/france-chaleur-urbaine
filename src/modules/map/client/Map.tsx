import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

import type { MapProps } from './core/MapImpl';

/** SSR-disabled wrapper around `MapImpl::Map` (the impl pulls in `maplibre-gl`). */
export const Map = dynamic<MapProps>(() => import('./core/MapImpl').then((mod) => mod.Map), {
  ssr: false,
}) as ComponentType<MapProps>;

export type { MapProps };
