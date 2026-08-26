import { useSearchParams } from 'next/navigation';
import { type inferParserType, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';

import {
  DPE_VALUES,
  ESPACE_EXTERIEUR_VALUES,
  getEspaceExterieurForTypeLogement,
  MODE_EAU_CHAUDE_SANITAIRE_QUERY_VALUES,
  TYPE_LOGEMENT_VALUES,
  TYPE_RADIATEUR_VALUES,
} from '@/modules/chaleur-renouvelable/constants';

const queryOptions = {
  history: 'replace' as const,
  scroll: false,
};

const simulationQueryParsers = {
  adresse: parseAsString.withOptions(queryOptions),
  dpe: parseAsStringLiteral(DPE_VALUES)
    .withDefault('E')
    .withOptions({ ...queryOptions, clearOnDefault: false }),
  espaceExterieur: parseAsStringLiteral(ESPACE_EXTERIEUR_VALUES).withOptions(queryOptions),
  habitantsMoyen: parseAsString.withOptions(queryOptions),
  modeEauChaudeSanitaire: parseAsStringLiteral(MODE_EAU_CHAUDE_SANITAIRE_QUERY_VALUES).withOptions(queryOptions),
  nbLogements: parseAsInteger.withOptions(queryOptions),
  surfaceMoyenne: parseAsInteger.withOptions(queryOptions),
  typeLogement: parseAsStringLiteral(TYPE_LOGEMENT_VALUES).withOptions(queryOptions),
  typeRadiateur: parseAsStringLiteral(TYPE_RADIATEUR_VALUES).withOptions(queryOptions),
};

export const choixChauffageQueryParsers = {
  ...simulationQueryParsers,
  construction_id: parseAsString.withOptions(queryOptions),
};

export type ChoixChauffageSimulationParams = inferParserType<typeof simulationQueryParsers>;
export type ChoixChauffageParams = ChoixChauffageSimulationParams & {
  constructionId: inferParserType<typeof choixChauffageQueryParsers>['construction_id'];
};
export type ChoixChauffageParamSources = {
  isDpeExplicit: boolean;
  isModeEauChaudeSanitaireInferred: boolean;
};
export type SetChoixChauffageParams = (params: Partial<ChoixChauffageParams>) => Promise<URLSearchParams>;

const getNullableQueryString = (value: string | null | undefined) => (value === '' ? null : (value ?? null));

export function getNextEspaceExterieurQueryValue({
  currentEspaceExterieur,
  effectiveEspaceExterieur,
  nextParams,
}: {
  currentEspaceExterieur: ChoixChauffageParams['espaceExterieur'];
  effectiveEspaceExterieur: ChoixChauffageParams['espaceExterieur'];
  nextParams: Partial<ChoixChauffageParams>;
}) {
  if (nextParams.typeLogement === undefined) {
    return nextParams.espaceExterieur;
  }

  const candidateEspaceExterieur =
    'espaceExterieur' in nextParams ? nextParams.espaceExterieur : (currentEspaceExterieur ?? effectiveEspaceExterieur);

  return getEspaceExterieurForTypeLogement(nextParams.typeLogement, candidateEspaceExterieur);
}

export function useChoixChauffageQueryParams() {
  const [queryParams, setQueryParams] = useQueryStates(choixChauffageQueryParsers);
  const searchParams = useSearchParams();
  const espaceExterieur = getEspaceExterieurForTypeLogement(queryParams.typeLogement, queryParams.espaceExterieur);
  const modeEauChaudeSanitaire =
    queryParams.modeEauChaudeSanitaire ?? (queryParams.typeLogement === 'immeuble_chauffage_collectif' ? 'Collectif' : null);
  const isDpeExplicit = searchParams?.has('dpe') ?? false;
  const isModeEauChaudeSanitaireInferred =
    queryParams.modeEauChaudeSanitaire === null && queryParams.typeLogement === 'immeuble_chauffage_collectif';
  const paramSources = useMemo(
    () => ({
      isDpeExplicit,
      isModeEauChaudeSanitaireInferred,
    }),
    [isDpeExplicit, isModeEauChaudeSanitaireInferred]
  ) satisfies ChoixChauffageParamSources;

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
        espaceExterieur: getNextEspaceExterieurQueryValue({
          currentEspaceExterieur: queryParams.espaceExterieur,
          effectiveEspaceExterieur: espaceExterieur,
          nextParams,
        }),
        habitantsMoyen: getNullableQueryString(nextParams.habitantsMoyen),
        modeEauChaudeSanitaire: nextParams.modeEauChaudeSanitaire,
        nbLogements: nextParams.nbLogements,
        surfaceMoyenne: nextParams.surfaceMoyenne,
        typeLogement: nextParams.typeLogement,
        typeRadiateur: nextParams.typeRadiateur,
      }),
    [espaceExterieur, queryParams.espaceExterieur, setQueryParams]
  );

  return useMemo(
    () => ({
      paramSources,
      params,
      setParams,
      simulationParams,
    }),
    [paramSources, params, setParams, simulationParams]
  );
}
