'use client';

import { createConsentManagement } from '@codegouvfr/react-dsfr/consentManagement';
import { useRouter } from 'next/router';

import { clientConfig } from '@/client-config';
import { usePostHog } from '@/components/ConsentBanner/usePostHog';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { isGoogleTrackingAllowed, setGoogleConsent } from '@/modules/analytics/client/google-tag-manager';

import { GoogleTagManagerScript } from './GoogleTagManagerScript';

type FinalityDescription = Parameters<typeof createConsentManagement>[0]['finalityDescription'];

const googleEnabled = !!clientConfig.tracking.googleTagManagerId;
const posthogEnabled = !!(clientConfig.tracking.postHogApiHost && clientConfig.tracking.postHogKey);

const consentConfig: FinalityDescription = {};

if (googleEnabled) {
  consentConfig.google_ads = {
    description: 'Mesure des conversions publicitaires',
    title: 'Google Ads',
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
        setGoogleConsent(!!finalityConsent.google_ads);
      }
      if (finalityConsent_prev?.google_ads && !finalityConsent.google_ads) {
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
  usePostHog(!/^\/iframe(\/|$)/.test(router.pathname) && posthogEnabled && !!finalityConsent?.posthog);

  return (
    <>
      {!/^\/iframe(\/|$)/.test(router.pathname) && (
        <>
          <ConsentBannerAndConsentManagement />

          {isGoogleTrackingAllowed(router.pathname) && googleEnabled && finalityConsent?.google_ads && (
            <GoogleTagManagerScript containerId={clientConfig.tracking.googleTagManagerId} />
          )}
        </>
      )}
    </>
  );
};
