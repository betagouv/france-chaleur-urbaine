import { ObjectEntries } from '@/utils/typescript';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

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
          'fill-color': '#e35050',
          'fill-opacity': 0.7,
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
          'line-color': '#e35050',
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
          'line-color': '#e35050',
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
          'circle-color': '#e08b8b',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#e35050',
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
