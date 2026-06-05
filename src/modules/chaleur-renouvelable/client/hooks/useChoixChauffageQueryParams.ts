import { type inferParserType, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';

import {
  type DPE,
  DPE_VALUES,
  ESPACE_EXTERIEUR_VALUES,
  type EspaceExterieur,
  isEspaceExterieurCompatible,
  MODE_EAU_CHAUDE_SANITAIRE_VALUES,
  type ModeEauChaudeSanitaire,
  TYPE_LOGEMENT_VALUES,
  TYPE_RADIATEUR_VALUES,
  type TypeLogement,
  type TypeRadiateur,
} from '@/modules/chaleur-renouvelable/constants';
import type { SimulationPrefillParams } from '@/modules/chaleur-renouvelable/simulation-prefill';

const queryOptions = {
  history: 'replace' as const,
  scroll: false,
};

const choixChauffageQueryParsers = {
  adresse: parseAsString.withOptions(queryOptions),
  construction_id: parseAsString.withOptions(queryOptions),
  dpe: parseAsStringLiteral(DPE_VALUES).withDefault('E').withOptions(queryOptions),
  espaceExterieur: parseAsStringLiteral(ESPACE_EXTERIEUR_VALUES).withOptions(queryOptions),
  habitantsMoyen: parseAsString.withOptions(queryOptions),
  modeEauChaudeSanitaire: parseAsStringLiteral(MODE_EAU_CHAUDE_SANITAIRE_VALUES).withOptions(queryOptions),
  nbLogements: parseAsInteger.withOptions(queryOptions),
  surfaceMoyenne: parseAsInteger.withOptions(queryOptions),
  typeLogement: parseAsStringLiteral(TYPE_LOGEMENT_VALUES).withOptions(queryOptions),
  typeRadiateur: parseAsStringLiteral(TYPE_RADIATEUR_VALUES).withOptions(queryOptions),
};

export type ChoixChauffageParams = Omit<inferParserType<typeof choixChauffageQueryParsers>, 'construction_id'>;

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
  const setTypeLogementAndResetInvalidOutdoorSpace = (typeLogement: TypeLogement | null) =>
    setQueryParams({
      espaceExterieur: isEspaceExterieurCompatible(typeLogement, espaceExterieur) ? espaceExterieur : null,
      typeLogement,
    });
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
    setAdresse: (adresse: string | null) => setQueryParams({ adresse }),
    setConstructionId: (constructionId: string | null) => setQueryParams({ construction_id: constructionId }),
    setDpe: (dpe: DPE) => setQueryParams({ dpe }),
    setEspaceExterieur: (espaceExterieur: EspaceExterieur | null) => setQueryParams({ espaceExterieur }),
    setHabitantsMoyen: (habitantsMoyen: string | null) => setQueryParams({ habitantsMoyen: getNullableQueryString(habitantsMoyen) }),
    setModeEauChaudeSanitaire: (modeEauChaudeSanitaire: ModeEauChaudeSanitaire | null) => setQueryParams({ modeEauChaudeSanitaire }),
    setNbLogements: (nbLogements: number | null) => setQueryParams({ nbLogements }),
    setPrefillParams,
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
    setSurfaceMoyenne: (surfaceMoyenne: number | null) => setQueryParams({ surfaceMoyenne }),
    setTypeLogement: (typeLogement: TypeLogement | null) => setQueryParams({ typeLogement }),
    setTypeLogementAndResetInvalidOutdoorSpace,
    setTypeRadiateur: (typeRadiateur: TypeRadiateur | null) => setQueryParams({ typeRadiateur }),
    simulationParams,
    surfaceMoyenne: queryParams.surfaceMoyenne,
    typeLogement: queryParams.typeLogement,
    typeRadiateur: queryParams.typeRadiateur,
  };
}
