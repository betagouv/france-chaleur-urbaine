import { type ExpressionSpecification } from 'maplibre-gl';

import { gestionnairesFilters } from '@/services';
import { filtresEnergies, percentageMaxInterval, type MapConfiguration } from '@/services/Map/map-configuration';
import { type Network } from '@/types/Summary/Network';
import { isDefined } from '@/utils/core';
import { intervalsEqual } from '@/utils/interval';

type ReseauxDeChaleurFilter = {
  valueKey: keyof Network;
  confKey: Exclude<keyof MapConfiguration['reseauxDeChaleur'], 'show'>;
  filterPreprocess?: (v: number) => number;
};

export const reseauxDeChaleurFilters = [
  {
    confKey: 'tauxENRR',
    valueKey: 'Taux EnR&R',
  },
  {
    confKey: 'emissionsCO2',
    valueKey: 'contenu CO2 ACV',
    filterPreprocess: (v: number) => v / 1000,
  },
  {
    confKey: 'contenuCO2',
    valueKey: 'contenu CO2',
    filterPreprocess: (v: number) => v / 1000,
  },
  {
    confKey: 'prixMoyen',
    valueKey: 'PM',
  },
  {
    confKey: 'livraisonsAnnuelles',
    valueKey: 'livraisons_totale_MWh',
    filterPreprocess: (v: number) => v * 1000,
  },
  {
    confKey: 'anneeConstruction',
    valueKey: 'annee_creation',
  },
] satisfies ReseauxDeChaleurFilter[];

export type ReseauxDeChaleurLimits = Record<(typeof reseauxDeChaleurFilters)[number]['confKey'], [min: number, max: number]>;

/**
 * Applique chaque filtre de réseau de chaleur si l'intervalle est compris
 * dans [min, max], ou les désactive s'ils sont strictement égaux à l'intervalle par défaut.
 */
export function buildReseauxDeChaleurFilters(conf: MapConfiguration['reseauxDeChaleur']): ExpressionSpecification[] {
  return [
    ...(isDefined(conf.isClassed) ? [['==', ['get', 'reseaux classes'], conf.isClassed] satisfies ExpressionSpecification] : []),
    ...(conf.energieMobilisee && conf.energieMobilisee.length > 0
      ? conf.energieMobilisee.map(
          (energie) => ['>', ['coalesce', ['get', `energie_ratio_${energie}`]], 0] satisfies ExpressionSpecification
        )
      : []),
    ...reseauxDeChaleurFilters.flatMap((filtre) => {
      const minValue = filtre.filterPreprocess ? filtre.filterPreprocess(conf[filtre.confKey][0]) : conf[filtre.confKey][0];
      const maxValue = filtre.filterPreprocess ? filtre.filterPreprocess(conf[filtre.confKey][1]) : conf[filtre.confKey][1];

      return intervalsEqual(conf[filtre.confKey], conf.limits![filtre.confKey])
        ? []
        : ([
            ['>=', ['coalesce', ['get', filtre.valueKey], Number.MIN_SAFE_INTEGER], minValue],
            ['<=', ['coalesce', ['get', filtre.valueKey], Number.MAX_SAFE_INTEGER], maxValue],
          ] satisfies ExpressionSpecification[]);
    }),
    ...filtresEnergies.flatMap((filtre) => {
      const fullConfKey = `energie_ratio_${filtre.confKey}` as const;
      const interval = conf[fullConfKey];
      const minValue = interval[0];
      const maxValue = interval[1];

      return intervalsEqual(interval, percentageMaxInterval)
        ? []
        : ([
            ['>=', ['coalesce', ['get', fullConfKey], Number.MIN_SAFE_INTEGER], minValue / 100],
            ['<=', ['coalesce', ['get', fullConfKey], Number.MAX_SAFE_INTEGER], maxValue / 100],
          ] satisfies ExpressionSpecification[]);
    }),
  ].filter((v) => v !== null);
}

export function buildFiltreGestionnaire(filtreGestionnaire: MapConfiguration['filtreGestionnaire']): ExpressionSpecification[] {
  if ((filtreGestionnaire || []).length === 0) {
    return [];
  }

  if (filtreGestionnaire.includes('autre')) {
    const gestionnairesToExclude = gestionnairesFilters
      .filter(({ value }) => !filtreGestionnaire.includes(value))
      .map(({ value }) => value);

    return [
      [
        'all',
        ...gestionnairesToExclude.flatMap(
          (filtre) =>
            [
              [
                '!',
                [
                  'in',
                  filtre,
                  ['downcase', ['coalesce', ['get', 'gestionnaire'], '']], // futurNetwork
                ],
              ],
              [
                '!',
                [
                  'in',
                  filtre,
                  ['downcase', ['coalesce', ['get', 'Gestionnaire'], '']], // coldNetwork and network,
                ],
              ],
            ] satisfies ExpressionSpecification[]
        ),
      ],
    ];
  }

  return (filtreGestionnaire || []).length > 0
    ? [
        [
          'any',
          ...filtreGestionnaire.flatMap(
            (filtre) =>
              [
                [
                  'in',
                  filtre,
                  ['downcase', ['coalesce', ['get', 'gestionnaire'], '']], // futurNetwork
                ],
                [
                  'in',
                  filtre,
                  ['downcase', ['coalesce', ['get', 'Gestionnaire'], '']], // coldNetwork and network
                ],
              ] satisfies ExpressionSpecification[]
          ),
        ],
      ]
    : [];
}

export function buildFiltreIdentifiantReseau(
  filtreIdentifiantReseau: MapConfiguration['filtreIdentifiantReseau']
): ExpressionSpecification[] {
  return filtreIdentifiantReseau.length > 0
    ? [['in', ['coalesce', ['get', 'Identifiant reseau'], ''], ['literal', filtreIdentifiantReseau]]]
    : [];
}
