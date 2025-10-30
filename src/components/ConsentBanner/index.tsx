'use client';

import { createConsentManagement } from '@codegouvfr/react-dsfr/consentManagement';
import { useRouter } from 'next/router';

import { clientConfig } from '@/client-config';

import FacebookScript from './FacebookScript';
import GoogleTagsScript from './GoogleTagsScript';
import HotjarScript from './HotjarScript';
import LinkedInScript from './LinkedInScript';

type FinalityDescription = Parameters<typeof createConsentManagement>[0]['finalityDescription'];

const googleEnabled = clientConfig.tracking.googleTagIds.length > 0;
const linkedinEnabled = !!clientConfig.tracking.linkInPartnerId;
const facebookEnabled = !!clientConfig.tracking.facebookPixelId;
const hotjarEnabled = clientConfig.tracking.hotjarId && clientConfig.tracking.hotjarSv;

const consentConfig: FinalityDescription = {};

if (facebookEnabled) {
  consentConfig.facebook_pixel = {
    description: "Mesure d'audience",
    title: 'Facebook Pixel',
  };
}
if (linkedinEnabled) {
  consentConfig.linkedin_insights = {
    description: "Mesure d'audience",
    title: 'LinkedIn Insights',
  };
}
if (googleEnabled) {
  consentConfig.google_analytics = {
    description: "Mesure d'audience",
    title: 'Google Analytics (gtag.js)',
  };
}
if (hotjarEnabled) {
  consentConfig.hotjar = {
    description: "Mesure d'audience",
    title: 'Hotjar',
  };
}

export const { ConsentBannerAndConsentManagement, FooterConsentManagementItem, FooterPersonalDataPolicyItem, useConsent } =
  createConsentManagement({
    consentCallback: async ({ finalityConsent_prev, finalityConsent }) => {
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
  return (
    <>
      {!router.pathname.startsWith('/iframe/') && (
        <>
          <ConsentBannerAndConsentManagement />

          {googleEnabled && finalityConsent?.google_analytics && <GoogleTagsScript tagIds={clientConfig.tracking.googleTagIds} />}
          {linkedinEnabled && finalityConsent?.linkedin_insights && (
            <LinkedInScript partnerId={clientConfig.tracking.linkInPartnerId as string} />
          )}
          {facebookEnabled && finalityConsent?.facebook_pixel && (
            <FacebookScript pixelId={clientConfig.tracking.facebookPixelId as string} />
          )}
          {hotjarEnabled && finalityConsent?.hotjar && (
            <HotjarScript hjid={clientConfig.tracking.hotjarId as string} hjsv={clientConfig.tracking.hotjarSv as string} />
          )}
        </>
      )}
    </>
  );
};
