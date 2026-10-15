import { useSearchParams } from 'next/navigation';
import { createParser, type inferParserType, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';

import {
  DPE_VALUES,
  ESPACE_EXTERIEUR_VALUES,
  MODE_EAU_CHAUDE_SANITAIRE_QUERY_VALUES,
  normalizeModeEauChaudeSanitaireForTypeLogement,
  TYPE_LOGEMENT_VALUES,
  TYPE_RADIATEUR_VALUES,
  zAverageHousingArea,
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
  surfaceMoyenne: createParser({
    parse: (value) => {
      const result = zAverageHousingArea.safeParse(parseAsInteger.parse(value));
      return result.success ? result.data : null;
    },
    serialize: String,
  }).withOptions(queryOptions),
  typeLogement: parseAsStringLiteral(TYPE_LOGEMENT_VALUES).withOptions(queryOptions),
  typeRadiateur: parseAsStringLiteral(TYPE_RADIATEUR_VALUES).withOptions(queryOptions),
};

export const choixChauffageQueryParsers = {
  ...simulationQueryParsers,
  construction_id: parseAsString.withOptions(queryOptions),
  originDemandId: parseAsString.withOptions(queryOptions),
};

type ChoixChauffageSimulationParams = inferParserType<typeof simulationQueryParsers>;
export type ChoixChauffageParams = ChoixChauffageSimulationParams & {
  constructionId: inferParserType<typeof choixChauffageQueryParsers>['construction_id'];
  originDemandId: inferParserType<typeof choixChauffageQueryParsers>['originDemandId'];
};
export type ChoixChauffageParamSources = {
  isDpeExplicit: boolean;
  isModeEauChaudeSanitaireInferred: boolean;
};
export type SetChoixChauffageParams = (params: Partial<ChoixChauffageParams>) => Promise<URLSearchParams>;

export function useChoixChauffageQueryParams() {
  const [queryParams, setQueryParams] = useQueryStates(choixChauffageQueryParsers);
  const searchParams = useSearchParams();
  const espaceExterieur = queryParams.espaceExterieur;
  const queryModeEauChaudeSanitaire = queryParams.modeEauChaudeSanitaire;
  const defaultModeEauChaudeSanitaire = queryParams.typeLogement === 'immeuble_chauffage_collectif' ? 'Collectif' : null;
  const modeEauChaudeSanitaire = normalizeModeEauChaudeSanitaireForTypeLogement(
    queryModeEauChaudeSanitaire ?? defaultModeEauChaudeSanitaire,
    queryParams.typeLogement
  );
  const isDpeExplicit = searchParams?.has('dpe') ?? false;
  const isModeEauChaudeSanitaireInferred =
    queryModeEauChaudeSanitaire === null && queryParams.typeLogement === 'immeuble_chauffage_collectif';
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
      originDemandId: queryParams.originDemandId,
    }),
    [queryParams.construction_id, queryParams.originDemandId, simulationParams]
  ) satisfies ChoixChauffageParams;

  const setParams: SetChoixChauffageParams = useCallback(
    (nextParams: Partial<ChoixChauffageParams>) => {
      const nextTypeLogement = nextParams.typeLogement ?? queryParams.typeLogement;
      const shouldUpdateModeEauChaudeSanitaire = 'modeEauChaudeSanitaire' in nextParams || nextParams.typeLogement !== undefined;
      const nextModeEauChaudeSanitaire = shouldUpdateModeEauChaudeSanitaire
        ? normalizeModeEauChaudeSanitaireForTypeLogement(
            'modeEauChaudeSanitaire' in nextParams ? nextParams.modeEauChaudeSanitaire : queryParams.modeEauChaudeSanitaire,
            nextTypeLogement
          )
        : undefined;

      return setQueryParams({
        adresse: nextParams.adresse,
        construction_id: nextParams.constructionId,
        dpe: nextParams.dpe,
        espaceExterieur: nextParams.espaceExterieur,
        habitantsMoyen: nextParams.habitantsMoyen === '' ? null : nextParams.habitantsMoyen,
        modeEauChaudeSanitaire: nextModeEauChaudeSanitaire,
        nbLogements: nextParams.nbLogements,
        originDemandId: nextParams.originDemandId,
        surfaceMoyenne: nextParams.surfaceMoyenne,
        typeLogement: nextParams.typeLogement,
        typeRadiateur: nextParams.typeRadiateur,
      });
    },
    [queryParams.modeEauChaudeSanitaire, queryParams.typeLogement, setQueryParams]
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
