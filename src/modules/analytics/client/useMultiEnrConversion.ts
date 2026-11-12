import { useCallback } from 'react';

import { clientConfig } from '@/client-config';
import { useConsent } from '@/components/ConsentBanner';

import { isGoogleTrackingAllowed, pushMultiEnrConversion } from './google-tag-manager';

/**
 * Sends simulator conversions only when GTM is configured and Google consent is granted.
 */
export function useMultiEnrConversion() {
  const { finalityConsent } = useConsent();
  const hasConsent = !!finalityConsent?.google_ads;

  return useCallback(
    (conversion: Parameters<typeof pushMultiEnrConversion>[0]) => {
      if (!hasConsent || !clientConfig.tracking.googleTagManagerId) {
        return;
      }
      if (!isGoogleTrackingAllowed(window.location.pathname)) {
        return;
      }
      pushMultiEnrConversion(conversion);
    },
    [hasConsent]
  );
}
