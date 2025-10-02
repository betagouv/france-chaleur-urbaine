import type { Interval } from '@/utils/interval';
import { formatMWhAn } from '@/utils/strings';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const communesFortPotentielPourCreationReseauxChaleurLayerColor = '#FF8329';
export const communesFortPotentielPourCreationReseauxChaleurLayerOpacity = 0.7;

export const communesFortPotentielPourCreationReseauxChaleurInterval: Interval = [0, 100_000];

export const communesFortPotentielPourCreationReseauxChaleurLayersSpec = [
  {
    layers: [
      {
        filter: (config) => [
          'all',
          ['>=', ['get', 'population'], config.communesFortPotentielPourCreationReseauxChaleur.population[0]],
          ['<=', ['get', 'population'], config.communesFortPotentielPourCreationReseauxChaleur.population[1]],
        ],
        id: 'communesFortPotentielPourCreationReseauxChaleur',
        isVisible: (config) => config.communesFortPotentielPourCreationReseauxChaleur.show,
        layout: {
          'circle-sort-key': ['-', ['get', 'population']],
        },
        paint: {
          'circle-color': communesFortPotentielPourCreationReseauxChaleurLayerColor,
          'circle-opacity': communesFortPotentielPourCreationReseauxChaleurLayerOpacity,
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['+', ['get', 'zones_fort_potentiel_chauf_mwh'], ['get', 'zones_fort_potentiel_ecs_mwh']],
            0,
            ifHoverElse(6, 4),
            160_000, // ~ max value
            ifHoverElse(24, 20),
          ],
        },
        popup: Popup,
        type: 'circle',
      },
    ],
    source: {
      maxzoom: 6,
      minzoom: 5,
      tiles: ['/api/map/communesFortPotentielPourCreationReseauxChaleur/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'communesFortPotentielPourCreationReseauxChaleur',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

type CommuneFortPotentielPourCreationReseauxChaleur = {
  id: number;
  insee_dep: string;
  insee_com: string;
  nom: string;
  population: number;
  zones_fort_potentiel_total: number;
  zones_fort_potentiel_chauf_mwh: number;
  zones_fort_potentiel_ecs_mwh: number;
};

function Popup(
  communeFortPotentielPourCreationReseauxChaleur: CommuneFortPotentielPourCreationReseauxChaleur,
  { Property, Title, TwoColumns }: PopupStyleHelpers
) {
  return (
    <>
      <Title>{communeFortPotentielPourCreationReseauxChaleur.nom}</Title>
      <TwoColumns>
        <Property label="Nombre d'habitants" value={communeFortPotentielPourCreationReseauxChaleur.population} />
        <Property
          label="Besoins en chauffage sur les zones à fort potentiel (cumul)"
          value={communeFortPotentielPourCreationReseauxChaleur.zones_fort_potentiel_chauf_mwh}
          formatter={formatMWhAn}
        />
        <Property
          label="Besoins en ECS sur les zones à fort potentiel (cumul)"
          value={communeFortPotentielPourCreationReseauxChaleur.zones_fort_potentiel_ecs_mwh}
          formatter={formatMWhAn}
        />
        <Property label="Source" value="Cerema-INSEE" />
      </TwoColumns>
    </>
  );
}
