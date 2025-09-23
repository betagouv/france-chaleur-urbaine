import { type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const geomUpdateColor = '#ff9800';
export const geomUpdateHoverColor = '#ffb84d';
export const geomUpdateOpacity = 0.5;

export const geomUpdateLayersSpec = [
  {
    sourceId: 'geomUpdate',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    },
    layers: [
      {
        id: 'geomUpdate-polygons',
        type: 'fill',
        paint: {
          'fill-color': geomUpdateColor,
          'fill-opacity': 0.5,
        },
        filter: () => ['==', '$type', 'Polygon'],
        isVisible: (config) => config.geomUpdate,
        popup: Popup,
      },
      {
        id: 'geomUpdate-polygons-outline',
        type: 'line',
        filter: () => ['==', '$type', 'Polygon'],
        paint: {
          'line-color': geomUpdateColor,
          'line-width': 3,
        },
        isVisible: (config) => config.geomUpdate,
        unselectable: true,
      },
      {
        id: 'geomUpdate-lines',
        type: 'line',
        filter: () => ['==', '$type', 'LineString'],
        paint: {
          'line-color': geomUpdateColor,
          'line-width': 3,
        },
        isVisible: (config) => config.geomUpdate,
        popup: Popup,
      },
      {
        id: 'geomUpdate-points',
        type: 'circle',
        filter: () => ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 8,
          'circle-color': geomUpdateHoverColor,
          'circle-stroke-width': 2,
          'circle-stroke-color': geomUpdateColor,
        },
        isVisible: (config) => config.geomUpdate,
        popup: Popup,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

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
