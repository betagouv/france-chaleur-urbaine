import { type ExpressionInputType } from 'maplibre-gl';

import { darken } from '@/utils/color';
import { ObjectEntries } from '@/utils/typescript';

import { type MapSourceLayersSpecification, ifHoverElse, intermediateTileLayersMinZoom } from './common';

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

const dpeWithColorPairs = ObjectEntries(caracteristiquesBatimentsLayerStyle).flatMap(([dpeCode, dpeColor]) => [
  dpeCode,
  ifHoverElse(darken(dpeColor, 40), dpeColor),
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
            ifHoverElse(darken(caracteristiquesBatimentsLayerStyle.n, 40), caracteristiquesBatimentsLayerStyle.n),
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
      {
        id: 'caracteristiquesBatiments-contour',
        'source-layer': 'buildings',
        type: 'line',
        minzoom: intermediateTileLayersMinZoom,
        paint: {
          'line-color': ifHoverElse('#000000', '#777777'),
          'line-width': ifHoverElse(2, 0.5),
          'line-opacity': [
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
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
