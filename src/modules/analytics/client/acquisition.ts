import { useRouter } from 'next/router';
import { useEffect } from 'react';

import type { Acquisition } from '../constants';

// Attribution belongs to this navigation only; no browser storage or cross-session identification.
let currentAcquisition: Acquisition | null = null;

/**
 * Retains the latest tagged arrival across internal navigation. Raw Google click identifiers are discarded.
 */
export function getAcquisition() {
  if (typeof window === 'undefined' || /^\/admin(\/|$)/.test(window.location.pathname)) {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const readParameter = (name: string) => params.get(name)?.trim().slice(0, 200) || null;
  const hasGoogleClick = ['gclid', 'gbraid', 'wbraid'].some((name) => !!params.get(name));
  const hasUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term'].some((name) => !!readParameter(name));
  const prefix = hasUtm || hasGoogleClick ? 'utm' : 'mtm';
  const source = hasGoogleClick ? 'google' : readParameter(`${prefix}_source`);
  const medium = hasGoogleClick ? 'cpc' : readParameter(`${prefix}_medium`);
  const campaign = readParameter(`${prefix}_campaign`);
  const keyword = readParameter(prefix === 'utm' ? 'utm_term' : 'mtm_kwd');
  if (source || medium || campaign || keyword) {
    currentAcquisition = { campaign, ...(keyword ? { keyword } : {}), medium, source };
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
