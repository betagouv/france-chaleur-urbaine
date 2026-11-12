import { useCallback } from 'react';

import { clientConfig } from '@/client-config';
import { useConsent } from '@/components/ConsentBanner';

import { pushMultiEnrConversion } from './google-tag-manager';

/**
 * Sends simulator conversions only when GTM is configured and Google consent is granted.
 */
export function useMultiEnrConversion() {
  const { finalityConsent } = useConsent();
  const hasConsent = !!finalityConsent?.google_analytics;

  return useCallback(
    (conversion: Parameters<typeof pushMultiEnrConversion>[0]) => {
      if (!hasConsent || !/^GTM-[A-Z0-9]+$/.test(clientConfig.tracking.googleTagManagerId)) {
        return;
      }
      if (window.location.pathname.startsWith('/iframe/') || window.location.pathname.startsWith('/admin')) {
        return;
      }
      pushMultiEnrConversion(conversion);
    },
    [hasConsent]
  );
}
