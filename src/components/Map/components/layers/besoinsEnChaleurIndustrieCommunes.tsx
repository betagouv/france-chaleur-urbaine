import { darken } from '@/utils/color';
import { formatMWhAn, formatMWhString } from '@/utils/strings';

import { type LegendInterval, type ColorThreshold, type MapSourceLayersSpecification, ifHoverElse, type PopupStyleHelpers } from './common';

const besoinsEnChaleurIndustrieCommunesDefaultColor = '#fbf2e7';
const besoinsEnChaleurIndustrieCommunesMaxValue = 1_500_000;
const besoinsEnChaleurIndustrieCommunesThresholds: ColorThreshold[] = [
  {
    value: 31000,
    color: '#f3dce2',
  },
  {
    value: 101000,
    color: '#eac5dd',
  },
  {
    value: 222000,
    color: '#e6b9da',
  },
  {
    value: 425000,
    color: '#d1a8cc',
  },
  {
    value: 764000,
    color: '#bc97bd',
  },
];

export const besoinsEnChaleurIndustrieCommunesLayersSpec = [
  {
    sourceId: 'besoinsEnChaleurIndustrieCommunes',
    source: {
      type: 'vector',
      tiles: ['/api/map/besoinsEnChaleurIndustrieCommunes/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 11,
    },
    layers: [
      {
        id: 'besoinsEnChaleurIndustrieCommunes',
        type: 'fill',
        paint: {
          'fill-color': [
            'step',
            ['coalesce', ['get', 'conso_chal'], 0],
            ifHoverElse(darken(besoinsEnChaleurIndustrieCommunesDefaultColor, 40), besoinsEnChaleurIndustrieCommunesDefaultColor),
            ...besoinsEnChaleurIndustrieCommunesThresholds.flatMap((v) => [v.value, ifHoverElse(darken(v.color, 40), v.color)]),
          ],
          'fill-opacity': 0.7,
        },
        isVisible: (config) => config.besoinsEnChaleurIndustrieCommunes,
        popup: Popup,
      },
      {
        id: 'besoinsEnChaleurIndustrieCommunes-contour',
        type: 'line',
        paint: {
          'line-color': '#777777',
          'line-width': ifHoverElse(3, 1),
        },
        isVisible: (config) => config.besoinsEnChaleurIndustrieCommunes,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

// used by the legend
export const besoinsEnChaleurIndustrieCommunesIntervals: LegendInterval[] = [
  {
    min: formatMWhString(0),
    max: formatMWhString(besoinsEnChaleurIndustrieCommunesThresholds[0].value),
    color: besoinsEnChaleurIndustrieCommunesDefaultColor,
  },
  ...besoinsEnChaleurIndustrieCommunesThresholds.map((threshold, index, array) => {
    return {
      min: formatMWhString(threshold.value),
      max: formatMWhString(array[index + 1]?.value ?? besoinsEnChaleurIndustrieCommunesMaxValue),
      color: threshold.color,
    };
  }),
];

type BesoinsEnChaleurIndustrieCommunes = {
  conso_autr: number;
  conso_chal: number;
  codgeo: string;
  libgeo: string;
  conso_proc: number;
  dep: string;
  reg: string;
  conso_tot: number;
  conso_loca: number;
};

function Popup(besoinsEnChaleurIndustrieCommunes: BesoinsEnChaleurIndustrieCommunes, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>Besoins en chaleur du secteur industriel à {besoinsEnChaleurIndustrieCommunes.libgeo}</Title>
      <TwoColumns>
        <Property
          label="Besoin en chaleur et froid pour les process"
          value={besoinsEnChaleurIndustrieCommunes.conso_proc}
          formatter={formatMWhAn}
        />
        <Property
          label="Besoins en chaleur pour le chauffage des locaux"
          value={besoinsEnChaleurIndustrieCommunes.conso_loca}
          formatter={formatMWhAn}
        />
        <Property label="Autres besoins" value={besoinsEnChaleurIndustrieCommunes.conso_autr} formatter={formatMWhAn} />
        <Property label="Besoins totaux = tous usages" value={besoinsEnChaleurIndustrieCommunes.conso_tot} formatter={formatMWhAn} />
        <Property label="Source" value="Cerema" />
      </TwoColumns>
    </>
  );
}
