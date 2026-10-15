import { act, renderHook } from '@testing-library/react';
import { createSerializer } from 'nuqs';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  getModeEauChaudeSanitaireOptions,
  MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE,
  normalizeModeEauChaudeSanitaireForTypeLogement,
} from '@/modules/chaleur-renouvelable/constants';

import { type ChoixChauffageParams, choixChauffageQueryParsers, useChoixChauffageQueryParams } from './useChoixChauffageQueryParams';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));

describe('useChoixChauffageQueryParams', () => {
  it.each([
    {
      label: 'housing type',
      outdoorSpace: 'jardinCours',
      patch: { constructionId: 'BATIMENT-1', typeLogement: 'maison_individuelle' },
      residents: '2.5',
    },
    { label: 'DPE', outdoorSpace: 'jardinCours', patch: { dpe: 'C' }, residents: '2.5' },
    {
      label: 'explicit outdoor space',
      outdoorSpace: 'terrasseBalconEtJardinCours',
      patch: { espaceExterieur: 'terrasseBalconEtJardinCours' },
      residents: '2.5',
    },
    { label: 'cleared outdoor space', outdoorSpace: null, patch: { espaceExterieur: null }, residents: '2.5' },
    { label: 'cleared residents', outdoorSpace: 'jardinCours', patch: { habitantsMoyen: null }, residents: null },
    { label: 'empty residents', outdoorSpace: 'jardinCours', patch: { habitantsMoyen: '' }, residents: null },
    { label: 'explicit residents', outdoorSpace: 'jardinCours', patch: { habitantsMoyen: '3.5' }, residents: '3.5' },
  ] satisfies {
    label: string;
    patch: Partial<ChoixChauffageParams>;
    outdoorSpace: ChoixChauffageParams['espaceExterieur'];
    residents: string | null;
  }[])('updates $label without clearing omitted simulation parameters', async ({ patch, outdoorSpace, residents }) => {
    const { result } = renderHook(() => useChoixChauffageQueryParams(), {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(NuqsTestingAdapter, {
          children,
          hasMemory: true,
          searchParams: '?espaceExterieur=jardinCours&habitantsMoyen=2.5&typeLogement=immeuble_chauffage_collectif',
        }),
    });
    await act(async () => {
      await result.current.setParams(patch);
    });
    expect({ outdoorSpace: result.current.params.espaceExterieur, residents: result.current.params.habitantsMoyen }).toStrictEqual({
      outdoorSpace,
      residents,
    });
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
  it.each([
    ['5', null],
    ['8', null],
    ['0', null],
    ['-1', null],
    ['invalid', null],
    ['9', 9],
    ['60', 60],
  ])('validates the average housing area in shared links: %s', (value, expected) => {
    expect(choixChauffageQueryParsers.surfaceMoyenne.parse(String(value))).toStrictEqual(expected);
  });

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
