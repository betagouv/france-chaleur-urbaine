// @vitest-environment-options {"settings":{"handleDisabledFileLoadingAsSuccess":true}}
import type { createConsentManagement } from '@codegouvfr/react-dsfr/consentManagement';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConsentBanner } from '.';

const mocks = vi.hoisted(() => ({
  consent: false,
  consentCallback: undefined as Parameters<typeof createConsentManagement>[0]['consentCallback'],
}));

vi.mock('@codegouvfr/react-dsfr/consentManagement', () => ({
  createConsentManagement: (config: Parameters<typeof createConsentManagement>[0]) => {
    mocks.consentCallback = config.consentCallback;
    return {
      ConsentBannerAndConsentManagement: () => null,
      useConsent: () => ({ finalityConsent: { google_analytics: mocks.consent } }),
    };
  },
}));
vi.mock('@/client-config', () => ({
  clientConfig: { tracking: { googleTagIds: ['AW-123456'], googleTagManagerId: 'GTM-TEST123' } },
}));
vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: vi.fn() }));
vi.mock('./usePostHog', () => ({ usePostHog: vi.fn() }));

type TrackingWindow = Window & { dataLayer?: unknown[] };

beforeEach(() => {
  mocks.consent = false;
  (window as TrackingWindow).dataLayer = [];
  document.getElementById('multienr-google-tag-manager')?.remove();
  document.getElementById('google-ads-tag-AW-123456')?.remove();
});

describe('Google consent banner integration', () => {
  it('loads no Google scripts before consent and loads both integrations after acceptance', () => {
    const { rerender } = render(<ConsentBanner />);
    expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(0);
    mocks.consent = true;
    rerender(<ConsentBanner />);
    expect(
      Array.from(document.querySelectorAll('script[src*="googletagmanager.com"]')).map((script) => script.getAttribute('src'))
    ).toStrictEqual(['https://www.googletagmanager.com/gtag/js?id=AW-123456', 'https://www.googletagmanager.com/gtm.js?id=GTM-TEST123']);
  });

  it('preserves the current page on first refusal and reloads only when withdrawing Google consent', async () => {
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const consentCallback = mocks.consentCallback!;
    const denied = { google_analytics: false, isFullConsent: false };
    await consentCallback({ finalityConsent: denied, finalityConsent_prev: undefined });
    expect(reload).not.toHaveBeenCalled();

    await consentCallback({ finalityConsent: { google_analytics: true, isFullConsent: true }, finalityConsent_prev: denied });
    await consentCallback({ finalityConsent: denied, finalityConsent_prev: { google_analytics: true, isFullConsent: true } });
    expect(reload).toHaveBeenCalledTimes(1);
    const commands = (window as TrackingWindow).dataLayer?.filter(
      (entry): entry is IArguments => Object.prototype.toString.call(entry) === '[object Arguments]'
    );
    expect(Array.from(commands!.at(-1)!)).toStrictEqual([
      'consent',
      'update',
      { ad_personalization: 'denied', ad_storage: 'denied', ad_user_data: 'denied', analytics_storage: 'denied' },
    ]);
    reload.mockRestore();
  });
});
