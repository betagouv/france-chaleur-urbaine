import { darken } from '@/utils/color';
import { formatMWhAn, formatMWhString } from '@/utils/strings';

import { type ColorThreshold, ifHoverElse, type LegendInterval, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

const besoinsEnChaleurIndustrieCommunesDefaultColor = '#fbf2e7';
const besoinsEnChaleurIndustrieCommunesMaxValue = 1_500_000;
const besoinsEnChaleurIndustrieCommunesThresholds: ColorThreshold[] = [
  {
    color: '#f3dce2',
    value: 31000,
  },
  {
    color: '#eac5dd',
    value: 101000,
  },
  {
    color: '#e6b9da',
    value: 222000,
  },
  {
    color: '#d1a8cc',
    value: 425000,
  },
  {
    color: '#bc97bd',
    value: 764000,
  },
];

export const besoinsEnChaleurIndustrieCommunesLayersSpec = [
  {
    layers: [
      {
        id: 'besoins-en-chaleur-industrie-communes',
        isVisible: (config) => config.besoinsEnChaleurIndustrieCommunes,
        paint: {
          'fill-color': [
            'step',
            ['coalesce', ['get', 'conso_chal'], 0],
            ifHoverElse(darken(besoinsEnChaleurIndustrieCommunesDefaultColor, 40), besoinsEnChaleurIndustrieCommunesDefaultColor),
            ...besoinsEnChaleurIndustrieCommunesThresholds.flatMap((v) => [v.value, ifHoverElse(darken(v.color, 40), v.color)]),
          ],
          'fill-opacity': 0.7,
        },
        popup: Popup,
        type: 'fill',
      },
      {
        id: 'besoinsEnChaleurIndustrieCommunes-contour',
        isVisible: (config) => config.besoinsEnChaleurIndustrieCommunes,
        paint: {
          'line-color': '#777777',
          'line-width': ifHoverElse(3, 1),
        },
        type: 'line',
        unselectable: true,
      },
    ],
    source: {
      maxzoom: 11,
      minzoom: 5,
    },
    sourceId: 'besoins-en-chaleur-industrie-communes',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

// used by the legend
export const besoinsEnChaleurIndustrieCommunesIntervals: LegendInterval[] = [
  {
    color: besoinsEnChaleurIndustrieCommunesDefaultColor,
    max: formatMWhString(besoinsEnChaleurIndustrieCommunesThresholds[0].value),
    min: formatMWhString(0),
  },
  ...besoinsEnChaleurIndustrieCommunesThresholds.map((threshold, index, array) => {
    return {
      color: threshold.color,
      max: formatMWhString(array[index + 1]?.value ?? besoinsEnChaleurIndustrieCommunesMaxValue),
      min: formatMWhString(threshold.value),
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
