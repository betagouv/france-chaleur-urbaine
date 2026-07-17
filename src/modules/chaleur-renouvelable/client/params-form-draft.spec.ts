import { describe, expect, it } from 'vitest';

import { areParamsFormDraftsEqual, type ParamsFormDraft } from './params-form-draft';

const baseDraft = {
  adresse: '1 rue de la Paix 75002 Paris',
  constructionId: 'BATIMENT-1',
  dpe: 'E',
  espaceExterieur: 'none',
  habitantsMoyen: '2',
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
});
