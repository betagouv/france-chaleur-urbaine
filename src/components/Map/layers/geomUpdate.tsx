import type { MapSourceLayersSpecification, PopupStyleHelpers } from './common';

export const geomUpdateColor = '#ff9800';
export const geomUpdateHoverColor = '#ffb84d';
export const geomUpdateOpacity = 0.5;

export const geomUpdateLayersSpec = [
  {
    layers: [
      {
        filter: () => ['==', '$type', 'Polygon'],
        id: 'geomUpdate-polygons',
        isVisible: (config) => config.geomUpdate,
        paint: {
          'fill-color': geomUpdateColor,
          'fill-opacity': 0.5,
        },
        popup: Popup,
        type: 'fill',
      },
      {
        filter: () => ['==', '$type', 'Polygon'],
        id: 'geomUpdate-polygons-outline',
        isVisible: (config) => config.geomUpdate,
        paint: {
          'line-color': geomUpdateColor,
          'line-width': 3,
        },
        type: 'line',
        unselectable: true,
      },
      {
        filter: () => ['==', '$type', 'LineString'],
        id: 'geomUpdate-lines',
        isVisible: (config) => config.geomUpdate,
        paint: {
          'line-color': geomUpdateColor,
          'line-width': 3,
        },
        popup: Popup,
        type: 'line',
      },
      {
        filter: () => ['==', '$type', 'Point'],
        id: 'geomUpdate-points',
        isVisible: (config) => config.geomUpdate,
        paint: {
          'circle-color': geomUpdateHoverColor,
          'circle-radius': 8,
          'circle-stroke-color': geomUpdateColor,
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
    sourceId: 'geomUpdate',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

function Popup(data: any, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>{data.nom_reseau || 'Géométrie modifiée'}</Title>
      <TwoColumns>
        <Property label="Type" value="Modification en attente" />
        {data.nom_reseau && <Property label="Réseau" value={data.nom_reseau} />}
      </TwoColumns>
    </>
  );
}
