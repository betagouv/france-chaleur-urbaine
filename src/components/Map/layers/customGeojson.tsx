import { ObjectEntries } from '@/utils/typescript';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const customGeojsonColor = '#e35050';
export const customGeojsonHoverColor = '#e08b8b';
export const customGeojsonOpacity = 0.7;

export const customGeojsonLayersSpec = [
  {
    layers: [
      {
        filter: () => ['==', '$type', 'Polygon'],
        id: 'customGeojson-polygons',
        isVisible: (config) => config.customGeojson,
        paint: {
          'fill-color': customGeojsonColor,
          'fill-opacity': customGeojsonOpacity,
        },
        popup: Popup,
        type: 'fill',
      },
      {
        filter: () => ['==', '$type', 'Polygon'],
        id: 'customGeojson-polygons-outline',
        isVisible: (config) => config.customGeojson,
        paint: {
          'line-color': customGeojsonColor,
          'line-width': ifHoverElse(4, 2),
        },
        type: 'line',
        unselectable: true,
      },
      {
        filter: () => ['==', '$type', 'LineString'],
        id: 'customGeojson-lines',
        isVisible: (config) => config.customGeojson,
        paint: {
          'line-color': customGeojsonColor,
          'line-width': ifHoverElse(4, 2),
        },
        popup: Popup,
        type: 'line',
      },
      {
        filter: () => ['==', '$type', 'Point'],
        id: 'customGeojson-points',
        isVisible: (config) => config.customGeojson,
        paint: {
          'circle-color': customGeojsonHoverColor,
          'circle-radius': ifHoverElse(10, 8),
          'circle-stroke-color': customGeojsonColor,
          'circle-stroke-width': 2,
        },
        popup: Popup,
        type: 'circle',
      },
    ],
    source: {
      data: {
        features: [],
        type: 'FeatureCollection',
      },
      type: 'geojson',
    },
    sourceId: 'customGeojson',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

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
