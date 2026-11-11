'use client';

import { createConsentManagement } from '@codegouvfr/react-dsfr/consentManagement';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { clientConfig } from '@/client-config';
import { usePostHog } from '@/components/ConsentBanner/usePostHog';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { setGoogleConsent } from '@/modules/analytics/google-tag-manager';

import { GoogleTagManagerScript } from './GoogleTagManagerScript';
import { GoogleTagsScript } from './GoogleTagsScript';

type FinalityDescription = Parameters<typeof createConsentManagement>[0]['finalityDescription'];

const googleEnabled = clientConfig.tracking.googleTagIds.length > 0 || !!clientConfig.tracking.googleTagManagerId;
const posthogEnabled = !!(clientConfig.tracking.postHogApiHost && clientConfig.tracking.postHogKey);

const consentConfig: FinalityDescription = {};

if (googleEnabled) {
  consentConfig.google_analytics = {
    description: 'Mesure d’audience et des conversions publicitaires',
    title: 'Google Analytics et Google Ads',
  };
}
if (posthogEnabled) {
  consentConfig.posthog = {
    description: "Mesure d'audience",
    title: 'PostHog',
  };
}

export const { ConsentBannerAndConsentManagement, FooterConsentManagementItem, FooterPersonalDataPolicyItem, useConsent } =
  createConsentManagement({
    consentCallback: async ({ finalityConsent_prev, finalityConsent }) => {
      trackPostHogEvent('consent:cookie_choice_made', { consent: finalityConsent });
      if (googleEnabled) {
        setGoogleConsent(!!finalityConsent.google_analytics);
      }
      if (finalityConsent_prev?.google_analytics && !finalityConsent.google_analytics) {
        location.reload();
      }
    },
    finalityDescription: () => consentConfig,
    personalDataPolicyLinkProps: {
      href: '/politique-de-confidentialite',
    },
  });

export const ConsentBanner = () => {
  const { finalityConsent } = useConsent();
  const router = useRouter();
  usePostHog(!router.pathname.startsWith('/iframe/') && posthogEnabled && !!finalityConsent?.posthog);
  // Keep global URL overrides current on SPA navigation, before later Google events read them.
  useEffect(() => {
    if (googleEnabled && !router.pathname.startsWith('/iframe/')) {
      setGoogleConsent(!!finalityConsent?.google_analytics);
    }
  }, [finalityConsent?.google_analytics, router.asPath, router.pathname]);

  return (
    <>
      {!router.pathname.startsWith('/iframe/') && (
        <>
          <ConsentBannerAndConsentManagement />

          {googleEnabled && finalityConsent?.google_analytics && <GoogleTagsScript tagIds={clientConfig.tracking.googleTagIds} />}
          {!router.pathname.startsWith('/admin') && clientConfig.tracking.googleTagManagerId && finalityConsent?.google_analytics && (
            <GoogleTagManagerScript containerId={clientConfig.tracking.googleTagManagerId} />
          )}
        </>
      )}
    </>
  );
};
