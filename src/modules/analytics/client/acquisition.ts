import { useRouter } from 'next/router';
import { useEffect } from 'react';

import type { Acquisition } from '../constants';

// Attribution belongs to this navigation only; no browser storage or cross-session identification.
let currentAcquisition: Acquisition | null = null;

/**
 * Retains the latest tagged arrival across internal navigation. Raw Google click identifiers are discarded.
 */
export function getAcquisition() {
  if (typeof window === 'undefined' || /^\/(admin|iframe)(\/|$)/.test(window.location.pathname)) {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const readParameter = (name: string) => params.get(name)?.trim().slice(0, 200) || null;
  const hasGoogleClick = ['gclid', 'gbraid', 'wbraid'].some((name) => !!params.get(name));
  const source = hasGoogleClick ? 'google' : readParameter('utm_source');
  const medium = hasGoogleClick ? 'cpc' : readParameter('utm_medium');
  const campaign = readParameter('utm_campaign');
  if (source || medium || campaign) {
    currentAcquisition = { campaign, medium, source };
  }
  return currentAcquisition;
}

/**
 * Captures acquisition on arrival before public forms remove the landing page query parameters.
 */
export function useCaptureAcquisition() {
  const router = useRouter();
  useEffect(() => {
    getAcquisition();
  }, [router.asPath]);
}
