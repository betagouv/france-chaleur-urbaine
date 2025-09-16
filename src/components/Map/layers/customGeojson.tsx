import { ObjectEntries } from '@/utils/typescript';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const customGeojsonColor = '#e35050';
export const customGeojsonHoverColor = '#e08b8b';
export const customGeojsonOpacity = 0.7;

export const customGeojsonLayersSpec = [
  {
    sourceId: 'customGeojson',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    },
    layers: [
      {
        id: 'customGeojson-polygons',
        type: 'fill',
        paint: {
          'fill-color': customGeojsonColor,
          'fill-opacity': customGeojsonOpacity,
        },
        filter: () => ['==', '$type', 'Polygon'],
        isVisible: () => true,
        popup: Popup,
      },
      {
        id: 'customGeojson-polygons-outline',
        type: 'line',
        filter: () => ['==', '$type', 'Polygon'],
        paint: {
          'line-color': customGeojsonColor,
          'line-width': ifHoverElse(4, 2),
        },
        isVisible: () => true,
        unselectable: true,
      },
      {
        id: 'customGeojson-lines',
        type: 'line',
        filter: () => ['==', '$type', 'LineString'],
        paint: {
          'line-color': customGeojsonColor,
          'line-width': ifHoverElse(4, 2),
        },
        isVisible: () => true,
        popup: Popup,
      },
      {
        id: 'customGeojson-points',
        type: 'circle',
        filter: () => ['==', '$type', 'Point'],
        paint: {
          'circle-radius': ifHoverElse(10, 8),
          'circle-color': customGeojsonHoverColor,
          'circle-stroke-width': 2,
          'circle-stroke-color': customGeojsonColor,
        },
        isVisible: () => true,
        popup: Popup,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

function Popup(data: any, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>{data.id ?? data.nom ?? 'Objet inconnu'}</Title>
      <TwoColumns>
        {ObjectEntries(data).map(([key, value]) => (
          <Property label={key} value={value} key={key} />
        ))}
      </TwoColumns>
    </>
  );
}
