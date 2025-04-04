import { type DataDrivenPropertyValueSpecification } from 'maplibre-gl';

import { darken } from '@/utils/color';
import { formatMWhAn, formatMWhString } from '@/utils/strings';

import { type ColorThreshold, ifHoverElse, type LegendInterval, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

const besoinsBatimentsDefaultColor = '#ffffff';
const besoinsEnChaleurMaxValue = 6_000;
const besoinsEnChaleurOpacity = 0.65;
const besoinsEnChaleurColorThresholds: ColorThreshold[] = [
  {
    value: 20,
    color: '#ffffe5',
  },
  {
    value: 30,
    color: '#fff7bc',
  },
  {
    value: 50,
    color: '#fee391',
  },
  {
    value: 75,
    color: '#fec44f',
  },
  {
    value: 150,
    color: '#fe9929',
  },
  {
    value: 300,
    color: '#ec7014',
  },
  {
    value: 600,
    color: '#cc4c02',
  },
  {
    value: 900,
    color: '#993404',
  },
  {
    value: 1200,
    color: '#662506',
  },
];
const besoinsEnFroidMaxValue = 5_000;
const besoinsEnFroidColorThresholds: ColorThreshold[] = [
  {
    value: 5,
    color: '#deebf7',
  },
  {
    value: 10,
    color: '#c6dbef',
  },
  {
    value: 15,
    color: '#9ecae1',
  },
  {
    value: 30,
    color: '#6baed6',
  },
  {
    value: 50,
    color: '#4292c6',
  },
  {
    value: 70,
    color: '#2171b5',
  },
  {
    value: 100,
    color: '#08519c',
  },
  {
    value: 300,
    color: '#08306b',
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
    sourceId: 'besoinsEnChaleur',
    source: {
      type: 'vector',
      tiles: ['/api/map/besoinsEnChaleur/{z}/{x}/{y}'],
      minzoom: 10,
      maxzoom: 14,
      promoteId: 'IDBATIMENT',
    },
    layers: [
      {
        id: 'besoinsEnFroid',
        type: 'fill',
        paint: {
          'fill-color': [
            'step',
            ['coalesce', ['get', 'FROID_MWH'], 0],
            ifHoverElse(darken(besoinsBatimentsDefaultColor, 40), besoinsBatimentsDefaultColor),
            ...besoinsEnFroidColorThresholds.flatMap((v) => [v.value, ifHoverElse(darken(v.color, 40), v.color)]),
          ],
          'fill-opacity': zoomOpacityTransitionAt10,
        },
        isVisible: (config) => config.besoinsEnFroid,
        popup: Popup,
      },
      {
        id: 'besoinsEnChaleur',
        type: 'fill',
        paint: {
          'fill-color': [
            'step',
            ['coalesce', ['coalesce', ['get', 'CHAUF_MWH'], 0], 0],
            ifHoverElse(darken(besoinsBatimentsDefaultColor, 40), besoinsBatimentsDefaultColor),
            ...besoinsEnChaleurColorThresholds.flatMap((v) => [v.value, ifHoverElse(darken(v.color, 40), v.color)]),
          ],
          'fill-opacity': zoomOpacityTransitionAt10,
        },
        isVisible: (config) => config.besoinsEnChaleur,
        popup: Popup,
      },
      {
        id: 'besoinsEnChaleurFroid-contour',
        type: 'line',
        paint: {
          'line-color': ifHoverElse('#333', '#777'),
          'line-width': ifHoverElse(2, 0.5),
          'line-opacity': zoomOpacityTransitionAt10,
        },
        isVisible: (config) => config.besoinsEnChaleur || config.besoinsEnFroid,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

// used by the legend
export const besoinsEnChaleurIntervals: LegendInterval[] = [
  {
    min: formatMWhString(0),
    max: formatMWhString(besoinsEnChaleurColorThresholds[0].value),
    color: besoinsBatimentsDefaultColor,
  },
  ...besoinsEnChaleurColorThresholds.map((threshold, index, array) => {
    return {
      min: formatMWhString(threshold.value),
      max: formatMWhString(array[index + 1]?.value ?? besoinsEnChaleurMaxValue),
      color: threshold.color,
    };
  }),
];

export const besoinsEnFroidIntervals: LegendInterval[] = [
  {
    min: formatMWhString(0),
    max: formatMWhString(besoinsEnFroidColorThresholds[0].value),
    color: besoinsBatimentsDefaultColor,
  },
  ...besoinsEnFroidColorThresholds.map((threshold, index, array) => {
    return {
      min: formatMWhString(threshold.value),
      max: formatMWhString(array[index + 1]?.value ?? besoinsEnFroidMaxValue),
      color: threshold.color,
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
