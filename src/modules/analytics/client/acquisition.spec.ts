import { beforeEach, describe, expect, it, vi } from 'vitest';

import { zAcquisition } from '../constants';

beforeEach(() => {
  vi.resetModules();
  window.history.replaceState({}, '', '/');
  vi.spyOn(document, 'referrer', 'get').mockReturnValue('');
});

const snapshot = {
  campaign: null,
  formPage: '/',
  inIframe: false,
  landingPage: '/',
  medium: null,
  referrer: undefined,
  source: null,
};

describe('acquisition attribution', () => {
  it('retains the external domain and landing page across navigation', async () => {
    const { getAcquisition } = await import('./acquisition');
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('https://france-renov.gouv.fr/private?email=private#secret');
    window.history.replaceState({}, '', '/carte?adresse=private');
    expect(getAcquisition()).toStrictEqual({ ...snapshot, formPage: '/carte', landingPage: '/carte', referrer: 'france-renov.gouv.fr' });
    window.history.replaceState({}, '', '/contact');
    expect(getAcquisition()).toStrictEqual({ ...snapshot, formPage: '/contact', landingPage: '/carte', referrer: 'france-renov.gouv.fr' });
  });

  it('replaces the campaign on a new UTM arrival and retains it across navigation', async () => {
    const { getAcquisition } = await import('./acquisition');
    window.history.replaceState({}, '', '/?utm_source=newsletter&utm_medium=email&utm_campaign=automne&utm_term=chauffage');
    expect(getAcquisition()).toStrictEqual({
      ...snapshot,
      campaign: 'automne',
      keyword: 'chauffage',
      medium: 'email',
      source: 'newsletter',
    });
    window.history.replaceState({}, '', '/?utm_source=google&utm_medium=cpc&utm_term=bois');
    expect(getAcquisition()).toStrictEqual({ ...snapshot, keyword: 'bois', medium: 'cpc', source: 'google' });
    window.history.replaceState({}, '', '/contact');
    expect(getAcquisition()).toStrictEqual({ ...snapshot, formPage: '/contact', keyword: 'bois', medium: 'cpc', source: 'google' });
  });

  it.each(['gclid', 'gbraid', 'wbraid'])('identifies Google Ads from %s without retaining the click identifier', async (parameter) => {
    const { getAcquisition } = await import('./acquisition');
    window.history.replaceState({}, '', `/?${parameter}=private-click-id&utm_campaign=chauffage`);
    const acquisition = getAcquisition();
    expect(acquisition).toStrictEqual({ ...snapshot, campaign: 'chauffage', medium: 'cpc', source: 'google' });
  });

  it('captures the integration without treating source as a campaign and retains it after navigation', async () => {
    const { getAcquisition } = await import('./acquisition');
    window.history.replaceState({}, '', '/?source=partner&host=example.com%2Fembed%3Fprivate');
    getAcquisition();
    window.history.replaceState({}, '', '/contact');
    expect(getAcquisition()).toStrictEqual({ ...snapshot, formPage: '/contact', host: 'example.com/embed', integrationId: 'partner' });
  });

  it('keeps the original landing page when the same tagged URL is read again', async () => {
    const { getAcquisition } = await import('./acquisition');
    window.history.replaceState({}, '', '/carte?utm_source=google');
    const first = getAcquisition();
    expect(getAcquisition()).toStrictEqual(first);
  });

  it('forgets attribution after a fresh module load, like a reload or independent tab', async () => {
    const first = await import('./acquisition');
    window.history.replaceState({}, '', '/?utm_source=google');
    first.getAcquisition();
    vi.resetModules();
    window.history.replaceState({}, '', '/contact');
    const fresh = await import('./acquisition');
    expect(fresh.getAcquisition()).toStrictEqual({ ...snapshot, formPage: '/contact', landingPage: '/contact' });
  });

  it.each(['', 'invalid', 'javascript:private', `${window.location.origin}/internal?private`])(
    'ignores unavailable or internal referrer %s',
    async (referrer) => {
      const { getAcquisition } = await import('./acquisition');
      vi.spyOn(document, 'referrer', 'get').mockReturnValue(referrer);
      expect(getAcquisition()).toStrictEqual(snapshot);
    }
  );

  it('excludes admin pages', async () => {
    const { getAcquisition } = await import('./acquisition');
    window.history.replaceState({}, '', '/admin?utm_source=google');
    expect(getAcquisition()).toBeNull();
  });

  it('bounds parameters and rejects personal URL query strings at the API boundary', async () => {
    const { getAcquisition } = await import('./acquisition');
    window.history.replaceState({}, '', `/?utm_source=${'a'.repeat(201)}`);
    expect(getAcquisition()).toStrictEqual({ ...snapshot, source: 'a'.repeat(200) });
    expect(zAcquisition.safeParse({ ...snapshot, source: 'a'.repeat(201) }).success).toStrictEqual(false);
    expect(zAcquisition.safeParse({ ...snapshot, landingPage: '/?email=private' }).success).toStrictEqual(false);
    expect(zAcquisition.safeParse({ ...snapshot, referrer: 'https://example.com/private' }).success).toStrictEqual(false);
  });
});
