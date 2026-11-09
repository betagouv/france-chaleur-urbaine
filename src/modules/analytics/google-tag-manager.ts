type MultiEnrConversion =
  | { event: 'multienr_simulation_completed'; simulation_id: string }
  | { event: 'multienr_accompaniment_submitted'; demand_id: string; demand_type: 'ccrt' | 'heat_network'; simulation_id: string };

type GoogleTrackingWindow = Window & { dataLayer?: unknown[] };

function getDataLayer() {
  const trackingWindow = window as GoogleTrackingWindow;
  return (trackingWindow.dataLayer ??= []);
}

/** Called only after Google consent, alongside the existing Google tags. */
export function loadGoogleTagManager(containerId: string) {
  if (!/^GTM-[A-Z0-9]+$/.test(containerId) || document.getElementById('multienr-google-tag-manager')) {
    return;
  }

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
  getDataLayer().push({
    ...conversion,
    event_id: eventId,
    page_location: `${window.location.origin}${window.location.pathname}`,
  });
}
