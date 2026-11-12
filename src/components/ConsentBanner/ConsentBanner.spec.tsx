// @vitest-environment-options {"settings":{"handleDisabledFileLoadingAsSuccess":true}}
import type { createConsentManagement } from '@codegouvfr/react-dsfr/consentManagement';
import { render, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  asPath: '/',
  beforeHistoryChange: undefined as ((url: string) => void) | undefined,
  consent: false,
  consentCallback: undefined as Parameters<typeof createConsentManagement>[0]['consentCallback'],
  events: { emit: vi.fn(), off: vi.fn(), on: vi.fn() },
  finalityDescription: undefined as Parameters<typeof createConsentManagement>[0]['finalityDescription'] | undefined,
}));

vi.mock('@codegouvfr/react-dsfr/consentManagement', () => ({
  createConsentManagement: (config: Parameters<typeof createConsentManagement>[0]) => {
    mocks.consentCallback = config.consentCallback;
    mocks.finalityDescription = config.finalityDescription;
    return {
      ConsentBannerAndConsentManagement: () => null,
      useConsent: () => ({ finalityConsent: { google_ads: mocks.consent } }),
    };
  },
}));
vi.mock('next/router', () => ({
  useRouter: () => ({ asPath: mocks.asPath, events: mocks.events, pathname: mocks.asPath.split('?')[0] }),
}));
vi.mock('@/client-config', () => ({
  clientConfig: { tracking: { googleTagManagerId: 'GTM-TEST123' } },
}));
vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: vi.fn() }));
vi.mock('./usePostHog', () => ({ usePostHog: vi.fn() }));

type TrackingWindow = Window & { dataLayer?: unknown[] };
const getGoogleCommands = () =>
  (window as TrackingWindow).dataLayer
    ?.filter((entry): entry is IArguments => Object.prototype.toString.call(entry) === '[object Arguments]')
    .map((entry) => Array.from(entry)) ?? [];

beforeEach(() => {
  vi.resetModules();
  mocks.consent = false;
  mocks.asPath = '/';
  mocks.beforeHistoryChange = undefined;
  mocks.events.on.mockImplementation((event: string, handler: (url: string) => void) => {
    if (event === 'beforeHistoryChange') {
      mocks.beforeHistoryChange = handler;
    }
  });
  (window as TrackingWindow).dataLayer = [];
  document.getElementById('multienr-google-tag-manager')?.remove();
  window.history.replaceState({}, '', '/');
});

describe('Google consent banner integration', () => {
  it('loads only GTM after explicit advertising consent', async () => {
    const { ConsentBanner } = await import('.');
    const { rerender } = render(<ConsentBanner />);
    expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(0);
    expect((window as TrackingWindow).dataLayer).toStrictEqual([]);
    mocks.consent = true;
    rerender(<ConsentBanner />);
    expect(
      Array.from(document.querySelectorAll('script[src*="googletagmanager.com"]')).map((script) => script.getAttribute('src'))
    ).toStrictEqual(['https://www.googletagmanager.com/gtm.js?id=GTM-TEST123']);
  });

  it('requires a fresh choice even when the legacy Analytics purpose had full consent', async () => {
    localStorage.setItem(
      '@codegouvfr/react-dsfr finalityConsent google_analytics',
      JSON.stringify({ google_analytics: true, isFullConsent: true })
    );
    await import('.');
    const actual = await vi.importActual<typeof import('@codegouvfr/react-dsfr/consentManagement')>(
      '@codegouvfr/react-dsfr/consentManagement'
    );
    const { useConsent } = actual.createConsentManagement({
      finalityDescription: mocks.finalityDescription!,
      personalDataPolicyLinkProps: { href: '/politique-de-confidentialite' },
    });
    const { result } = renderHook(() => useConsent());
    expect(result.current.finalityConsent).toStrictEqual(undefined);
    expect(typeof mocks.finalityDescription === 'function' && mocks.finalityDescription({ lang: 'fr' })).toStrictEqual({
      google_ads: { description: 'Mesure des conversions publicitaires', title: 'Google Ads' },
    });
  });

  it('preserves first refusal and partial PostHog choices; reloads only after Google withdrawal', async () => {
    await import('.');
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const consentCallback = mocks.consentCallback!;
    const denied = { google_ads: false, isFullConsent: false, posthog: false };
    await consentCallback({ finalityConsent: denied, finalityConsent_prev: undefined });
    expect(reload).not.toHaveBeenCalled();
    expect(getGoogleCommands()).toStrictEqual([]);

    const accepted = { google_ads: true, isFullConsent: false, posthog: false };
    await consentCallback({ finalityConsent: accepted, finalityConsent_prev: denied });
    await consentCallback({ finalityConsent: { ...accepted, posthog: true }, finalityConsent_prev: accepted });
    expect(reload).not.toHaveBeenCalled();
    await consentCallback({ finalityConsent: denied, finalityConsent_prev: accepted });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(getGoogleCommands().at(-1)).toStrictEqual([
      'consent',
      'update',
      { ad_personalization: 'denied', ad_storage: 'denied', ad_user_data: 'denied', analytics_storage: 'denied' },
    ]);
    reload.mockRestore();
  });

  it.each(['/admin', '/admin/demandes', '/iframe', '/iframe/carte'])('does not load GTM on %s', async (path) => {
    const { ConsentBanner } = await import('.');
    mocks.consent = true;
    mocks.asPath = path;
    window.history.replaceState({}, '', path);
    render(<ConsentBanner />);
    expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(0);
  });

  it('refreshes URL overrides on public navigation without repeating consent commands', async () => {
    const { ConsentBanner } = await import('.');
    mocks.consent = true;
    const { rerender } = render(<ConsentBanner />);
    mocks.asPath = '/chaleur-renouvelable/resultat?adresse=private&utm_campaign=automne';
    window.history.replaceState({}, '', mocks.asPath);
    rerender(<ConsentBanner />);
    expect(getGoogleCommands().filter(([command]) => command === 'consent')).toHaveLength(2);
    expect(getGoogleCommands().at(-1)).toStrictEqual([
      'set',
      { page_location: `${window.location.origin}/chaleur-renouvelable/resultat?utm_campaign=automne`, page_referrer: '' },
    ]);
  });

  it.each(['/admin/demandes', '/iframe/carte'])('unloads GTM through a document navigation before entering %s', async (path) => {
    const { ConsentBanner } = await import('.');
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
    mocks.consent = true;
    render(<ConsentBanner />);
    expect(() => mocks.beforeHistoryChange!(path)).toThrow('Switching to a document without Google tracking');
    expect(assign).toHaveBeenCalledWith(path);
    expect(mocks.events.emit).toHaveBeenCalledWith('routeChangeError', expect.objectContaining({ cancelled: true }), path, {
      shallow: false,
    });
    expect(getGoogleCommands().at(-1)).toStrictEqual([
      'consent',
      'update',
      { ad_personalization: 'denied', ad_storage: 'denied', ad_user_data: 'denied', analytics_storage: 'denied' },
    ]);
    assign.mockRestore();
  });
});
