import { useEffect } from 'react';

import { loadGoogleTagManager } from '@/modules/analytics/google-tag-manager';

type GoogleTagManagerScriptProps = { containerId: string };

/**
 * Loads GTM after consent without adding an inline script to the Content Security Policy.
 */
export function GoogleTagManagerScript({ containerId }: GoogleTagManagerScriptProps) {
  // A single loader survives client navigation and React Strict Mode effect replays.
  useEffect(() => {
    loadGoogleTagManager(containerId);
  }, [containerId]);

  return null;
}
