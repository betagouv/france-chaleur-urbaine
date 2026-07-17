import { describe, expect, it } from 'vitest';

import { getNextEspaceExterieurQueryValue } from './useChoixChauffageQueryParams';

describe('getNextEspaceExterieurQueryValue', () => {
  it('keeps the URL outdoor space when a selected building adds a compatible housing type', () => {
    expect(
      getNextEspaceExterieurQueryValue({
        currentEspaceExterieur: 'jardinCours',
        effectiveEspaceExterieur: null,
        nextParams: {
          constructionId: 'BATIMENT-1',
          typeLogement: 'maison_individuelle',
        },
      })
    ).toStrictEqual('jardinCours');
  });

  it('removes the URL outdoor space when a selected building adds an incompatible housing type', () => {
    expect(
      getNextEspaceExterieurQueryValue({
        currentEspaceExterieur: 'jardinCours',
        effectiveEspaceExterieur: null,
        nextParams: {
          constructionId: 'BATIMENT-1',
          typeLogement: 'immeuble_chauffage_collectif',
        },
      })
    ).toStrictEqual(null);
  });

  it('uses the explicit next outdoor space when the housing type changes', () => {
    expect(
      getNextEspaceExterieurQueryValue({
        currentEspaceExterieur: 'jardinCours',
        effectiveEspaceExterieur: null,
        nextParams: {
          espaceExterieur: 'shared',
          typeLogement: 'immeuble_chauffage_collectif',
        },
      })
    ).toStrictEqual('shared');
  });
});
