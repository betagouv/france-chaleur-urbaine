import { parseAsArrayOf, parseAsFloat, parseAsString, parseAsStringLiteral } from 'nuqs';

import { parseAsLngLat } from '@/utils/nuqs-parsers';

/** Layer keys exposed by the `/iframe/carte` page (the 4 main réseau layers), kebab-cased for readable URLs. */
export const layerKeys = [
  'reseaux-de-chaleur',
  'reseaux-de-froid',
  'reseaux-en-construction',
  'zones-de-developpement-prioritaire',
] as const;
export type LayerKey = (typeof layerKeys)[number];

export const legendModes = ['off', 'hidden', 'auto'] as const;
export type LegendMode = (typeof legendModes)[number];

export const searchModes = ['none', 'network', 'eligibility'] as const;
export type SearchMode = (typeof searchModes)[number];

/**
 * nuqs param schema for `/iframe/carte`. Shared between the iframe page (parsing)
 * and the admin generator (`createSerializer`) so URLs round-trip exactly.
 */
export const carteIframeParams = {
  center: parseAsLngLat,
  gestionnaire: parseAsArrayOf(parseAsString).withDefault([]),
  layers: parseAsArrayOf(parseAsStringLiteral(layerKeys)).withDefault(['reseaux-de-chaleur']),
  legend: parseAsStringLiteral(legendModes).withDefault('off'),
  maitreOuvrage: parseAsArrayOf(parseAsString).withDefault([]),
  maxBounds: parseAsArrayOf(parseAsFloat),
  maxZoom: parseAsFloat,
  minZoom: parseAsFloat,
  mode: parseAsStringLiteral(searchModes).withDefault('none'),
  reseaux: parseAsArrayOf(parseAsString).withDefault([]),
  zoom: parseAsFloat,
};

/** Maps the camelCase param keys to kebab-cased URL keys (used by both `useQueryStates` and `createSerializer`). */
export const carteIframeUrlKeys = {
  maitreOuvrage: 'maitre-ouvrage',
  maxBounds: 'max-bounds',
  maxZoom: 'max-zoom',
  minZoom: 'min-zoom',
} as const;
