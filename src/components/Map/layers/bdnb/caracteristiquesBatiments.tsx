import type { ExpressionInputType } from 'maplibre-gl';
import { BdnbBatimentPopup, bdnbBatimentsTilesSource } from '@/components/Map/layers/bdnb/common';
import { darken } from '@/utils/color';
import { ObjectEntries } from '@/utils/typescript';
import { ifHoverElse, intermediateTileLayersMinZoom, type MapSourceLayersSpecification } from '../common';

export const caracteristiquesBatimentsLayerStyle = {
  A: '#0D8A61',
  B: '#42A548',
  C: '#6CB36E',
  D: '#EBDE2D',
  E: '#E0A736',
  F: '#E66E31',
  G: '#C5171D',
  N: '#999999',
};

const opacity = 0.65;

const dpeWithColorPairs = ObjectEntries(caracteristiquesBatimentsLayerStyle).flatMap(([dpeCode, dpeColor]) => [
  dpeCode,
  ifHoverElse(darken(dpeColor, 40), dpeColor),
]) as [string, ExpressionInputType, ...ExpressionInputType[]];

export const caracteristiquesBatimentsLayersSpec = [
  {
    layers: [
      {
        id: 'caracteristiquesBatiments',
        isVisible: (config) => config.caracteristiquesBatiments,
        minzoom: intermediateTileLayersMinZoom,
        paint: {
          'fill-color': [
            'match',
            ['coalesce', ['get', 'dpe_representatif_logement_classe_bilan_dpe'], 'N'],
            ...dpeWithColorPairs,
            ifHoverElse(darken(caracteristiquesBatimentsLayerStyle.N, 40), caracteristiquesBatimentsLayerStyle.N),
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
        popup: BdnbBatimentPopup,
        type: 'fill',
      },
      {
        id: 'caracteristiquesBatiments-contour',
        isVisible: (config) => config.caracteristiquesBatiments,
        minzoom: intermediateTileLayersMinZoom,
        paint: {
          'line-color': ifHoverElse('#333', '#777'),
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            intermediateTileLayersMinZoom + 0.2,
            0,
            intermediateTileLayersMinZoom + 0.2 + 1,
            opacity,
          ],
          'line-width': ifHoverElse(2, 0.5),
        },
        type: 'line',
        unselectable: true,
      },
    ],
    source: bdnbBatimentsTilesSource,
    sourceId: 'bdnbBatiments',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
