// @vitest-environment-options {"settings":{"handleDisabledFileLoadingAsSuccess":true}}
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uuid } from '@/tests/helpers';

const mocks = vi.hoisted(() => ({ consent: false, containerId: 'GTM-TEST123' }));
vi.mock('@/components/ConsentBanner', () => ({ useConsent: () => ({ finalityConsent: { google_ads: mocks.consent } }) }));
vi.mock('@/client-config', () => ({
  clientConfig: {
    tracking: {
      get googleTagManagerId() {
        return mocks.containerId;
      },
    },
  },
}));

type TrackingWindow = Window & { dataLayer?: unknown[] };

const getConversionEvents = () =>
  (window as TrackingWindow).dataLayer?.filter((entry) => typeof entry === 'object' && entry !== null && 'event_id' in entry) ?? [];

const getGoogleCommands = () =>
  (window as TrackingWindow).dataLayer
    ?.filter((entry): entry is IArguments => Object.prototype.toString.call(entry) === '[object Arguments]')
    .map((entry) => Array.from(entry)) ?? [];

beforeEach(() => {
  vi.resetModules();
  mocks.consent = false;
  mocks.containerId = 'GTM-TEST123';
  (window as TrackingWindow).dataLayer = [];
  document.getElementById('multienr-google-tag-manager')?.remove();
  window.history.replaceState({}, '', '/chaleur-renouvelable/resultat?adresse=private-address&email=private-email#contact');
});

describe('multi-energy Google conversions', () => {
  it('does not queue an event before consent, then records it once after consent', async () => {
    const { useMultiEnrConversion } = await import('./useMultiEnrConversion');
    const conversion = { event: 'multienr_simulation_completed', simulation_id: uuid(1) } as const;
    const { result, rerender } = renderHook(() => useMultiEnrConversion());
    result.current(conversion);
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);

    mocks.consent = true;
    rerender();
    result.current(conversion);
    result.current(conversion);

    expect(getConversionEvents()).toStrictEqual([
      {
        ...conversion,
        event_id: `multienr_simulation_completed:${uuid(1)}`,
        page_location: `${window.location.origin}/chaleur-renouvelable/resultat`,
        page_referrer: '',
      },
    ]);
  });

  it('stops recording events after consent is withdrawn', async () => {
    const { useMultiEnrConversion } = await import('./useMultiEnrConversion');
    mocks.consent = true;
    const { result, rerender } = renderHook(() => useMultiEnrConversion());
    mocks.consent = false;
    rerender();
    result.current({ demand_id: uuid(2), demand_type: 'ccrt', event: 'multienr_accompaniment_submitted', simulation_id: uuid(3) });
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);
  });

  it('does not track without a configured container', async () => {
    const { useMultiEnrConversion } = await import('./useMultiEnrConversion');
    mocks.containerId = '';
    mocks.consent = true;
    const { result } = renderHook(() => useMultiEnrConversion());
    result.current({ event: 'multienr_simulation_completed', simulation_id: uuid(4) });
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);
  });

  it.each(['/iframe', '/iframe/test', '/admin', '/admin/chaleur-renouvelable'])('does not track on %s', async (pathname) => {
    const { useMultiEnrConversion } = await import('./useMultiEnrConversion');
    window.history.replaceState({}, '', pathname);
    mocks.consent = true;
    const { result } = renderHook(() => useMultiEnrConversion());
    result.current({ event: 'multienr_simulation_completed', simulation_id: uuid(5) });
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);
  });

  it('deduplicates successful submissions by demand, independently of the simulation', async () => {
    const { useMultiEnrConversion } = await import('./useMultiEnrConversion');
    mocks.consent = true;
    const { result } = renderHook(() => useMultiEnrConversion());
    result.current({ demand_id: uuid(6), demand_type: 'ccrt', event: 'multienr_accompaniment_submitted', simulation_id: uuid(7) });
    result.current({ demand_id: uuid(6), demand_type: 'ccrt', event: 'multienr_accompaniment_submitted', simulation_id: uuid(8) });
    expect(getConversionEvents()).toStrictEqual([
      {
        demand_id: uuid(6),
        demand_type: 'ccrt',
        event: 'multienr_accompaniment_submitted',
        event_id: `multienr_accompaniment_submitted:${uuid(6)}`,
        page_location: `${window.location.origin}/chaleur-renouvelable/resultat`,
        page_referrer: '',
        simulation_id: uuid(7),
      },
    ]);
  });
});

describe('GTM loader and consent', () => {
  it('queues denied defaults before granting advertising consent and loading the container once', async () => {
    const { loadGoogleTagManager } = await import('./google-tag-manager');
    loadGoogleTagManager('GTM-TEST123');
    loadGoogleTagManager('GTM-TEST123');
    expect(Array.from(document.querySelectorAll('#multienr-google-tag-manager')).map((script) => script.getAttribute('src'))).toStrictEqual(
      ['https://www.googletagmanager.com/gtm.js?id=GTM-TEST123']
    );
    expect((window as TrackingWindow).dataLayer?.slice(-1)).toStrictEqual([{ event: 'gtm.js', 'gtm.start': expect.any(Number) }]);
    expect(getGoogleCommands().slice(0, 2)).toStrictEqual([
      ['consent', 'default', { ad_personalization: 'denied', ad_storage: 'denied', ad_user_data: 'denied', analytics_storage: 'denied' }],
      ['consent', 'update', { ad_personalization: 'denied', ad_storage: 'granted', ad_user_data: 'granted', analytics_storage: 'denied' }],
    ]);
  });

  it.each(['', '/admin', '/iframe/carte'])('does not load a missing container or an excluded route (%s)', async (value) => {
    const { loadGoogleTagManager } = await import('./google-tag-manager');
    if (value) {
      window.history.replaceState({}, '', value);
    }
    loadGoogleTagManager(value ? 'GTM-TEST123' : '');
    expect(document.getElementById('multienr-google-tag-manager')).toBeNull();
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);
  });

  it('queues nothing on initial refusal, deduplicates consent changes and reports withdrawal', async () => {
    const { setGoogleConsent } = await import('./google-tag-manager');
    setGoogleConsent(false);
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);
    setGoogleConsent(true);
    setGoogleConsent(true);
    setGoogleConsent(false);
    setGoogleConsent(false);
    expect(getGoogleCommands()).toStrictEqual([
      ['consent', 'default', { ad_personalization: 'denied', ad_storage: 'denied', ad_user_data: 'denied', analytics_storage: 'denied' }],
      ['consent', 'update', { ad_personalization: 'denied', ad_storage: 'granted', ad_user_data: 'granted', analytics_storage: 'denied' }],
      ['consent', 'update', { ad_personalization: 'denied', ad_storage: 'denied', ad_user_data: 'denied', analytics_storage: 'denied' }],
    ]);
  });
});

describe('Google URL parameters', () => {
  it('preserves allowlisted attribution and removes simulator/contact data from page and referrer URLs', async () => {
    const { getGooglePageParameters, updateGooglePageParameters } = await import('./google-tag-manager');
    window.history.replaceState(
      {},
      '',
      '/chaleur-renouvelable/resultat?utm_source=google&utm_medium=cpc&utm_campaign=automne&gclid=click&adresse=private&email=secret&originDemandId=private#contact'
    );
    const referrer = vi
      .spyOn(document, 'referrer', 'get')
      .mockReturnValue('https://example.com/results?utm_source=newsletter&adresse=private#contact');
    expect(getGooglePageParameters()).toStrictEqual({
      page_location: `${window.location.origin}/chaleur-renouvelable/resultat?utm_source=google&utm_medium=cpc&utm_campaign=automne&gclid=click`,
      page_referrer: 'https://example.com/results?utm_source=newsletter',
    });
    window.history.replaceState({}, '', '/contact?email=private');
    updateGooglePageParameters();
    expect(getGoogleCommands()).toStrictEqual([
      ['set', { page_location: `${window.location.origin}/contact`, page_referrer: 'https://example.com/results?utm_source=newsletter' }],
    ]);
    referrer.mockRestore();
  });
});
