// @vitest-environment-options {"settings":{"handleDisabledFileLoadingAsSuccess":true}}
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uuid } from '@/tests/helpers';

import { loadGoogleTagManager } from './google-tag-manager';
import { useMultiEnrConversion } from './useMultiEnrConversion';

const mocks = vi.hoisted(() => ({ consent: false, containerId: 'GTM-TEST123' }));
vi.mock('@/components/ConsentBanner', () => ({ useConsent: () => ({ finalityConsent: { google_analytics: mocks.consent } }) }));
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

beforeEach(() => {
  mocks.consent = false;
  mocks.containerId = 'GTM-TEST123';
  (window as TrackingWindow).dataLayer = [];
  document.getElementById('multienr-google-tag-manager')?.remove();
  window.history.replaceState({}, '', '/chaleur-renouvelable/resultat?adresse=private-address&email=private-email#contact');
});

describe('multi-energy Google conversions', () => {
  it('does not queue an event before consent, then records it once after consent', () => {
    const conversion = { event: 'multienr_simulation_completed', simulation_id: uuid(1) } as const;
    const { result, rerender } = renderHook(() => useMultiEnrConversion());
    result.current(conversion);
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);

    mocks.consent = true;
    rerender();
    result.current(conversion);
    result.current(conversion);

    expect((window as TrackingWindow).dataLayer).toStrictEqual([
      {
        ...conversion,
        event_id: `multienr_simulation_completed:${uuid(1)}`,
        page_location: `${window.location.origin}/chaleur-renouvelable/resultat`,
      },
    ]);
  });

  it('stops recording events after consent is withdrawn', () => {
    mocks.consent = true;
    const { result, rerender } = renderHook(() => useMultiEnrConversion());
    mocks.consent = false;
    rerender();
    result.current({ demand_id: uuid(2), demand_type: 'ccrt', event: 'multienr_accompaniment_submitted', simulation_id: uuid(3) });
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);
  });

  it.each(['', 'invalid-container-id'])('does not track without a valid configured container (%s)', (containerId) => {
    mocks.containerId = containerId;
    mocks.consent = true;
    const { result } = renderHook(() => useMultiEnrConversion());
    result.current({ event: 'multienr_simulation_completed', simulation_id: uuid(4) });
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);
  });

  it.each(['/iframe/test', '/admin/chaleur-renouvelable'])('does not track on %s', (pathname) => {
    window.history.replaceState({}, '', pathname);
    mocks.consent = true;
    const { result } = renderHook(() => useMultiEnrConversion());
    result.current({ event: 'multienr_simulation_completed', simulation_id: uuid(5) });
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);
  });

  it('deduplicates successful submissions by demand, independently of the simulation', () => {
    mocks.consent = true;
    const { result } = renderHook(() => useMultiEnrConversion());
    result.current({ demand_id: uuid(6), demand_type: 'ccrt', event: 'multienr_accompaniment_submitted', simulation_id: uuid(7) });
    result.current({ demand_id: uuid(6), demand_type: 'ccrt', event: 'multienr_accompaniment_submitted', simulation_id: uuid(8) });
    expect((window as TrackingWindow).dataLayer).toStrictEqual([
      {
        demand_id: uuid(6),
        demand_type: 'ccrt',
        event: 'multienr_accompaniment_submitted',
        event_id: `multienr_accompaniment_submitted:${uuid(6)}`,
        page_location: `${window.location.origin}/chaleur-renouvelable/resultat`,
        simulation_id: uuid(7),
      },
    ]);
  });
});

describe('GTM loader', () => {
  it('starts and loads the container once across repeated mounts', () => {
    loadGoogleTagManager('GTM-TEST123');
    loadGoogleTagManager('GTM-TEST123');
    expect(Array.from(document.querySelectorAll('#multienr-google-tag-manager')).map((script) => script.getAttribute('src'))).toStrictEqual(
      ['https://www.googletagmanager.com/gtm.js?id=GTM-TEST123']
    );
    expect((window as TrackingWindow).dataLayer).toStrictEqual([{ event: 'gtm.js', 'gtm.start': expect.any(Number) }]);
  });

  it('does not load an invalid container', () => {
    loadGoogleTagManager('invalid');
    expect(document.getElementById('multienr-google-tag-manager')).toBeNull();
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);
  });
});
