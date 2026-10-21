import { describe, expect, it } from 'vitest';

import type { Scenario } from './scenario-model';
import { type ComparateurUrlState, decodeComparateurUrlState, encodeComparateurUrlState } from './url-state';

const knownRules = new Set(['bâtiment . nombre de logements', 'combustibles . gaz . coût de la molécule HT', 'bâtiment . DPE']);

const scenario = (id: string, overrides: Partial<Scenario> = {}): Scenario => ({
  id,
  label: 'Gaz à condensation collectif',
  mode: 'gaz coll avec cond',
  overrides: {},
  ...overrides,
});

const state: ComparateurUrlState = {
  address: '20 avenue de Ségur 75007 Paris',
  baseInputs: { 'bâtiment . DPE': "'D'", 'bâtiment . nombre de logements': 40 },
  scenarios: [
    scenario('a'),
    scenario('b', { label: 'Gaz, molécule +30 %', overrides: { 'combustibles . gaz . coût de la molécule HT': 0.056 } }),
  ],
};

describe('comparateur url state', () => {
  it('round-trips the address, the inputs and the scenarios (ids are regenerated, default labels are not stored)', async () => {
    const encoded = await encodeComparateurUrlState(state);

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeComparateurUrlState(encoded, knownRules)).toStrictEqual({
      state: {
        ...state,
        scenarios: [
          { ...state.scenarios[0], id: 'url-0' },
          { ...state.scenarios[1], id: 'url-1' },
        ],
      },
      unknownRules: [],
    });
  });

  it('drops null overrides and the address when absent', async () => {
    const encoded = await encodeComparateurUrlState({
      address: null,
      baseInputs: {},
      scenarios: [scenario('a', { overrides: { 'combustibles . gaz . coût de la molécule HT': null } })],
    });

    expect(await decodeComparateurUrlState(encoded, knownRules)).toStrictEqual({
      state: { address: null, baseInputs: {}, scenarios: [{ ...scenario('url-0') }] },
      unknownRules: [],
    });
  });

  it('ignores and reports rules and modes unknown to the current model', async () => {
    const encoded = await encodeComparateurUrlState({
      address: null,
      baseInputs: { 'bâtiment . ancienne règle': 1, 'bâtiment . nombre de logements': 40 } as never,
      scenarios: [
        scenario('a', { overrides: { 'combustibles . gaz . prix renommé': 0.1 } as never }),
        { ...scenario('b'), mode: 'mode disparu' as never },
      ],
    });

    expect(await decodeComparateurUrlState(encoded, knownRules)).toStrictEqual({
      state: { address: null, baseInputs: { 'bâtiment . nombre de logements': 40 }, scenarios: [scenario('url-0')] },
      unknownRules: ['combustibles . gaz . prix renommé', 'mode disparu', 'bâtiment . ancienne règle'],
    });
  });

  it.each([
    ['garbage', 'not-a-token'],
    ['empty', ''],
  ])('returns null on a %s token', async (_, token) => {
    expect(await decodeComparateurUrlState(token, knownRules)).toStrictEqual(null);
  });
});
