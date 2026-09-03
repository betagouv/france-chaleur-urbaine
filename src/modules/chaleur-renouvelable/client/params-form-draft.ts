import type {
  ChoixChauffageParamSources,
  ChoixChauffageParams,
  ChoixChauffageSimulationParams,
} from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import { type DPE, MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE } from '@/modules/chaleur-renouvelable/constants';

export type ParamsFormDraft = {
  adresse: NonNullable<ChoixChauffageSimulationParams['adresse']>;
  constructionId: string | null;
  dpe: DPE;
  espaceExterieur: ChoixChauffageSimulationParams['espaceExterieur'];
  habitantsMoyen: NonNullable<ChoixChauffageSimulationParams['habitantsMoyen']>;
  modeEauChaudeSanitaire: ChoixChauffageSimulationParams['modeEauChaudeSanitaire'] | null;
  nbLogements: string;
  surfaceMoyenne: string;
  isDpeExplicit: boolean;
  isModeEauChaudeSanitaireInferred: boolean;
  typeLogement: ChoixChauffageSimulationParams['typeLogement'];
  typeRadiateur: ChoixChauffageSimulationParams['typeRadiateur'];
};

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

export function areParamsFormDraftsEqual(left: ParamsFormDraft, right: ParamsFormDraft) {
  return (
    left.adresse === right.adresse &&
    left.constructionId === right.constructionId &&
    left.dpe === right.dpe &&
    left.espaceExterieur === right.espaceExterieur &&
    left.habitantsMoyen === right.habitantsMoyen &&
    left.isDpeExplicit === right.isDpeExplicit &&
    left.isModeEauChaudeSanitaireInferred === right.isModeEauChaudeSanitaireInferred &&
    left.modeEauChaudeSanitaire === right.modeEauChaudeSanitaire &&
    left.nbLogements === right.nbLogements &&
    left.surfaceMoyenne === right.surfaceMoyenne &&
    left.typeLogement === right.typeLogement &&
    left.typeRadiateur === right.typeRadiateur
  );
}

export function getParamsFormCompletion(draft: ParamsFormDraft) {
  const isDpeIncomplete = !draft.isDpeExplicit;
  const isHabitantsMoyenIncomplete = normalizeDecimalString(draft.habitantsMoyen) === '';
  const isModeEauChaudeSanitaireIncomplete =
    !draft.modeEauChaudeSanitaire ||
    draft.modeEauChaudeSanitaire === MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE ||
    draft.isModeEauChaudeSanitaireInferred;
  const isNbLogementsIncomplete = parseIntegerOrNull(draft.nbLogements) === null;
  const isSurfaceMoyenneIncomplete = parseIntegerOrNull(draft.surfaceMoyenne) === null;
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
