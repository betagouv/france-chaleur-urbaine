import { defineLayerPopup, ifHoverElse } from '@/components/Map/layers/common';

import { type MapSourceLayersSpecification } from '../common';

export const perimetresGeothermieProfondeLayerColor = '#b084cc';
export const perimetresGeothermieProfondeLayerOpacity = 0.5;

type PerimetreGeothermieProfonde = {
  id: string;
  statut: 'AR' | 'Existant';
  aquifere: 'Albien' | 'Craie' | 'Dogger' | 'Lutétien' | 'Néocomien' | 'Yprésien';
};

const Popup = defineLayerPopup<PerimetreGeothermieProfonde>((perimetre, { Property, Title, TwoColumns }) => {
  return (
    <>
      <Title>{perimetre.id}</Title>
      <TwoColumns>
        <Property label="Statut" value={perimetre.statut === 'AR' ? "Arrêté d'autorisation de recherche" : perimetre.statut} />
        <Property label="Aquifère" value={perimetre.aquifere} />
      </TwoColumns>
    </>
  );
});

export const aquifereColorMap = {
  Albien: '#008000', // green
  Craie: '#e18f4d', // orange
  Dogger: '#ff0000', // red
  Lutétien: '#0000ff', // blue
  Néocomien: '#c0bd0c', // darkkhaki
  Yprésien: '#8000ff', // violet
} as const satisfies Record<PerimetreGeothermieProfonde['aquifere'], string>;

export const statutColorMap = {
  AR: '#ff0000',
  Existant: '#000000',
} as const satisfies Record<PerimetreGeothermieProfonde['statut'], string>;

export const perimetresGeothermieProfondeLayersSpec = [
  {
    sourceId: 'perimetresGeothermieProfonde',
    source: {
      type: 'vector',
      tiles: ['/api/map/perimetresGeothermieProfonde/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 11,
    },
    layers: [
      {
        id: 'perimetresGeothermieProfonde',
        type: 'fill',
        paint: {
          'fill-color': [
            'match',
            ['get', 'aquifere'],
            'Lutétien',
            aquifereColorMap['Lutétien'],
            'Yprésien',
            aquifereColorMap['Yprésien'],
            'Craie',
            aquifereColorMap['Craie'],
            'Albien',
            aquifereColorMap['Albien'],
            'Néocomien',
            aquifereColorMap['Néocomien'],
            'Dogger',
            aquifereColorMap['Dogger'],
            perimetresGeothermieProfondeLayerColor,
          ],
          'fill-opacity': ifHoverElse(perimetresGeothermieProfondeLayerOpacity + 0.1, perimetresGeothermieProfondeLayerOpacity),
        },
        isVisible: (config) => config.geothermieProfonde.show && config.geothermieProfonde.showPerimetres,
        popup: Popup,
      },
      {
        id: 'perimetresGeothermieProfonde-contour',
        type: 'line',
        paint: {
          'line-color': ['match', ['get', 'statut'], 'AR', statutColorMap.AR, statutColorMap.Existant],
          'line-width': ifHoverElse(4, 3),
        },
        isVisible: (config) => config.geothermieProfonde.show && config.geothermieProfonde.showPerimetres,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
