import { beforeEach, describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { getConversionSource, getDemandOrigin, getTrackingContext } from './trackingContext';

const setURL = (url: string) => (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(url);

describe('getConversionSource', () => {
  beforeEach(() => {
    setURL('https://france-chaleur-urbaine.beta.gouv.fr/');
  });

  const cases: TestCase<string, string | null>[] = [
    { expectedOutput: null, input: 'https://france-chaleur-urbaine.beta.gouv.fr/', label: 'URL sans `?source=` → null' },
    { expectedOutput: 'engie', input: 'https://france-chaleur-urbaine.beta.gouv.fr/?source=engie&address=x', label: '`?source=` → valeur' },
    { expectedOutput: null, input: 'https://france-chaleur-urbaine.beta.gouv.fr/?source=', label: '`?source=` vide → null' },
    { expectedOutput: null, input: 'https://france-chaleur-urbaine.beta.gouv.fr/?source=%20%20', label: '`?source=` blanc → null' },
  ];
  it.each(cases)('$label', ({ input, expectedOutput }) => {
    setURL(input);
    expect(getConversionSource()).toStrictEqual(expectedOutput);
  });

  it('ne survit pas à une navigation (aucune persistance — attribution à l’atterrissage uniquement)', () => {
    setURL('https://france-chaleur-urbaine.beta.gouv.fr/?source=engie');
    expect(getConversionSource()).toStrictEqual('engie');

    setURL('https://france-chaleur-urbaine.beta.gouv.fr/carte');
    expect(getConversionSource()).toStrictEqual(null);
  });
});

describe('getTrackingContext', () => {
  it('hors iframe, lit le `?host=` de l’URL (propagé par /iframe/form), normalisé en domaine + pathname', () => {
    setURL('https://france-chaleur-urbaine.beta.gouv.fr/?source=engie&host=https%3A%2F%2Fengie.fr%2Fchauffage%3Futm%3Dx');
    expect(getTrackingContext()).toStrictEqual({ host: 'engie.fr/chauffage', inIframe: false });
  });

  it('garde telle quelle une valeur `?host=` déjà normalisée (sans protocole)', () => {
    setURL('https://france-chaleur-urbaine.beta.gouv.fr/?host=engie.fr%2Fchauffage');
    expect(getTrackingContext()).toStrictEqual({ host: 'engie.fr/chauffage', inIframe: false });
  });

  it('hors iframe sans `?host=` → host undefined', () => {
    setURL('https://france-chaleur-urbaine.beta.gouv.fr/carte');
    expect(getTrackingContext()).toStrictEqual({ host: undefined, inIframe: false });
  });
});

describe('getDemandOrigin', () => {
  it('attribue la demande à la source de l’URL et au pathname (atterrissage post-redirection de /iframe/form)', () => {
    setURL('https://france-chaleur-urbaine.beta.gouv.fr/?source=engie&address=x');
    expect(getDemandOrigin()).toStrictEqual({ origin_page: '/', origin_source: 'engie' });
  });

  it('sans `?source=`, ne pose que le pathname', () => {
    setURL('https://france-chaleur-urbaine.beta.gouv.fr/villes/paris');
    expect(getDemandOrigin()).toStrictEqual({ origin_page: '/villes/paris', origin_source: undefined });
  });

  it('vide sur une page admin (preview du générateur)', () => {
    setURL('https://france-chaleur-urbaine.beta.gouv.fr/admin/iframes');
    expect(getDemandOrigin()).toStrictEqual({});
  });
});
