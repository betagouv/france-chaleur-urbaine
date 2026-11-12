import { useRouter } from 'next/router';
import { useEffect } from 'react';

import {
  isGoogleTrackingAllowed,
  loadGoogleTagManager,
  setGoogleConsent,
  updateGooglePageParameters,
} from '@/modules/analytics/client/google-tag-manager';

type GoogleTagManagerScriptProps = { containerId: string };

/**
 * Loads GTM after consent without adding an inline script to the Content Security Policy.
 */
export function GoogleTagManagerScript({ containerId }: GoogleTagManagerScriptProps) {
  const router = useRouter();
  // A single loader survives client navigation and React Strict Mode effect replays.
  useEffect(() => {
    loadGoogleTagManager(containerId);
  }, [containerId]);

  // Refresh explicit URL overrides without changing consent on every navigation.
  useEffect(() => {
    updateGooglePageParameters();
  }, [router.asPath]);

  // Unload GTM before entering a private/embedded route, including browser back/forward navigation.
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (isGoogleTrackingAllowed(new URL(url, window.location.origin).pathname)) {
        return;
      }
      setGoogleConsent(false);
      window.location.assign(url);
      const error = Object.assign(new Error('Switching to a document without Google tracking'), { cancelled: true });
      router.events.emit('routeChangeError', error, url, { shallow: false });
      throw error;
    };
    router.events.on('beforeHistoryChange', handleRouteChange);
    return () => router.events.off('beforeHistoryChange', handleRouteChange);
  }, [router.events]);

  return null;
}
