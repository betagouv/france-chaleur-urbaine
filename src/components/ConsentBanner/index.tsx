'use client';

import { createConsentManagement } from '@codegouvfr/react-dsfr/consentManagement';
import { useRouter } from 'next/router';

import { clientConfig } from '@/client-config';
import { usePostHog } from '@/components/ConsentBanner/usePostHog';
import { trackPostHogEvent } from '@/modules/analytics/client';

import GoogleTagsScript from './GoogleTagsScript';

type FinalityDescription = Parameters<typeof createConsentManagement>[0]['finalityDescription'];

const googleEnabled = clientConfig.tracking.googleTagIds.length > 0;
const posthogEnabled = !!(clientConfig.tracking.postHogApiHost && clientConfig.tracking.postHogKey);

const consentConfig: FinalityDescription = {};

if (googleEnabled) {
  consentConfig.google_analytics = {
    description: "Mesure d'audience",
    title: 'Google Analytics (gtag.js)',
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
      if (finalityConsent_prev === undefined && !finalityConsent.isFullConsent) {
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

  return (
    <>
      {!router.pathname.startsWith('/iframe/') && (
        <>
          <ConsentBannerAndConsentManagement />

          {googleEnabled && finalityConsent?.google_analytics && <GoogleTagsScript tagIds={clientConfig.tracking.googleTagIds} />}
        </>
      )}
    </>
  );
};
