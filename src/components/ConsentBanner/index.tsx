'use client';

import { createConsentManagement } from '@codegouvfr/react-dsfr/consentManagement';
import { useRouter } from 'next/router';

import { clientConfig } from 'src/client-config';
import { iframedPaths } from 'src/services/iframe';

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
    title: 'Facebook Pixel',
    description: "Mesure d'audience",
  };
}
if (linkedinEnabled) {
  consentConfig.linkedin_insights = {
    title: 'LinkedIn Insights',
    description: "Mesure d'audience",
  };
}
if (googleEnabled) {
  consentConfig.google_analytics = {
    title: 'Google Analytics (gtag.js)',
    description: "Mesure d'audience",
  };
}
if (hotjarEnabled) {
  consentConfig.hotjar = {
    title: 'Hotjar',
    description: "Mesure d'audience",
  };
}

export const { ConsentBannerAndConsentManagement, FooterConsentManagementItem, FooterPersonalDataPolicyItem, useConsent } =
  createConsentManagement({
    finalityDescription: () => consentConfig,
    personalDataPolicyLinkProps: {
      href: '/politique-de-confidentialite',
    },
    consentCallback: async ({ finalityConsent_prev, finalityConsent }) => {
      if (finalityConsent_prev === undefined && !finalityConsent.isFullConsent) {
        location.reload();
      }
    },
  });

export const ConsentBanner = () => {
  const { finalityConsent } = useConsent();
  const router = useRouter();
  return (
    <>
      <ConsentBannerAndConsentManagement />

      {!iframedPaths.some((path) => router.pathname.match(path)) && (
        <>
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
