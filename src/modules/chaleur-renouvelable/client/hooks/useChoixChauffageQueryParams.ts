import { type inferParserType, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';

import {
  DPE_VALUES,
  ESPACE_EXTERIEUR_VALUES,
  isEspaceExterieurCompatible,
  MODE_EAU_CHAUDE_SANITAIRE_VALUES,
  TYPE_LOGEMENT_VALUES,
  TYPE_RADIATEUR_VALUES,
} from '@/modules/chaleur-renouvelable/constants';
import type { SimulationPrefillParams } from '@/modules/chaleur-renouvelable/simulation-prefill';

const queryOptions = {
  history: 'replace' as const,
  scroll: false,
};

const simulationQueryParsers = {
  adresse: parseAsString.withOptions(queryOptions),
  dpe: parseAsStringLiteral(DPE_VALUES).withDefault('E').withOptions(queryOptions),
  espaceExterieur: parseAsStringLiteral(ESPACE_EXTERIEUR_VALUES).withOptions(queryOptions),
  habitantsMoyen: parseAsString.withOptions(queryOptions),
  modeEauChaudeSanitaire: parseAsStringLiteral(MODE_EAU_CHAUDE_SANITAIRE_VALUES).withOptions(queryOptions),
  nbLogements: parseAsInteger.withOptions(queryOptions),
  surfaceMoyenne: parseAsInteger.withOptions(queryOptions),
  typeLogement: parseAsStringLiteral(TYPE_LOGEMENT_VALUES).withOptions(queryOptions),
  typeRadiateur: parseAsStringLiteral(TYPE_RADIATEUR_VALUES).withOptions(queryOptions),
};

const choixChauffageQueryParsers = {
  ...simulationQueryParsers,
  construction_id: parseAsString.withOptions(queryOptions),
};

export type ChoixChauffageSimulationParams = inferParserType<typeof simulationQueryParsers>;
export type ChoixChauffageParams = ChoixChauffageSimulationParams & {
  constructionId: inferParserType<typeof choixChauffageQueryParsers>['construction_id'];
};
export type SetChoixChauffageParams = (params: Partial<ChoixChauffageParams>) => Promise<URLSearchParams>;

const getNullableQueryString = (value: string | null | undefined) => (value === '' ? null : (value ?? null));
const hasQueryParam = (paramName: string) => new URLSearchParams(window.location.search).has(paramName);

export function useChoixChauffageQueryParams() {
  const [queryParams, setQueryParams] = useQueryStates(choixChauffageQueryParsers);
  const espaceExterieur = isEspaceExterieurCompatible(queryParams.typeLogement, queryParams.espaceExterieur)
    ? queryParams.espaceExterieur
    : null;
  const modeEauChaudeSanitaire =
    queryParams.modeEauChaudeSanitaire ?? (queryParams.typeLogement === 'immeuble_chauffage_collectif' ? 'Collectif' : null);

  const simulationParams = useMemo(
    () => ({
      adresse: queryParams.adresse,
      dpe: queryParams.dpe,
      espaceExterieur,
      habitantsMoyen: queryParams.habitantsMoyen,
      modeEauChaudeSanitaire,
      nbLogements: queryParams.nbLogements,
      surfaceMoyenne: queryParams.surfaceMoyenne,
      typeLogement: queryParams.typeLogement,
      typeRadiateur: queryParams.typeRadiateur,
    }),
    [
      queryParams.adresse,
      queryParams.dpe,
      espaceExterieur,
      queryParams.habitantsMoyen,
      modeEauChaudeSanitaire,
      queryParams.nbLogements,
      queryParams.surfaceMoyenne,
      queryParams.typeLogement,
      queryParams.typeRadiateur,
    ]
  ) satisfies ChoixChauffageSimulationParams;
  const params = useMemo(
    () => ({
      ...simulationParams,
      constructionId: queryParams.construction_id,
    }),
    [queryParams.construction_id, simulationParams]
  ) satisfies ChoixChauffageParams;

  const setParams: SetChoixChauffageParams = useCallback(
    (nextParams: Partial<ChoixChauffageParams>) =>
      setQueryParams({
        adresse: nextParams.adresse,
        construction_id: nextParams.constructionId,
        dpe: nextParams.dpe,
        espaceExterieur:
          nextParams.typeLogement !== undefined
            ? isEspaceExterieurCompatible(nextParams.typeLogement, nextParams.espaceExterieur ?? espaceExterieur)
              ? (nextParams.espaceExterieur ?? espaceExterieur)
              : null
            : nextParams.espaceExterieur,
        habitantsMoyen: getNullableQueryString(nextParams.habitantsMoyen),
        modeEauChaudeSanitaire: nextParams.modeEauChaudeSanitaire,
        nbLogements: nextParams.nbLogements,
        surfaceMoyenne: nextParams.surfaceMoyenne,
        typeLogement: nextParams.typeLogement,
        typeRadiateur: nextParams.typeRadiateur,
      }),
    [espaceExterieur, setQueryParams]
  );

  const setPrefillParams = useCallback(
    (params: SimulationPrefillParams) => {
      const nextTypeLogement = !hasQueryParam('typeLogement') ? params.typeLogement : undefined;

      return setQueryParams({
        dpe: !hasQueryParam('dpe') ? params.dpe : undefined,
        espaceExterieur: nextTypeLogement && !isEspaceExterieurCompatible(nextTypeLogement, espaceExterieur) ? null : undefined,
        modeEauChaudeSanitaire: !hasQueryParam('modeEauChaudeSanitaire') ? params.modeEauChaudeSanitaire : undefined,
        nbLogements: !hasQueryParam('nbLogements') ? params.nbLogements : undefined,
        surfaceMoyenne: !hasQueryParam('surfaceMoyenne') ? params.surfaceMoyenne : undefined,
        typeLogement: nextTypeLogement,
      });
    },
    [espaceExterieur, setQueryParams]
  );

  return useMemo(
    () => ({
      params,
      setParams,
      setPrefillParams,
      simulationParams,
    }),
    [params, setParams, setPrefillParams, simulationParams]
  );
}
