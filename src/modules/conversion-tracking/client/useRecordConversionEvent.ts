import { useRouter } from 'next/router';
import { useCallback } from 'react';

import trpc from '@/modules/trpc/client';

import type { ConversionEventType } from '../constants';
import { getConversionSource, getTrackingContext, isTrackablePage } from './trackingContext';

/**
 * Émission fire-and-forget d'un événement de conversion. Règle unique des 3 events
 * (`display` / `address_test` / `demand`) : guard `/admin` (`isTrackablePage`), `host` best-effort,
 * `source` = `?source=` de l'URL (niveau 1 avec fallback `route` côté stats), `route` = pattern Next
 * (`/villes/[ville]`), `page` = pathname exact (drill).
 */
export function useRecordConversionEvent() {
  const { client } = trpc.useUtils();
  const router = useRouter();
  return useCallback(
    (type: ConversionEventType, options: { eligible?: boolean } = {}) => {
      if (!isTrackablePage()) {
        return;
      }
      void client.conversionTracking.recordEvent
        .mutate({
          eligible: options.eligible,
          host: getTrackingContext().host,
          page: window.location.pathname,
          route: router.pathname,
          source: getConversionSource(),
          type,
        })
        .catch(() => {});
    },
    [client, router.pathname]
  );
}
