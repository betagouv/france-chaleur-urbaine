type MultiEnrConversion =
  | { event: 'multienr_simulation_completed'; simulation_id: string }
  | { event: 'multienr_accompaniment_submitted'; demand_id: string; demand_type: 'ccrt' | 'heat_network'; simulation_id: string };

type GoogleTrackingWindow = Window & { dataLayer?: unknown[]; gtag?: (...command: unknown[]) => void };

function getDataLayer() {
  const trackingWindow = window as GoogleTrackingWindow;
  return (trackingWindow.dataLayer ??= []);
}

function queueGoogleCommand(..._command: unknown[]) {
  // biome-ignore lint/complexity/noArguments: Google distinguishes gtag commands (Arguments) from data layer event objects.
  getDataLayer().push(arguments);
}

let initializedDataLayer: unknown[] | undefined;
let previousConsent: boolean | undefined;

/** Removes simulator inputs and contact details from URLs sent by every Google destination. */
export function getGooglePageParameters() {
  let pageReferrer = '';
  if (document.referrer) {
    const referrer = new URL(document.referrer);
    pageReferrer = `${referrer.origin}${referrer.pathname}`;
  }
  return {
    page_location: `${window.location.origin}${window.location.pathname}`,
    page_referrer: pageReferrer,
  };
}

/** Establishes basic Consent Mode before any Google script or conversion; advertising personalization stays disabled. */
export function setGoogleConsent(hasConsent: boolean) {
  const consent = {
    ad_personalization: 'denied',
    ad_storage: hasConsent ? 'granted' : 'denied',
    ad_user_data: hasConsent ? 'granted' : 'denied',
    analytics_storage: hasConsent ? 'granted' : 'denied',
  };
  if (initializedDataLayer !== getDataLayer()) {
    initializedDataLayer = getDataLayer();
    previousConsent = undefined;
    queueGoogleCommand('consent', 'default', {
      ad_personalization: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      analytics_storage: 'denied',
    });
  }
  queueGoogleCommand('set', getGooglePageParameters());
  if (hasConsent !== previousConsent) {
    queueGoogleCommand('consent', 'update', consent);
    previousConsent = hasConsent;
  }
  if (hasConsent) {
    (window as GoogleTrackingWindow).gtag ??= queueGoogleCommand;
  }
}

/** Loads the existing Google destinations after consent without inline scripts or destination-specific CSP hashes. */
export function loadGoogleTags(tagIds: string[]) {
  setGoogleConsent(true);
  tagIds.forEach((tagId) => {
    if (!/^(G|GT|AW|DC)-[A-Z0-9]+$/.test(tagId) || document.getElementById(`google-ads-tag-${tagId}`)) {
      return;
    }
    queueGoogleCommand('js', new Date());
    queueGoogleCommand('config', tagId, { anonymize_ip: true, ...getGooglePageParameters() });
    const script = document.createElement('script');
    script.id = `google-ads-tag-${tagId}`;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
    document.head.appendChild(script);
  });
}

/** Called only after Google consent, alongside the existing Google tags. */
export function loadGoogleTagManager(containerId: string) {
  if (!/^GTM-[A-Z0-9]+$/.test(containerId) || document.getElementById('multienr-google-tag-manager')) {
    return;
  }

  setGoogleConsent(true);
  getDataLayer().push({ event: 'gtm.js', 'gtm.start': Date.now() });
  const script = document.createElement('script');
  script.id = 'multienr-google-tag-manager';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  document.head.appendChild(script);
}

const trackedConversions = new Set<string>();

/** The caller checks consent; no personal data or simulation URL enters the event payload. */
export function pushMultiEnrConversion(conversion: MultiEnrConversion) {
  const eventId = `${conversion.event}:${'demand_id' in conversion ? conversion.demand_id : conversion.simulation_id}`;
  if (trackedConversions.has(eventId)) {
    return;
  }
  trackedConversions.add(eventId);
  setGoogleConsent(true);
  getDataLayer().push({
    ...conversion,
    event_id: eventId,
    ...getGooglePageParameters(),
  });
}
