type MultiEnrConversion =
  | { event: 'multienr_simulation_completed'; simulation_id: string }
  | { event: 'multienr_accompaniment_submitted'; demand_id: string; demand_type: 'ccrt' | 'heat_network'; simulation_id: string };

type GoogleTrackingWindow = Window & { dataLayer?: unknown[] };

const GOOGLE_ATTRIBUTION_PARAMETERS = new Set([
  'utm_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gbraid',
  'wbraid',
]);

/** Google tracking is limited to public, non-embedded pages. */
export const isGoogleTrackingAllowed = (pathname: string) => !/^\/(admin|iframe)(\/|$)/.test(pathname);

function getDataLayer() {
  const trackingWindow = window as GoogleTrackingWindow;
  return (trackingWindow.dataLayer ??= []);
}

function queueGoogleCommand(..._command: unknown[]) {
  // biome-ignore lint/complexity/noArguments: Google distinguishes gtag commands (Arguments) from data layer event objects.
  getDataLayer().push(arguments);
}

let previousConsent: boolean | undefined;

/** Removes simulator/contact parameters and fragments while preserving campaign and click attribution. */
export function getGooglePageParameters() {
  const sanitizeUrl = (value: string) => {
    const url = new URL(value);
    url.hash = '';
    Array.from(url.searchParams.keys()).forEach((parameter) => {
      if (!GOOGLE_ATTRIBUTION_PARAMETERS.has(parameter)) {
        url.searchParams.delete(parameter);
      }
    });
    return url.href;
  };
  return {
    page_location: sanitizeUrl(window.location.href),
    page_referrer: document.referrer ? sanitizeUrl(document.referrer) : '',
  };
}

/** Initializes basic Consent Mode once; only advertising measurement can be granted. */
export function setGoogleConsent(hasConsent: boolean) {
  if (previousConsent === hasConsent || (previousConsent === undefined && !hasConsent)) {
    return;
  }
  const denied = {
    ad_personalization: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    analytics_storage: 'denied',
  };
  if (previousConsent === undefined) {
    queueGoogleCommand('consent', 'default', denied);
  }
  queueGoogleCommand('consent', 'update', {
    ...denied,
    ad_storage: hasConsent ? 'granted' : 'denied',
    ad_user_data: hasConsent ? 'granted' : 'denied',
  });
  previousConsent = hasConsent;
}

/** Refreshes URL overrides on consented public SPA navigation. */
export function updateGooglePageParameters() {
  queueGoogleCommand('set', getGooglePageParameters());
}

/** Loads the validated GTM container after explicit advertising consent. */
export function loadGoogleTagManager(containerId: string) {
  if (!containerId || !isGoogleTrackingAllowed(window.location.pathname) || document.getElementById('multienr-google-tag-manager')) {
    return;
  }
  setGoogleConsent(true);
  updateGooglePageParameters();
  getDataLayer().push({ event: 'gtm.js', 'gtm.start': Date.now() });
  const script = document.createElement('script');
  script.id = 'multienr-google-tag-manager';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  document.head.appendChild(script);
}

const trackedConversions = new Set<string>();

/** The caller checks consent; no contact or simulation inputs enter the payload. */
export function pushMultiEnrConversion(conversion: MultiEnrConversion) {
  const eventId = `${conversion.event}:${'demand_id' in conversion ? conversion.demand_id : conversion.simulation_id}`;
  if (trackedConversions.has(eventId)) {
    return;
  }
  trackedConversions.add(eventId);
  updateGooglePageParameters();
  getDataLayer().push({ ...conversion, event_id: eventId, ...getGooglePageParameters() });
}
