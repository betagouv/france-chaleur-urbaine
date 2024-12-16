import { type Interval } from '@/utils/interval';
import { formatMWhAn } from '@/utils/strings';

import { ifHoverElse, type PopupStyleHelpers, type MapSourceLayersSpecification } from './common';

export const communesFortPotentielPourCreationReseauxChaleurLayerColor = '#FF8329';
export const communesFortPotentielPourCreationReseauxChaleurLayerOpacity = 0.7;

export const communesFortPotentielPourCreationReseauxChaleurInterval: Interval = [0, 100_000];

export const communesFortPotentielPourCreationReseauxChaleurLayersSpec = [
  {
    sourceId: 'communesFortPotentielPourCreationReseauxChaleur',
    source: {
      type: 'vector',
      tiles: ['/api/map/communesFortPotentielPourCreationReseauxChaleur/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 6,
    },
    layers: [
      {
        id: 'communesFortPotentielPourCreationReseauxChaleur',
        type: 'circle',
        layout: {
          'circle-sort-key': ['-', ['get', 'population']],
        },
        paint: {
          'circle-color': communesFortPotentielPourCreationReseauxChaleurLayerColor,
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['+', ['get', 'zones_fort_potentiel_chauf_mwh'], ['get', 'zones_fort_potentiel_ecs_mwh']],
            0,
            ifHoverElse(6, 4),
            160_000, // ~ max value
            ifHoverElse(24, 20),
          ],
          'circle-opacity': communesFortPotentielPourCreationReseauxChaleurLayerOpacity,
        },
        filter: (config) => [
          'all',
          ['>=', ['get', 'population'], config.communesFortPotentielPourCreationReseauxChaleur.population[0]],
          ['<=', ['get', 'population'], config.communesFortPotentielPourCreationReseauxChaleur.population[1]],
        ],
        isVisible: (config) => config.communesFortPotentielPourCreationReseauxChaleur.show,
        popup: Popup,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

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
        <Property label="Source" value="BRGM" />
      </TwoColumns>
    </>
  );
}
