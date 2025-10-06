import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl';

import { darken } from '@/utils/color';
import { formatMWhAn, formatMWhString } from '@/utils/strings';

import { type ColorThreshold, ifHoverElse, type LegendInterval, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

const besoinsBatimentsDefaultColor = '#ffffff';
const besoinsEnChaleurMaxValue = 6_000;
const besoinsEnChaleurOpacity = 0.65;
const besoinsEnChaleurColorThresholds: ColorThreshold[] = [
  {
    color: '#ffffe5',
    value: 20,
  },
  {
    color: '#fff7bc',
    value: 30,
  },
  {
    color: '#fee391',
    value: 50,
  },
  {
    color: '#fec44f',
    value: 75,
  },
  {
    color: '#fe9929',
    value: 150,
  },
  {
    color: '#ec7014',
    value: 300,
  },
  {
    color: '#cc4c02',
    value: 600,
  },
  {
    color: '#993404',
    value: 900,
  },
  {
    color: '#662506',
    value: 1200,
  },
];
const besoinsEnFroidMaxValue = 5_000;
const besoinsEnFroidColorThresholds: ColorThreshold[] = [
  {
    color: '#deebf7',
    value: 5,
  },
  {
    color: '#c6dbef',
    value: 10,
  },
  {
    color: '#9ecae1',
    value: 15,
  },
  {
    color: '#6baed6',
    value: 30,
  },
  {
    color: '#4292c6',
    value: 50,
  },
  {
    color: '#2171b5',
    value: 70,
  },
  {
    color: '#08519c',
    value: 100,
  },
  {
    color: '#08306b',
    value: 300,
  },
];

export const zoomOpacityTransitionAt10: DataDrivenPropertyValueSpecification<number> = [
  'interpolate',
  ['linear'],
  ['zoom'],
  10 + 0.2,
  0,
  10 + 0.2 + 1,
  besoinsEnChaleurOpacity,
];

export const besoinsEnChaleurLayersSpec = [
  {
    layers: [
      {
        id: 'besoinsEnFroid',
        isVisible: (config) => config.besoinsEnFroid,
        paint: {
          'fill-color': [
            'step',
            ['coalesce', ['get', 'FROID_MWH'], 0],
            ifHoverElse(darken(besoinsBatimentsDefaultColor, 40), besoinsBatimentsDefaultColor),
            ...besoinsEnFroidColorThresholds.flatMap((v) => [v.value, ifHoverElse(darken(v.color, 40), v.color)]),
          ],
          'fill-opacity': zoomOpacityTransitionAt10,
        },
        popup: Popup,
        type: 'fill',
      },
      {
        id: 'besoinsEnChaleur',
        isVisible: (config) => config.besoinsEnChaleur,
        paint: {
          'fill-color': [
            'step',
            ['coalesce', ['coalesce', ['get', 'CHAUF_MWH'], 0], 0],
            ifHoverElse(darken(besoinsBatimentsDefaultColor, 40), besoinsBatimentsDefaultColor),
            ...besoinsEnChaleurColorThresholds.flatMap((v) => [v.value, ifHoverElse(darken(v.color, 40), v.color)]),
          ],
          'fill-opacity': zoomOpacityTransitionAt10,
        },
        popup: Popup,
        type: 'fill',
      },
      {
        id: 'besoinsEnChaleurFroid-contour',
        isVisible: (config) => config.besoinsEnChaleur || config.besoinsEnFroid,
        paint: {
          'line-color': ifHoverElse('#333', '#777'),
          'line-opacity': zoomOpacityTransitionAt10,
          'line-width': ifHoverElse(2, 0.5),
        },
        type: 'line',
        unselectable: true,
      },
    ],
    source: {
      maxzoom: 14,
      minzoom: 10,
      promoteId: 'IDBATIMENT',
      tiles: ['/api/map/besoinsEnChaleur/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'besoinsEnChaleur',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

// used by the legend
export const besoinsEnChaleurIntervals: LegendInterval[] = [
  {
    color: besoinsBatimentsDefaultColor,
    max: formatMWhString(besoinsEnChaleurColorThresholds[0].value),
    min: formatMWhString(0),
  },
  ...besoinsEnChaleurColorThresholds.map((threshold, index, array) => {
    return {
      color: threshold.color,
      max: formatMWhString(array[index + 1]?.value ?? besoinsEnChaleurMaxValue),
      min: formatMWhString(threshold.value),
    };
  }),
];

export const besoinsEnFroidIntervals: LegendInterval[] = [
  {
    color: besoinsBatimentsDefaultColor,
    max: formatMWhString(besoinsEnFroidColorThresholds[0].value),
    min: formatMWhString(0),
  },
  ...besoinsEnFroidColorThresholds.map((threshold, index, array) => {
    return {
      color: threshold.color,
      max: formatMWhString(array[index + 1]?.value ?? besoinsEnFroidMaxValue),
      min: formatMWhString(threshold.value),
    };
  }),
];

type BesoinsEnChaleur = {
  CHAUF_MWH: number;
  COM_INSEE: string;
  ECS_MWH: number;
  FROID_MWH: number;
  IDBATIMENT: string;
  PART_TER: number;
  SDP_M2: number;
};

function Popup(besoinsEnChaleur: BesoinsEnChaleur, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>Besoins en chaleur et froid</Title>
      <TwoColumns>
        <Property label="Besoins en chauffage" value={besoinsEnChaleur.CHAUF_MWH} formatter={formatMWhAn} />
        <Property label="Besoins en eau chaude sanitaire" value={besoinsEnChaleur.ECS_MWH} formatter={formatMWhAn} />
        <Property label="Besoins en froid" value={besoinsEnChaleur.FROID_MWH} formatter={formatMWhAn} />
        <Property label="Part tertiaire de la surface des bâtiments" value={besoinsEnChaleur.PART_TER} unit="%" />
        <Property label="Surface de plancher" value={besoinsEnChaleur.SDP_M2} unit="m²" />
        <Property label="Identifiant BD TOPO" value={besoinsEnChaleur.IDBATIMENT} />
        <Property label="Source" value="Cerema" />
      </TwoColumns>
    </>
  );
}
