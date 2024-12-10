import { type MapSourceLayersSpecification } from './common';

export const demandesEligibiliteLayerStyle = {
  fill: { color: '#FFFFFF', size: 4 },
  stroke: { color: '#FF7576', size: 2 },
};

export const demandesEligibiliteLayersSpec = [
  {
    sourceId: 'demands',
    source: {
      type: 'vector',
      tiles: [`/api/map/demands/{z}/{x}/{y}`],
    },
    layers: [
      {
        id: 'demandesEligibilite',
        'source-layer': 'demands',
        type: 'circle',
        paint: {
          'circle-color': demandesEligibiliteLayerStyle.fill.color,
          'circle-stroke-color': demandesEligibiliteLayerStyle.stroke.color,
          'circle-radius': demandesEligibiliteLayerStyle.fill.size,
          'circle-stroke-width': demandesEligibiliteLayerStyle.stroke.size,
        },
        isVisible: (config) => config.demandesEligibilite,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
