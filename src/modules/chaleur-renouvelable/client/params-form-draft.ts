import type { ChoixChauffageParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import type { DPE } from '@/modules/chaleur-renouvelable/constants';

export type ParamsFormDraft = {
  adresse: NonNullable<ChoixChauffageParams['adresse']>;
  dpe: DPE;
  espaceExterieur: ChoixChauffageParams['espaceExterieur'];
  habitantsMoyen: NonNullable<ChoixChauffageParams['habitantsMoyen']>;
  modeEauChaudeSanitaire: ChoixChauffageParams['modeEauChaudeSanitaire'] | null;
  nbLogements: string;
  surfaceMoyenne: string;
  typeLogement: ChoixChauffageParams['typeLogement'];
  typeRadiateur: ChoixChauffageParams['typeRadiateur'];
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

export function toParamsFormDraft(values: ChoixChauffageParams): ParamsFormDraft {
  return {
    adresse: values.adresse ?? '',
    dpe: values.dpe,
    espaceExterieur: values.espaceExterieur,
    habitantsMoyen: values.habitantsMoyen ?? '',
    modeEauChaudeSanitaire: values.modeEauChaudeSanitaire,
    nbLogements: values.nbLogements === null ? '' : String(values.nbLogements),
    surfaceMoyenne: values.surfaceMoyenne === null ? '' : String(values.surfaceMoyenne),
    typeLogement: values.typeLogement,
    typeRadiateur: values.typeRadiateur,
  };
}

export function toChoixChauffageParams(draft: ParamsFormDraft): ChoixChauffageParams {
  const normalizedHabitantsMoyen = normalizeDecimalString(draft.habitantsMoyen);
  const normalizedNbLogements = parseIntegerOrNull(draft.nbLogements);
  const normalizedSurfaceMoyenne = parseIntegerOrNull(draft.surfaceMoyenne);

  return {
    adresse: draft.adresse || null,
    dpe: draft.dpe,
    espaceExterieur: draft.espaceExterieur,
    habitantsMoyen: normalizedHabitantsMoyen || null,
    modeEauChaudeSanitaire: draft.modeEauChaudeSanitaire,
    nbLogements: normalizedNbLogements,
    surfaceMoyenne: normalizedSurfaceMoyenne,
    typeLogement: draft.typeLogement,
    typeRadiateur: draft.typeRadiateur,
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
    left.dpe === right.dpe &&
    left.espaceExterieur === right.espaceExterieur &&
    left.habitantsMoyen === right.habitantsMoyen &&
    left.modeEauChaudeSanitaire === right.modeEauChaudeSanitaire &&
    left.nbLogements === right.nbLogements &&
    left.surfaceMoyenne === right.surfaceMoyenne &&
    left.typeLogement === right.typeLogement &&
    left.typeRadiateur === right.typeRadiateur
  );
}
