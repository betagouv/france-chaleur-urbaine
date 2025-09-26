import { type ExpressionInputType } from 'maplibre-gl';

import DPE from '@/components/DPE';
import { type EnergySummary } from '@/types/Summary/Energy';
import { darken } from '@/utils/color';
import { formatTypeEnergieChauffage } from '@/utils/format';
import { ObjectEntries } from '@/utils/typescript';

import { ifHoverElse, intermediateTileLayersMinZoom, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

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
]) as [string, ExpressionInputType, ...ExpressionInputType[]];

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
        popup: Popup,
      },
      {
        id: 'caracteristiquesBatiments-contour',
        'source-layer': 'buildings',
        type: 'line',
        minzoom: intermediateTileLayersMinZoom,
        paint: {
          'line-color': ifHoverElse('#333', '#777'),
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

function Popup(caracteristiqueBatiment: EnergySummary, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>{caracteristiqueBatiment.addr_label}</Title>
      <TwoColumns>
        <Property label="Année de construction" value={caracteristiqueBatiment.annee_construction} raw />
        <Property label="Usage" value={caracteristiqueBatiment.type_usage} />
        <Property label="Nombre de logements" value={caracteristiqueBatiment.nb_logements} />
        <Property label="Chauffage actuel" value={caracteristiqueBatiment.energie_utilisee} formatter={formatTypeEnergieChauffage} />
        <Property label="Mode de chauffage" value={caracteristiqueBatiment.type_chauffage} />
        <Property
          label="DPE consommations énergétiques"
          value={caracteristiqueBatiment.dpe_energie}
          formatter={(v) => <DPE classe={v} />}
        />
        <Property
          label="DPE émissions de gaz à effet de serre"
          value={caracteristiqueBatiment.dpe_ges}
          formatter={(v) => <DPE classe={v} />}
        />
      </TwoColumns>
    </>
  );
}
