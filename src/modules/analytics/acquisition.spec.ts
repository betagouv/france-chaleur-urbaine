import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAcquisitionSource, zAcquisition } from './constants';

beforeEach(() => {
  vi.resetModules();
  window.history.replaceState({}, '', '/');
});

describe('acquisition attribution', () => {
  it('retains a tagged arrival across navigation and replaces it on a new tagged arrival', async () => {
    const { getAcquisition } = await import('./acquisition');
    window.history.replaceState({}, '', '/?utm_source=google&utm_medium=cpc&utm_campaign=chauffage');
    expect(getAcquisition()).toStrictEqual({ campaign: 'chauffage', medium: 'cpc', source: 'google' });

    window.history.replaceState({}, '', '/chaleur-renouvelable/resultat?adresse=private');
    expect(getAcquisition()).toStrictEqual({ campaign: 'chauffage', medium: 'cpc', source: 'google' });

    window.history.replaceState({}, '', '/?utm_source=newsletter&utm_campaign=automne');
    expect(getAcquisition()).toStrictEqual({ campaign: 'automne', medium: null, source: 'newsletter' });
  });

  it.each(['gclid', 'gbraid', 'wbraid'])('identifies Google Ads from %s without retaining the click identifier', async (parameter) => {
    const { getAcquisition } = await import('./acquisition');
    window.history.replaceState({}, '', `/?${parameter}=private-click-id&utm_campaign=chauffage`);
    const acquisition = getAcquisition();
    expect(acquisition).toStrictEqual({ campaign: 'chauffage', medium: 'cpc', source: 'google' });
    expect(acquisition && getAcquisitionSource(acquisition)).toStrictEqual('Google Ads');
  });

  it.each(['/', '/?source=partner', '/?gclid=', '/admin?utm_source=google', '/iframe/carte?utm_source=google'])(
    'does not infer a marketing campaign from %s',
    async (path) => {
      const { getAcquisition } = await import('./acquisition');
      window.history.replaceState({}, '', path);
      expect(getAcquisition()).toBeNull();
    }
  );

  it('bounds parameters before sending them to the API', async () => {
    const { getAcquisition } = await import('./acquisition');
    window.history.replaceState({}, '', `/?utm_source=${'a'.repeat(201)}`);
    expect(getAcquisition()).toStrictEqual({ campaign: null, medium: null, source: 'a'.repeat(200) });
    expect(zAcquisition.safeParse({ campaign: null, medium: null, source: 'a'.repeat(201) }).success).toStrictEqual(false);
  });

  it.each([
    [{ campaign: null, medium: 'cpc', source: 'Google' }, 'Google Ads'],
    [{ campaign: null, medium: 'ppc', source: 'google' }, 'Google Ads'],
    [{ campaign: null, medium: 'organic', source: 'google' }, 'google'],
    [{ campaign: null, medium: null, source: 'newsletter' }, 'newsletter'],
  ])('labels acquisition %j as %s', (acquisition, expected) => {
    expect(getAcquisitionSource(acquisition)).toStrictEqual(expected);
  });
});
