import { describe, expect, it } from 'vitest';

import { areParamsFormDraftsEqual, getParamsFormCompletion, type ParamsFormDraft, toChoixChauffageParamsPatch } from './params-form-draft';

const baseDraft = {
  adresse: '1 rue de la Paix 75002 Paris',
  constructionId: 'BATIMENT-1',
  dpe: 'E',
  espaceExterieur: 'none',
  habitantsMoyen: '2',
  isDpeExplicit: true,
  isModeEauChaudeSanitaireInferred: false,
  modeEauChaudeSanitaire: 'Collectif',
  nbLogements: '25',
  surfaceMoyenne: '70',
  typeLogement: 'immeuble_chauffage_collectif',
  typeRadiateur: 'radiateur-eau',
} satisfies ParamsFormDraft;

describe('params form draft', () => {
  it('detects a selected building change', () => {
    expect(
      areParamsFormDraftsEqual(baseDraft, {
        ...baseDraft,
        constructionId: 'BATIMENT-2',
      })
    ).toStrictEqual(false);
  });

  it('counts incomplete fields without blocking draft conversion', () => {
    expect(
      getParamsFormCompletion({
        ...baseDraft,
        dpe: 'E',
        habitantsMoyen: '',
        isDpeExplicit: false,
        nbLogements: '',
        surfaceMoyenne: '',
      })
    ).toMatchObject({
      incompleteCount: 4,
      isDpeIncomplete: true,
      isHabitantsMoyenIncomplete: true,
      isNbLogementsIncomplete: true,
      isSurfaceMoyenneIncomplete: true,
    });
  });

  it('considers default DPE as complete when it has been explicitly selected', () => {
    expect(
      getParamsFormCompletion({
        ...baseDraft,
        dpe: 'E',
        isDpeExplicit: true,
      })
    ).toMatchObject({
      incompleteCount: 0,
      isDpeIncomplete: false,
    });
  });

  it('counts hot water mode as incomplete when it is inferred from housing type', () => {
    expect(
      getParamsFormCompletion({
        ...baseDraft,
        isModeEauChaudeSanitaireInferred: true,
        modeEauChaudeSanitaire: 'Collectif',
      })
    ).toMatchObject({
      incompleteCount: 1,
      isModeEauChaudeSanitaireIncomplete: true,
    });
  });

  it('does not submit implicit DPE and inferred hot water mode as explicit query params', () => {
    const submittedParams = toChoixChauffageParamsPatch({
      ...baseDraft,
      isDpeExplicit: false,
      isModeEauChaudeSanitaireInferred: true,
    });

    expect(submittedParams).not.toHaveProperty('dpe');
    expect(submittedParams).not.toHaveProperty('modeEauChaudeSanitaire');
  });
});
