import { type DataDrivenPropertyValueSpecification, type SourceSpecification } from 'maplibre-gl';

import type { SourceId } from '@/server/services/tiles.config';

import { type MapLayerSpecification } from '../../map-layers';

export type LayerSymbolSpecification = {
  key: string;
  url: string;
  sdf?: boolean; // Whether the image should be interpreted as an SDF image (= image we want to color)
};

export type MapSourceLayersSpecification = {
  sourceId: SourceId;
  source: SourceSpecification;
  layers: MapLayerSpecification[];
};

export type ColorThreshold = {
  value: number;
  color: `#${string}`;
};

export type LegendInterval = {
  min: string;
  max: string;
  color: `#${string}`;
};

export const intermediateTileLayersMinZoom = 12;
export const tileSourcesMaxZoom = 17;

/**
 * Helper pour faciliter la définition des styles des couches avec le survol.
 */
export const ifHoverElse = <T extends string | number>(valueIfHover: T, valueElse: T) =>
  ['case', ['boolean', ['feature-state', 'hover'], false], valueIfHover, valueElse] satisfies DataDrivenPropertyValueSpecification<T>;
