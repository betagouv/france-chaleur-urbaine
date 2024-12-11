import { type ExpressionInputType } from 'maplibre-gl';

import { ObjectEntries } from '@/utils/typescript';

import { type MapSourceLayersSpecification, intermediateTileLayersMinZoom } from './common';

export const caracteristiquesBatimentsLayerStyle = {
  a: '#0D8A61',
  b: '#42A548',
  c: '#6CB36E',
  d: '#EBDE2D',
  e: '#E0A736',
  f: '#E66E31',
  g: '#C5171D',
  n: '#999999',
};

const opacity = 0.65;

const dpeWithColorPairs = ObjectEntries(caracteristiquesBatimentsLayerStyle).flatMap(([dpeCode, dpeStyleDef]) => [
  dpeCode,
  dpeStyleDef,
]) as [ExpressionInputType, ExpressionInputType, ...ExpressionInputType[]];

export const caracteristiquesBatimentsLayersSpec = [
  {
    sourceId: 'buildings',
    source: {
      type: 'vector',
      tiles: ['/api/map/buildings/{z}/{x}/{y}'],
    },
    layers: [
      {
        id: 'caracteristiquesBatiments',
        'source-layer': 'buildings',
        minzoom: intermediateTileLayersMinZoom,
        type: 'fill',
        paint: {
          'fill-color': [
            'match',
            ['downcase', ['coalesce', ['get', 'dpe_energie'], 'N']],
            ...dpeWithColorPairs,
            caracteristiquesBatimentsLayerStyle.n,
          ],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            intermediateTileLayersMinZoom + 0.2,
            0,
            intermediateTileLayersMinZoom + 0.2 + 1,
            opacity,
          ],
        },
        isVisible: (config) => config.caracteristiquesBatiments,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
