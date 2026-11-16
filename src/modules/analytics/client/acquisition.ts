import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { getTrackingContext } from '@/modules/conversion-tracking/client/trackingContext';

import type { Acquisition } from '../constants';

// Attribution belongs to this navigation only; no browser storage or cross-session identification.
let currentAcquisition: Acquisition | null = null;
let lastTaggedCampaign: string | null = null;

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
  const source = hasGoogleClick ? 'google' : readParameter('utm_source');
  const medium = hasGoogleClick ? 'cpc' : readParameter('utm_medium');
  const campaign = readParameter('utm_campaign');
  const keyword = readParameter('utm_term');
  const context = getTrackingContext();
  const integrationId = readParameter('source');
  const page = window.location.pathname.slice(0, 1000);
  const taggedCampaign = source || medium || campaign || keyword ? JSON.stringify([source, medium, campaign, keyword]) : null;
  if (!currentAcquisition || (taggedCampaign && taggedCampaign !== lastTaggedCampaign)) {
    lastTaggedCampaign = taggedCampaign;
    currentAcquisition = {
      campaign,
      ...(keyword ? { keyword } : {}),
      landingPage: page,
      medium,
      referrer: getExternalReferrer(),
      source,
      ...(currentAcquisition?.integrationId ? { integrationId: currentAcquisition.integrationId } : {}),
      ...(currentAcquisition?.host ? { host: currentAcquisition.host } : {}),
      ...(context.host ? { host: context.host.split(/[?#]/)[0].slice(0, 1000) } : {}),
      inIframe: context.inIframe || page.startsWith('/iframe/') || currentAcquisition?.inIframe === true,
      ...(integrationId ? { integrationId } : {}),
      ...(params.has('originDemandId') ? { fcuEmail: true } : {}),
    };
  }
  return { ...currentAcquisition, formPage: page };
}

/** Stores only the external hostname, never a referrer path, query or fragment. */
function getExternalReferrer() {
  try {
    const referrer = new URL(document.referrer);
    return ['http:', 'https:'].includes(referrer.protocol) && referrer.hostname !== window.location.hostname
      ? referrer.hostname.slice(0, 253)
      : undefined;
  } catch {
    return undefined;
  }
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
