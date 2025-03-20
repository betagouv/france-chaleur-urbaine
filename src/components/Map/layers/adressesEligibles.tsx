import { ifHoverElse, type PopupStyleHelpers, type MapSourceLayersSpecification } from './common';

export const adressesEligiblesLayersSpec = [
  {
    sourceId: 'adressesEligibles',
    source: {
      type: 'geojson',
      data: '',
      promoteId: 'id', // obligatoire car maplibre ne semble pas prendre l'id des features, seulement celui des properties
    },
    layers: [
      // 2 couches séparées pour afficher les adresses éligibles au dessus des autres
      {
        id: 'adressesEligibles-non-eligible',
        type: 'symbol',
        filter: () => ['==', 'isEligible', false],
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
      },
      {
        id: 'adressesEligibles-hover',
        type: 'symbol',
        layout: {
          'icon-image': ['case', ['==', ['get', 'isEligible'], true], 'marker-green', 'marker-red'] as any,
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
  isEligible: boolean;
};

function Popup(adresseEligible: AdresseEligible, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>
        {adresseEligible.isEligible ? (
          <span className="text-success">✓ Adresse potentiellement raccordable</span>
        ) : (
          <span className="text-error">✗ Adresse non raccordable</span>
        )}
      </Title>
      <TwoColumns>
        <Property label="Adresse" value={adresseEligible.address} />
      </TwoColumns>
    </>
  );
}
