import { z } from 'zod';

import type {
  ChoixChauffageParamSources,
  ChoixChauffageParams,
} from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import {
  DPE_VALUES,
  ESPACE_EXTERIEUR_VALUES,
  MINIMUM_AVERAGE_HOUSING_AREA_MESSAGE,
  MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE,
  MODE_EAU_CHAUDE_SANITAIRE_QUERY_VALUES,
  TYPE_LOGEMENT_VALUES,
  TYPE_RADIATEUR_VALUES,
  zAverageHousingArea,
} from '@/modules/chaleur-renouvelable/constants';

export const zParamsForm = z.object({
  adresse: z.string(),
  constructionId: z.string().nullable(),
  dpe: z.enum(DPE_VALUES),
  espaceExterieur: z.enum(ESPACE_EXTERIEUR_VALUES).nullable(),
  habitantsMoyen: z.string(),
  isDpeExplicit: z.boolean(),
  isModeEauChaudeSanitaireInferred: z.boolean(),
  modeEauChaudeSanitaire: z.enum(MODE_EAU_CHAUDE_SANITAIRE_QUERY_VALUES).nullable(),
  nbLogements: z.string(),
  surfaceMoyenne: z.string().refine((value) => value.trim() === '' || zAverageHousingArea.safeParse(Number(value)).success, {
    message: MINIMUM_AVERAGE_HOUSING_AREA_MESSAGE,
  }),
  typeLogement: z.enum(TYPE_LOGEMENT_VALUES).nullable(),
  typeRadiateur: z.enum(TYPE_RADIATEUR_VALUES).nullable(),
});

export type ParamsFormDraft = z.infer<typeof zParamsForm>;

export function parseIntegerOrNull(value: string) {
  const trimmedValue = value.trim();
  if (trimmedValue === '') {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export function normalizeDecimalString(value: string) {
  const normalizedValue = value.replace(',', '.').replace(/\.$/, '').trim();
  if (normalizedValue === '') {
    return '';
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? String(parsedValue) : '';
}

export function toParamsFormDraft(values: ChoixChauffageParams, paramSources: ChoixChauffageParamSources): ParamsFormDraft {
  return {
    adresse: values.adresse ?? '',
    constructionId: values.constructionId ?? null,
    dpe: values.dpe,
    espaceExterieur: values.espaceExterieur,
    habitantsMoyen: values.habitantsMoyen ?? '',
    isDpeExplicit: paramSources.isDpeExplicit,
    isModeEauChaudeSanitaireInferred: paramSources.isModeEauChaudeSanitaireInferred,
    modeEauChaudeSanitaire: values.modeEauChaudeSanitaire,
    nbLogements: values.nbLogements === null ? '' : String(values.nbLogements),
    surfaceMoyenne: values.surfaceMoyenne === null ? '' : String(values.surfaceMoyenne),
    typeLogement: values.typeLogement,
    typeRadiateur: values.typeRadiateur,
  };
}

export function toChoixChauffageParamsPatch(draft: ParamsFormDraft): Partial<ChoixChauffageParams> {
  const normalizedHabitantsMoyen = normalizeDecimalString(draft.habitantsMoyen);
  const normalizedNbLogements = parseIntegerOrNull(draft.nbLogements);
  const normalizedSurfaceMoyenne = parseIntegerOrNull(draft.surfaceMoyenne);

  return {
    adresse: draft.adresse || null,
    constructionId: draft.constructionId,
    espaceExterieur: draft.espaceExterieur,
    habitantsMoyen: normalizedHabitantsMoyen || null,
    nbLogements: normalizedNbLogements,
    surfaceMoyenne: normalizedSurfaceMoyenne,
    typeLogement: draft.typeLogement,
    typeRadiateur: draft.typeRadiateur,
    ...(draft.isDpeExplicit ? { dpe: draft.dpe } : {}),
    ...(draft.isModeEauChaudeSanitaireInferred ? {} : { modeEauChaudeSanitaire: draft.modeEauChaudeSanitaire }),
  };
}

export function normalizeDraftNumbers(draft: ParamsFormDraft): ParamsFormDraft {
  const normalizedHabitantsMoyen = normalizeDecimalString(draft.habitantsMoyen);
  const normalizedNbLogements = parseIntegerOrNull(draft.nbLogements);
  const normalizedSurfaceMoyenne = parseIntegerOrNull(draft.surfaceMoyenne);

  return {
    ...draft,
    habitantsMoyen: normalizedHabitantsMoyen,
    nbLogements: normalizedNbLogements === null ? '' : String(normalizedNbLogements),
    surfaceMoyenne: normalizedSurfaceMoyenne === null ? '' : String(normalizedSurfaceMoyenne),
  };
}

export function getParamsFormCompletion(draft: ParamsFormDraft) {
  const isDpeIncomplete = !draft.isDpeExplicit;
  const isHabitantsMoyenIncomplete = normalizeDecimalString(draft.habitantsMoyen) === '';
  const isModeEauChaudeSanitaireIncomplete =
    !draft.modeEauChaudeSanitaire ||
    draft.modeEauChaudeSanitaire === MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE ||
    draft.isModeEauChaudeSanitaireInferred;
  const isNbLogementsIncomplete = parseIntegerOrNull(draft.nbLogements) === null;
  const isSurfaceMoyenneIncomplete = !zAverageHousingArea.safeParse(parseIntegerOrNull(draft.surfaceMoyenne)).success;
  const incompleteCount = [
    isDpeIncomplete,
    isHabitantsMoyenIncomplete,
    isModeEauChaudeSanitaireIncomplete,
    isNbLogementsIncomplete,
    isSurfaceMoyenneIncomplete,
  ].filter(Boolean).length;

  return {
    incompleteCount,
    isDpeIncomplete,
    isHabitantsMoyenIncomplete,
    isModeEauChaudeSanitaireIncomplete,
    isNbLogementsIncomplete,
    isSurfaceMoyenneIncomplete,
  };
}
