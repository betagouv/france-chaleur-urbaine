import type { DataDrivenPropertyValueSpecification, ExpressionSpecification } from 'maplibre-gl';

import Tag from '@/components/Manager/Tag';
import { defineLayerPopup, type MapSourceLayersSpecification } from '@/modules/map/client/core/common';
import { isDefined } from '@/utils/core';

const popupOffset = [0, -22] as [number, number];

// `icon-image` is a layout property and layout can't read feature-states, so each visual state
// (base / hover / selected / hover+selected) gets its own layer, toggled via `icon-opacity` (paint).
// This keeps hover AND selection as pure feature-states: no source data rebuild, no layer rebuild.
const hovered: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false];
const selected: ExpressionSpecification = ['boolean', ['feature-state', 'selected'], false];
const not = (expression: ExpressionSpecification): ExpressionSpecification => ['!', expression];
const visibleWhen = (...conditions: ExpressionSpecification[]): DataDrivenPropertyValueSpecification<number> => [
  'case',
  ['all', ...conditions],
  1,
  0,
];

export type AdresseEligible = {
  id: string;
  address: string;
  longitude: number;
  latitude: number;
  isEligible?: boolean; // TODO essayer de voir si on peut avoir des couleurs différentes selon les statuts des demandes
  modeDeChauffage?: string;
  typeDeLogement?: string;
};

const Popup = defineLayerPopup<AdresseEligible>((adresseEligible, { Property, Title, TwoColumns }) => {
  return (
    <>
      {isDefined(adresseEligible.isEligible) && (
        <Title>
          {adresseEligible.isEligible ? (
            <span className="text-success">✓ Adresse potentiellement raccordable</span>
          ) : (
            <span className="text-error">✗ Adresse non raccordable</span>
          )}
        </Title>
      )}
      <TwoColumns>
        <Property label="Adresse" value={adresseEligible.address} />
        {isDefined(adresseEligible.typeDeLogement) && <Tag text={adresseEligible.typeDeLogement} />}
        {isDefined(adresseEligible.modeDeChauffage) && <Tag text={adresseEligible.modeDeChauffage} />}
      </TwoColumns>
    </>
  );
});

export const adressesEligiblesLayersSpec = [
  {
    layers: [
      // 3 couches séparées pour afficher les adresses éligibles au dessus des autres
      {
        filter: () => ['!has', 'isEligible'],
        id: 'adressesEligibles-default',
        isVisible: () => true,
        layout: {
          'icon-anchor': 'bottom',
          'icon-image': 'marker-blue',
          'icon-offset': [0, 5],
          'icon-overlap': 'always',
        },
        paint: {
          // display all features except the hovered / selected ones
          'icon-opacity': visibleWhen(not(hovered), not(selected)),
        },
        popup: Popup,
        popupOffset,
        type: 'symbol',
      },
      {
        filter: () => ['==', 'isEligible', false],
        id: 'adressesEligibles-non-eligible',
        isVisible: () => true,
        layout: {
          'icon-anchor': 'bottom',
          'icon-image': 'marker-red',
          'icon-offset': [0, 5],
          'icon-overlap': 'always',
        },
        paint: {
          // display all features except the hovered / selected ones
          'icon-opacity': visibleWhen(not(hovered), not(selected)),
        },
        popup: Popup,
        popupOffset,
        type: 'symbol',
      },
      {
        filter: () => ['==', 'isEligible', true],
        id: 'adressesEligibles-eligible',
        isVisible: () => true,
        layout: {
          'icon-anchor': 'bottom',
          'icon-image': 'marker-green',
          'icon-offset': [0, 5],
          'icon-overlap': 'always',
        },
        paint: {
          // display all features except the hovered / selected ones
          'icon-opacity': visibleWhen(not(hovered), not(selected)),
        },
        popup: Popup,
        popupOffset,
        type: 'symbol',
      },
      {
        id: 'adressesEligibles-hover',
        isVisible: () => true,
        layout: {
          'icon-anchor': 'bottom',
          'icon-image': [
            'case',
            ['==', ['get', 'isEligible'], true],
            'marker-green',
            ['==', ['get', 'isEligible'], false],
            'marker-red',
            'marker-blue',
          ] as any,
          'icon-offset': [0, 5],
          'icon-overlap': 'always',
          'icon-size': 1.2,
        },
        paint: {
          // only display the hovered feature, unless it is the selected one (red layers below)
          'icon-opacity': visibleWhen(hovered, not(selected)),
        },
        type: 'symbol',
        unselectable: true,
      },
      {
        id: 'adressesEligibles-selected',
        isVisible: () => true,
        layout: {
          'icon-anchor': 'bottom',
          'icon-image': 'marker-red',
          'icon-offset': [0, 5],
          'icon-overlap': 'always',
        },
        paint: {
          // only display the selected feature when not hovered
          'icon-opacity': visibleWhen(selected, not(hovered)),
        },
        type: 'symbol',
        unselectable: true,
      },
      {
        id: 'adressesEligibles-selected-hover',
        isVisible: () => true,
        layout: {
          'icon-anchor': 'bottom',
          'icon-image': 'marker-red',
          'icon-offset': [0, 5],
          'icon-overlap': 'always',
          'icon-size': 1.2,
        },
        paint: {
          // only display the selected feature while hovered
          'icon-opacity': visibleWhen(selected, hovered),
        },
        type: 'symbol',
        unselectable: true,
      },
    ],
    source: {
      data: { features: [], type: 'FeatureCollection' },
      promoteId: 'id', // obligatoire car maplibre ne semble pas prendre l'id des features, seulement celui des properties
      type: 'geojson',
    },
    sourceId: 'adressesEligibles',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
