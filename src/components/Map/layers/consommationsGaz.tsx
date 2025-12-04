import type { ExpressionInputType } from 'maplibre-gl';
import { dataSourcesVersions } from '@/modules/app/constants';
import { intermediateTileLayersMinZoom } from '@/modules/tiles/constants';
import type { DonneesDeConsos } from '@/server/db/kysely';
import { formatMWhAn } from '@/utils/strings';
import { ObjectEntries } from '@/utils/typescript';
import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const consommationsGazLayerStyle = {
  I: '#00efaf',
  R: '#00B8F0',
  T: '#0032E5',
  unknown: '#818181',
};

const minIconSize = 12;
const maxIconSize = 30;
export const consommationsGazLayerMaxOpacity = 0.55;

const GAS_PROPERTY_CONSO: keyof DonneesDeConsos = 'conso_nb';
const GAS_PROPERTY_TYPE_GAS: keyof DonneesDeConsos = 'code_grand';
const typeWithColorPairs = ObjectEntries(consommationsGazLayerStyle).flatMap(([TypeGasName, styleObject]) => [
  TypeGasName,
  styleObject,
]) as [string, ExpressionInputType, ...ExpressionInputType[]];

export const consommationsGazInterval = {
  max: 2000,
  min: 50,
};

export const consommationsGazLayersSpec = [
  {
    layers: [
      {
        filter: (config) => {
          const consommationsGazIntervalMin =
            config.consommationsGaz.interval[0] === consommationsGazInterval.min
              ? Number.MIN_SAFE_INTEGER
              : config.consommationsGaz.interval[0];
          const consommationsGazIntervalMax =
            config.consommationsGaz.interval[1] === consommationsGazInterval.max
              ? Number.MAX_SAFE_INTEGER
              : config.consommationsGaz.interval[1];
          return [
            'all',
            config.consommationsGaz.interval
              ? [
                  'all',
                  ['>=', ['get', GAS_PROPERTY_CONSO], consommationsGazIntervalMin],
                  ['<=', ['get', GAS_PROPERTY_CONSO], consommationsGazIntervalMax],
                ]
              : true,
            [
              'any',
              config.consommationsGaz.logements && ['==', ['get', GAS_PROPERTY_TYPE_GAS], 'R'],
              config.consommationsGaz.tertiaire && ['==', ['get', GAS_PROPERTY_TYPE_GAS], 'T'],
              config.consommationsGaz.industrie && ['==', ['get', GAS_PROPERTY_TYPE_GAS], 'I'],
            ],
          ];
        },
        id: 'consommationsGaz',
        isVisible: (config) => config.consommationsGaz.show,
        layout: {
          'circle-sort-key': ['-', ['coalesce', ['get', GAS_PROPERTY_CONSO], 0]],
        },
        minzoom: intermediateTileLayersMinZoom,
        paint: {
          'circle-color': ['match', ['get', GAS_PROPERTY_TYPE_GAS], ...typeWithColorPairs, consommationsGazLayerStyle.unknown],
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            intermediateTileLayersMinZoom + 0.2,
            0,
            intermediateTileLayersMinZoom + 0.2 + 1,
            consommationsGazLayerMaxOpacity,
          ],
          'circle-radius': [
            '+',
            [
              'case',
              ['<', ['get', GAS_PROPERTY_CONSO], consommationsGazInterval.min],
              minIconSize / 2,
              ['<', ['get', GAS_PROPERTY_CONSO], consommationsGazInterval.max],
              [
                'interpolate',
                ['linear'],
                ['get', GAS_PROPERTY_CONSO],
                consommationsGazInterval.min,
                minIconSize / 2,
                consommationsGazInterval.max,
                maxIconSize / 2,
              ],
              maxIconSize / 2,
            ],
            ifHoverElse(2, 0),
          ],
          'circle-stroke-opacity': 0,
        },
        popup: Popup,
        type: 'circle',
      },
    ],
    source: {
      maxzoom: 14,
      minzoom: 12,
      tiles: ['/api/map/consommationsGaz/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'consommationsGaz',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

const codeGrandToLabel = {
  A: 'Agriculture',
  I: 'Industrie',
  R: 'Logement',
  T: 'Établissement tertiaire',
  X: 'Autre',
} as const satisfies Record<DonneesDeConsos['code_grand'], string>;

function Popup(consommationGaz: DonneesDeConsos, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title subtitle={codeGrandToLabel[consommationGaz.code_grand]}>{consommationGaz.adresse}</Title>
      <TwoColumns>
        <Property label="Conso. gaz" value={consommationGaz.conso_nb} formatter={formatMWhAn} />
        <Property label="Source" value={dataSourcesVersions.donneesLocalesConsommationEnergieAdresse.title} />
      </TwoColumns>
    </>
  );
}
