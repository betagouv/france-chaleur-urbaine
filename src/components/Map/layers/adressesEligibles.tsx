import { isDefined } from '@/utils/core';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

const popupOffset = [0, -22] as [number, number];

export const adressesEligiblesLayersSpec = [
  {
    sourceId: 'adressesEligibles',
    source: {
      type: 'geojson',
      data: '',
      promoteId: 'id', // obligatoire car maplibre ne semble pas prendre l'id des features, seulement celui des properties
    },
    layers: [
      // 3 couches séparées pour afficher les adresses éligibles au dessus des autres
      {
        id: 'adressesEligibles-default',
        type: 'symbol',
        filter: () => ['all', ['!has', 'isEligible'], ['!=', 'selected', true]],
        layout: {
          'icon-image': 'marker-blue',
          'icon-overlap': 'always',
          'icon-anchor': 'bottom',
          'icon-offset': [0, 5],
        },
        paint: {
          // display all features except the hovered one
          'icon-opacity': ifHoverElse(0, 1),
        },
        isVisible: () => true,
        popup: Popup,
        popupOffset,
      },
      {
        id: 'adressesEligibles-non-eligible',
        type: 'symbol',
        filter: () => ['any', ['==', 'isEligible', false], ['==', 'selected', true]],
        layout: {
          'icon-image': 'marker-red',
          'icon-overlap': 'always',
          'icon-anchor': 'bottom',
          'icon-offset': [0, 5],
        },
        paint: {
          // display all features except the hovered one
          'icon-opacity': ifHoverElse(0, 1),
        },
        isVisible: () => true,
        popup: Popup,
        popupOffset,
      },
      {
        id: 'adressesEligibles-eligible',
        type: 'symbol',
        filter: () => ['==', 'isEligible', true],
        layout: {
          'icon-image': 'marker-green',
          'icon-overlap': 'always',
          'icon-anchor': 'bottom',
          'icon-offset': [0, 5],
        },
        paint: {
          // display all features except the hovered one
          'icon-opacity': ifHoverElse(0, 1),
        },
        isVisible: () => true,
        popup: Popup,
        popupOffset,
      },
      {
        id: 'adressesEligibles-hover',
        type: 'symbol',
        layout: {
          'icon-image': [
            'case',
            ['==', ['get', 'isEligible'], true],
            'marker-green',
            ['any', ['==', ['get', 'isEligible'], false], ['==', ['get', 'selected'], true]],
            'marker-red',
            'marker-blue',
          ] as any,
          'icon-overlap': 'always',
          'icon-size': 1.2,
          'icon-anchor': 'bottom',
          'icon-offset': [0, 5],
        },
        paint: {
          // only display the hovered feature
          'icon-opacity': ifHoverElse(1, 0),
        },
        isVisible: () => true,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

export type AdresseEligible = {
  id: string;
  address: string;
  longitude: number;
  latitude: number;
  isEligible?: boolean; // TODO essayer de voir si on peut avoir des couleurs différentes selon les statuts des demandes
  selected?: boolean;
};

function Popup(adresseEligible: AdresseEligible, { Property, Title, TwoColumns }: PopupStyleHelpers) {
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
      </TwoColumns>
    </>
  );
}
