import { type inferParserType, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';

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

export type ChoixChauffageParams = inferParserType<typeof simulationQueryParsers>;
export type SetChoixChauffageParam = (
  ...args: {
    [ParamName in keyof ChoixChauffageParams]: [paramName: ParamName, value: ChoixChauffageParams[ParamName]];
  }[keyof ChoixChauffageParams]
) => Promise<URLSearchParams>;

const getNullableQueryString = (value: string | null | undefined) => (value === '' ? null : (value ?? null));
const hasQueryParam = (paramName: string) => new URLSearchParams(window.location.search).has(paramName);

export function useChoixChauffageQueryParams() {
  const [queryParams, setQueryParams] = useQueryStates(choixChauffageQueryParsers);
  const espaceExterieur = isEspaceExterieurCompatible(queryParams.typeLogement, queryParams.espaceExterieur)
    ? queryParams.espaceExterieur
    : null;

  const simulationParams: ChoixChauffageParams = {
    adresse: queryParams.adresse,
    dpe: queryParams.dpe,
    espaceExterieur,
    habitantsMoyen: queryParams.habitantsMoyen,
    modeEauChaudeSanitaire: queryParams.modeEauChaudeSanitaire,
    nbLogements: queryParams.nbLogements,
    surfaceMoyenne: queryParams.surfaceMoyenne,
    typeLogement: queryParams.typeLogement,
    typeRadiateur: queryParams.typeRadiateur,
  };
  const simulationParamSetters = {
    adresse: (adresse: ChoixChauffageParams['adresse']) => setQueryParams({ adresse }),
    dpe: (dpe: ChoixChauffageParams['dpe']) => setQueryParams({ dpe }),
    espaceExterieur: (espaceExterieur: ChoixChauffageParams['espaceExterieur']) => setQueryParams({ espaceExterieur }),
    habitantsMoyen: (habitantsMoyen: ChoixChauffageParams['habitantsMoyen']) =>
      setQueryParams({ habitantsMoyen: getNullableQueryString(habitantsMoyen) }),
    modeEauChaudeSanitaire: (modeEauChaudeSanitaire: ChoixChauffageParams['modeEauChaudeSanitaire']) =>
      setQueryParams({ modeEauChaudeSanitaire }),
    nbLogements: (nbLogements: ChoixChauffageParams['nbLogements']) => setQueryParams({ nbLogements }),
    surfaceMoyenne: (surfaceMoyenne: ChoixChauffageParams['surfaceMoyenne']) => setQueryParams({ surfaceMoyenne }),
    typeLogement: (typeLogement: ChoixChauffageParams['typeLogement']) =>
      setQueryParams({
        espaceExterieur: isEspaceExterieurCompatible(typeLogement, espaceExterieur) ? espaceExterieur : null,
        typeLogement,
      }),
    typeRadiateur: (typeRadiateur: ChoixChauffageParams['typeRadiateur']) => setQueryParams({ typeRadiateur }),
  } satisfies { [ParamName in keyof ChoixChauffageParams]: (value: ChoixChauffageParams[ParamName]) => ReturnType<typeof setQueryParams> };

  const setSimulationParam: SetChoixChauffageParam = (paramName, value) => simulationParamSetters[paramName](value as never);
  const setPrefillParams = (params: SimulationPrefillParams) => {
    const nextTypeLogement = !hasQueryParam('typeLogement') ? params.typeLogement : undefined;

    return setQueryParams({
      dpe: !hasQueryParam('dpe') ? params.dpe : undefined,
      espaceExterieur: nextTypeLogement && !isEspaceExterieurCompatible(nextTypeLogement, espaceExterieur) ? null : undefined,
      modeEauChaudeSanitaire: !hasQueryParam('modeEauChaudeSanitaire') ? params.modeEauChaudeSanitaire : undefined,
      nbLogements: !hasQueryParam('nbLogements') ? params.nbLogements : undefined,
      surfaceMoyenne: !hasQueryParam('surfaceMoyenne') ? params.surfaceMoyenne : undefined,
      typeLogement: nextTypeLogement,
    });
  };

  return {
    adresse: queryParams.adresse,
    constructionId: queryParams.construction_id,
    dpe: queryParams.dpe,
    espaceExterieur,
    habitantsMoyen: queryParams.habitantsMoyen,
    modeEauChaudeSanitaire: queryParams.modeEauChaudeSanitaire,
    nbLogements: queryParams.nbLogements,
    setConstructionId: (constructionId: string | null) => setQueryParams({ construction_id: constructionId }),
    setPrefillParams,
    setSimulationParam,
    setSimulationParams: (params: Partial<ChoixChauffageParams>) =>
      setQueryParams({
        adresse: params.adresse,
        dpe: params.dpe,
        espaceExterieur: params.espaceExterieur,
        habitantsMoyen: getNullableQueryString(params.habitantsMoyen),
        modeEauChaudeSanitaire: params.modeEauChaudeSanitaire,
        nbLogements: params.nbLogements,
        surfaceMoyenne: params.surfaceMoyenne,
        typeLogement: params.typeLogement,
        typeRadiateur: params.typeRadiateur,
      }),
    simulationParams,
    surfaceMoyenne: queryParams.surfaceMoyenne,
    typeLogement: queryParams.typeLogement,
    typeRadiateur: queryParams.typeRadiateur,
  };
}
