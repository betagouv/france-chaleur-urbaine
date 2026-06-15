import Tag from '@/components/Manager/Tag';
import { defineLayerPopup, ifHoverElse, type MapSourceLayersSpecification } from '@/modules/map/client/core/common';
import { isDefined } from '@/utils/core';

const popupOffset = [0, -22] as [number, number];

export type AdresseEligible = {
  id: string;
  address: string;
  longitude: number;
  latitude: number;
  isEligible?: boolean; // TODO essayer de voir si on peut avoir des couleurs différentes selon les statuts des demandes
  selected?: boolean;
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
        filter: () => ['all', ['!has', 'isEligible'], ['!=', 'selected', true]],
        id: 'adressesEligibles-default',
        isVisible: () => true,
        layout: {
          'icon-anchor': 'bottom',
          'icon-image': 'marker-blue',
          'icon-offset': [0, 5],
          'icon-overlap': 'always',
        },
        paint: {
          // display all features except the hovered one
          'icon-opacity': ifHoverElse(0, 1),
        },
        popup: Popup,
        popupOffset,
        type: 'symbol',
      },
      {
        filter: () => ['any', ['==', 'isEligible', false], ['==', 'selected', true]],
        id: 'adressesEligibles-non-eligible',
        isVisible: () => true,
        layout: {
          'icon-anchor': 'bottom',
          'icon-image': 'marker-red',
          'icon-offset': [0, 5],
          'icon-overlap': 'always',
        },
        paint: {
          // display all features except the hovered one
          'icon-opacity': ifHoverElse(0, 1),
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
          // display all features except the hovered one
          'icon-opacity': ifHoverElse(0, 1),
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
            ['any', ['==', ['get', 'isEligible'], false], ['==', ['get', 'selected'], true]],
            'marker-red',
            'marker-blue',
          ] as any,
          'icon-offset': [0, 5],
          'icon-overlap': 'always',
          'icon-size': 1.2,
        },
        paint: {
          // only display the hovered feature
          'icon-opacity': ifHoverElse(1, 0),
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
