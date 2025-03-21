import { type FuturNetworkSummary } from '@/types/Summary/FuturNetwork';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';
import { buildFiltreGestionnaire } from './filters';

export const reseauxEnConstructionColor = '#DA5DD5';
export const reseauxEnConstructionOpacity = 0.47;

export const reseauxEnConstructionLayersSpec = [
  {
    sourceId: 'futurNetwork',
    source: {
      type: 'vector',
      tiles: ['/api/map/futurNetwork/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'reseauxEnConstruction-zone',
        'source-layer': 'futurOutline',
        type: 'fill',
        paint: {
          'fill-color': reseauxEnConstructionColor,
          'fill-opacity': ifHoverElse(reseauxEnConstructionOpacity + 0.1, reseauxEnConstructionOpacity),
        },
        filter: (config) => ['all', ['==', ['get', 'is_zone'], true], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
        isVisible: (config) => config.reseauxEnConstruction,
        popup: Popup,
      },
      {
        id: 'reseauxEnConstruction-trace',
        'source-layer': 'futurOutline',
        type: 'line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': reseauxEnConstructionColor,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
          'line-width': ifHoverElse(3, 2),
        },
        filter: (config) => ['all', ['==', ['get', 'is_zone'], false], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
        isVisible: (config) => config.reseauxEnConstruction,
        popup: Popup,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

function Popup(reseauEnConstruction: FuturNetworkSummary, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>Réseau en construction</Title>
      <TwoColumns>
        <Property label="Gestionnaire" value={reseauEnConstruction.gestionnaire} />
        <Property label="Mise en service" value={reseauEnConstruction.mise_en_service} />
      </TwoColumns>
    </>
  );
}
