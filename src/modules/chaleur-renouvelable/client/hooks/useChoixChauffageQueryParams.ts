import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';

import {
  type DPE,
  DPE_VALUES,
  ESPACE_EXTERIEUR_VALUES,
  type EspaceExterieur,
  MODE_EAU_CHAUDE_SANITAIRE_VALUES,
  type ModeEauChaudeSanitaire,
  TYPE_LOGEMENT_VALUES,
  TYPE_RADIATEUR_VALUES,
  type TypeLogement,
  type TypeRadiateur,
} from '@/modules/chaleur-renouvelable/constants';

export type ChoixChauffageParams = {
  adresse: string | null;
  dpe: DPE;
  espaceExterieur: EspaceExterieur | null;
  habitantsMoyen: string | null;
  modeEauChaudeSanitaire: ModeEauChaudeSanitaire | null;
  nbLogements: number | null;
  surfaceMoyenne: number | null;
  typeLogement: TypeLogement | null;
  typeRadiateur: TypeRadiateur | null;
};

export function useChoixChauffageQueryParams() {
  const queryOptions = {
    history: 'replace' as const,
    scroll: false,
  };
  const [queryParams, setQueryParams] = useQueryStates({
    adresse: parseAsString.withOptions(queryOptions),
    dpe: parseAsStringLiteral(DPE_VALUES)
      .withDefault('E' as DPE)
      .withOptions(queryOptions),
    espaceExterieur: parseAsStringLiteral(ESPACE_EXTERIEUR_VALUES).withOptions(queryOptions),
    habitantsMoyen: parseAsString.withOptions(queryOptions),
    modeEauChaudeSanitaire: parseAsStringLiteral(MODE_EAU_CHAUDE_SANITAIRE_VALUES).withOptions(queryOptions),
    nbLogements: parseAsInteger.withOptions(queryOptions),
    surfaceMoyenne: parseAsInteger.withOptions(queryOptions),
    typeLogement: parseAsStringLiteral(TYPE_LOGEMENT_VALUES).withOptions(queryOptions),
    typeRadiateur: parseAsStringLiteral(TYPE_RADIATEUR_VALUES).withOptions(queryOptions),
  });

  const simulationParams: ChoixChauffageParams = {
    adresse: queryParams.adresse,
    dpe: queryParams.dpe,
    espaceExterieur: queryParams.espaceExterieur,
    habitantsMoyen: queryParams.habitantsMoyen,
    modeEauChaudeSanitaire: queryParams.modeEauChaudeSanitaire,
    nbLogements: queryParams.nbLogements,
    surfaceMoyenne: queryParams.surfaceMoyenne,
    typeLogement: queryParams.typeLogement,
    typeRadiateur: queryParams.typeRadiateur,
  };

  return {
    adresse: queryParams.adresse,
    dpe: queryParams.dpe,
    espaceExterieur: queryParams.espaceExterieur,
    habitantsMoyen: queryParams.habitantsMoyen,
    modeEauChaudeSanitaire: queryParams.modeEauChaudeSanitaire,
    nbLogements: queryParams.nbLogements,
    setAdresse: (adresse: string | null) => setQueryParams({ adresse }),
    setDpe: (dpe: DPE) => setQueryParams({ dpe }),
    setEspaceExterieur: (espaceExterieur: EspaceExterieur | null) => setQueryParams({ espaceExterieur }),
    setHabitantsMoyen: (habitantsMoyen: string | null) => setQueryParams({ habitantsMoyen }),
    setModeEauChaudeSanitaire: (modeEauChaudeSanitaire: ModeEauChaudeSanitaire | null) => setQueryParams({ modeEauChaudeSanitaire }),
    setNbLogements: (nbLogements: number | null) => setQueryParams({ nbLogements }),
    setSimulationParams: (params: Partial<ChoixChauffageParams>) =>
      setQueryParams({
        adresse: params.adresse,
        dpe: params.dpe,
        espaceExterieur: params.espaceExterieur,
        habitantsMoyen: params.habitantsMoyen,
        modeEauChaudeSanitaire: params.modeEauChaudeSanitaire,
        nbLogements: params.nbLogements,
        surfaceMoyenne: params.surfaceMoyenne,
        typeLogement: params.typeLogement,
        typeRadiateur: params.typeRadiateur,
      }),
    setSurfaceMoyenne: (surfaceMoyenne: number | null) => setQueryParams({ surfaceMoyenne }),
    setTypeLogement: (typeLogement: TypeLogement | null) => setQueryParams({ typeLogement }),
    setTypeRadiateur: (typeRadiateur: TypeRadiateur | null) => setQueryParams({ typeRadiateur }),
    simulationParams,
    surfaceMoyenne: queryParams.surfaceMoyenne,
    typeLogement: queryParams.typeLogement,
    typeRadiateur: queryParams.typeRadiateur,
  };
}
