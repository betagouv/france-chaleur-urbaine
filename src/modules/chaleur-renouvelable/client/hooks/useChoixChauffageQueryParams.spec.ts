import { createSerializer } from 'nuqs';
import { describe, expect, it } from 'vitest';

import {
  getModeEauChaudeSanitaireOptions,
  MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE,
  normalizeModeEauChaudeSanitaireForTypeLogement,
} from '@/modules/chaleur-renouvelable/constants';

import { choixChauffageQueryParsers, getNextEspaceExterieurQueryValue } from './useChoixChauffageQueryParams';

describe('getNextEspaceExterieurQueryValue', () => {
  it('keeps an explicit outdoor space update without requiring a housing type', () => {
    expect(
      getNextEspaceExterieurQueryValue({
        currentEspaceExterieur: null,
        effectiveEspaceExterieur: null,
        nextParams: {
          espaceExterieur: 'jardinCours',
        },
      })
    ).toStrictEqual('jardinCours');
  });

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

  it('keeps the garden/courtyard outdoor space when a selected building adds another housing type', () => {
    expect(
      getNextEspaceExterieurQueryValue({
        currentEspaceExterieur: 'jardinCours',
        effectiveEspaceExterieur: null,
        nextParams: {
          constructionId: 'BATIMENT-1',
          typeLogement: 'immeuble_chauffage_collectif',
        },
      })
    ).toStrictEqual('jardinCours');
  });

  it('uses the explicit next outdoor space when the housing type changes', () => {
    expect(
      getNextEspaceExterieurQueryValue({
        currentEspaceExterieur: 'jardinCours',
        effectiveEspaceExterieur: null,
        nextParams: {
          espaceExterieur: 'jardinCours',
          typeLogement: 'immeuble_chauffage_collectif',
        },
      })
    ).toStrictEqual('jardinCours');
  });

  it('keeps the combined outdoor space when the housing type changes', () => {
    expect(
      getNextEspaceExterieurQueryValue({
        currentEspaceExterieur: 'terrasseBalconEtJardinCours',
        effectiveEspaceExterieur: null,
        nextParams: {
          constructionId: 'BATIMENT-1',
          typeLogement: 'maison_individuelle',
        },
      })
    ).toStrictEqual('terrasseBalconEtJardinCours');
  });
});

describe('mode eau chaude sanitaire par type de logement', () => {
  it('returns house hot water options only for individual houses', () => {
    expect(getModeEauChaudeSanitaireOptions('maison_individuelle')).toStrictEqual([
      { label: 'Couplé au chauffage', value: 'Couplé au chauffage' },
      { label: 'Indépendant', value: 'Indépendant' },
    ]);
  });

  it('keeps building hot water options for apartment buildings', () => {
    expect(getModeEauChaudeSanitaireOptions('immeuble_chauffage_collectif')).toStrictEqual([
      { label: 'Individuel', value: 'Individuel' },
      { label: 'Collectif', value: 'Collectif' },
    ]);
  });

  it.each([
    ['Collectif', 'maison_individuelle'],
    ['Individuel', 'maison_individuelle'],
    ['Couplé au chauffage', 'immeuble_chauffage_collectif'],
    ['Indépendant', 'immeuble_chauffage_collectif'],
  ] as const)('resets incompatible hot water value %s for %s', (modeEauChaudeSanitaire, typeLogement) => {
    expect(normalizeModeEauChaudeSanitaireForTypeLogement(modeEauChaudeSanitaire, typeLogement)).toStrictEqual(
      MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE
    );
  });
});

describe('choixChauffageQueryParsers', () => {
  it('keeps DPE E in URL when it is explicitly submitted', () => {
    const serializeChoixChauffageQueryParams = createSerializer(choixChauffageQueryParsers);

    expect(serializeChoixChauffageQueryParams({ dpe: 'E' })).toStrictEqual('?dpe=E');
  });

  it('serializes the origin demand id used by the non-realizable email flow', () => {
    const serializeChoixChauffageQueryParams = createSerializer(choixChauffageQueryParsers);

    expect(serializeChoixChauffageQueryParams({ originDemandId: '00000000-0000-4000-8000-000000000301' })).toStrictEqual(
      '?originDemandId=00000000-0000-4000-8000-000000000301'
    );
  });
});
