import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

import { useRecordConversionEvent } from './useRecordConversionEvent';

/**
 * Émet un événement de conversion `display` à chaque page vue (montage + changement de page),
 * une seule fois par pathname. First-party, fire-and-forget.
 * À poser sur chaque surface du funnel (pages portant un test d'adresse, `/iframe/carte`, `/iframe/form`).
 */
export function useTrackPageView() {
  const recordConversionEvent = useRecordConversionEvent();
  const router = useRouter();
  // Réémet quand la page change (slug inclus, ex. /villes/a → /villes/b) en ignorant les query params (?address=…).
  const pathname = router.asPath.split('?')[0];
  const lastTracked = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (lastTracked.current === pathname) {
      return;
    }
    lastTracked.current = pathname;
    recordConversionEvent('display');
  }, [pathname, recordConversionEvent]);
}
