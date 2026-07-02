import type { ExpressionSpecification } from 'maplibre-gl';

import { gestionnairesFilters } from '@/modules/reseaux/constants';
import type { ReseauxDeChaleurTile } from '@/modules/tiles/server/generation-configs/reseaux-de-chaleur';
import type { ReseauxEnConstructionTile } from '@/modules/tiles/server/tiles.config';
import { type Interval, intervalsEqual } from '@/utils/interval';

import { filtresEnergies, type MapConfiguration, percentageMaxInterval } from '../config/map-configuration';

/**
 * `['get', key]` with `key` checked against the tile type `T`, passed explicitly per call
 * (e.g. `getProp<ReseauxDeChaleurTile>('MO')`) — guards against typos / renamed columns.
 */
const getProp = <T>(key: keyof T & string): ExpressionSpecification => ['get', key];

type ReseauxDeChaleurFilter = {
  valueKey: keyof ReseauxDeChaleurTile;
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
    filterPreprocess: (v: number) => v / 1000,
    valueKey: 'contenu CO2 ACV',
  },
  {
    confKey: 'contenuCO2',
    filterPreprocess: (v: number) => v / 1000,
    valueKey: 'contenu CO2',
  },
  {
    confKey: 'prixMoyen',
    valueKey: 'PM',
  },
  {
    confKey: 'livraisonsAnnuelles',
    filterPreprocess: (v: number) => v * 1000,
    valueKey: 'livraisons_totale_MWh',
  },
  {
    confKey: 'anneeConstruction',
    valueKey: 'annee_creation',
  },
] satisfies ReseauxDeChaleurFilter[];

export type ReseauxDeChaleurLimits = Record<(typeof reseauxDeChaleurFilters)[number]['confKey'], Interval>;

/**
 * Applique chaque filtre de réseau de chaleur si l'intervalle est compris
 * dans [min, max], ou les désactive s'ils sont strictement égaux à l'intervalle par défaut.
 */
export function buildReseauxDeChaleurFilters(conf: MapConfiguration['reseauxDeChaleur']): ExpressionSpecification[] {
  return [
    ...(conf.isClassed ? [['==', getProp<ReseauxDeChaleurTile>('reseaux classes'), true] satisfies ExpressionSpecification] : []),
    ...(conf.energieMobilisee && conf.energieMobilisee.length > 0
      ? conf.energieMobilisee.map(
          (energie) => ['>', ['coalesce', getProp<ReseauxDeChaleurTile>(`energie_ratio_${energie}`)], 0] satisfies ExpressionSpecification
        )
      : []),
    ...reseauxDeChaleurFilters.flatMap((filtre) => {
      const minValue = filtre.filterPreprocess ? filtre.filterPreprocess(conf[filtre.confKey][0]) : conf[filtre.confKey][0];
      const maxValue = filtre.filterPreprocess ? filtre.filterPreprocess(conf[filtre.confKey][1]) : conf[filtre.confKey][1];

      return intervalsEqual(conf[filtre.confKey], conf.limits[filtre.confKey])
        ? []
        : ([
            ['>=', ['coalesce', getProp<ReseauxDeChaleurTile>(filtre.valueKey), Number.MIN_SAFE_INTEGER], minValue],
            ['<=', ['coalesce', getProp<ReseauxDeChaleurTile>(filtre.valueKey), Number.MAX_SAFE_INTEGER], maxValue],
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
            ['>=', ['coalesce', getProp<ReseauxDeChaleurTile>(fullConfKey), Number.MIN_SAFE_INTEGER], minValue / 100],
            ['<=', ['coalesce', getProp<ReseauxDeChaleurTile>(fullConfKey), Number.MAX_SAFE_INTEGER], maxValue / 100],
          ] satisfies ExpressionSpecification[]);
    }),
  ].filter((v) => v !== null);
}

/** Values must be lowercase (the feature value is lowercased in the expression). */
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
              ['!', ['in', filtre, ['downcase', ['coalesce', getProp<ReseauxEnConstructionTile>('gestionnaire'), '']]]],
              ['!', ['in', filtre, ['downcase', ['coalesce', getProp<ReseauxDeChaleurTile>('Gestionnaire'), '']]]],
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
                ['in', filtre, ['downcase', ['coalesce', getProp<ReseauxEnConstructionTile>('gestionnaire'), '']]],
                ['in', filtre, ['downcase', ['coalesce', getProp<ReseauxDeChaleurTile>('Gestionnaire'), '']]],
              ] satisfies ExpressionSpecification[]
          ),
        ],
      ]
    : [];
}

/**
 * Free-text substring match on the `MO` (maître d'ouvrage) field. Case-insensitive; multiple values are OR-ed.
 * The union type param ensures `MO` exists on every filtered tile source (chaleur, froid, construction).
 */
export function buildFiltreMaitreOuvrage(filtreMaitreOuvrage: MapConfiguration['filtreMaitreOuvrage']): ExpressionSpecification[] {
  const values = (filtreMaitreOuvrage ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
  return values.length > 0
    ? [
        [
          'any',
          ...values.map(
            (filtre) =>
              [
                'in',
                filtre,
                ['downcase', ['coalesce', getProp<ReseauxDeChaleurTile | ReseauxEnConstructionTile>('MO'), '']],
              ] satisfies ExpressionSpecification
          ),
        ],
      ]
    : [];
}

export function buildFiltreIdentifiantReseau(
  filtreIdentifiantReseau: MapConfiguration['filtreIdentifiantReseau']
): ExpressionSpecification[] {
  return filtreIdentifiantReseau.length > 0
    ? [['in', ['coalesce', getProp<ReseauxDeChaleurTile>('Identifiant reseau'), ''], ['literal', filtreIdentifiantReseau]]]
    : [];
}
