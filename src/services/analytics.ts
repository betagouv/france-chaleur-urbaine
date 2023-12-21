import { init, push } from '@socialgouv/matomo-next';
import { useEffect } from 'react';
import { clientConfig } from 'src/client-config';

/**
 * Register analytics (Matomo only for now).
 */
export const useAnalytics = () => {
  useEffect(() => {
    init({
      url: clientConfig.tracking.matomoServerURL,
      siteId: clientConfig.tracking.matomoSiteId,
      disableCookies: true,
    });
  }, []);
};

type TrackingConfiguration = {
  matomo?: string[]; // ex: ['Carto', 'Ajouter un segment']
  facebook?: [string, ...any[]]; // ex: ['FindLocation']
  google?: string; // ex: 6QaoCJfrtN8DEIqs-vYo (ads id)
  linkedin?: number; // ex: 5492674 (conversion id)
};

/*
Workflow du formulaire de test d'adresse :
- quand on soumet le formulaire :
  - Formulaire de test - Envoi
  - Formulaire de test - Adresse Inéligible
- quand on soumet le second formulaire de contact :
  - Formulaire de contact éligible - Envoi
*/

const trackingEvents = {
  'Carto|Ajouter un segment': {
    matomo: ['Carto', 'Ajouter un segment'],
  },
  'Carto|Densité recu': {
    matomo: ['Carto', 'Densité recu'],
  },
  'Carto|Donées recues': {
    matomo: ['Carto', 'Donées recues'],
  },
  'Carto|Définir un tracé': {
    matomo: ['Carto', 'Définir un tracé'],
  },
  'Carto|Définir une zone': {
    matomo: ['Carto', 'Définir une zone'],
  },
  'Carto|Supprimer un segment': {
    matomo: ['Carto', 'Supprimer un segment'],
  },
  'Carto|Tracé défini': {
    matomo: ['Carto', 'Tracé défini'],
  },
  'Carto|Tracé mis à jour': {
    matomo: ['Carto', 'Tracé mis à jour'],
  },
  'Carto|Zone définie': {
    matomo: ['Carto', 'Zone définie'],
  },
  'Carto|Zone mise à jour': {
    matomo: ['Carto', 'Zone mise à jour'],
  },
  'Carto|ouverture popup potentiels de raccordement': {
    matomo: ['Carto', 'ouverture popup potentiels de raccordement'],
  },
  'Eligibilité|Formulaire de contact éligible - Carte - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Carte - Envoi'],
  },
  'Eligibilité|Formulaire de contact inéligible - Carte - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Carte - Envoi'],
  },
  'Eligibilité|Formulaire de contact éligible - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Envoi'],
    google: 'hhBSCKims_oYEJDB_MIq', // Formulaire - éligible
  },
  'Eligibilité|Formulaire de contact inéligible - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Envoi'],
    google: 'Pb_7CKWms_oYEJDB_MIq', // Formulaire - non éligible
  },
  'Eligibilité|Formulaire de test - Adresse Inéligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Adresse Inéligible'],
    google: 'Pm33CK6ms_oYEJDB_MIq', // Formulaire envoyé - Non Eligible
  },
  'Eligibilité|Formulaire de test - Adresse Éligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Adresse Éligible'],
    google: 'boNMCKums_oYEJDB_MIq', // Formulaire envoyé - Eligible
  },
  'Eligibilité|Formulaire de test - Carte - Adresse Inéligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Adresse Inéligible'],
  },
  'Eligibilité|Formulaire de test - Carte - Adresse Éligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Adresse Éligible'],
  },
  'Eligibilité|Formulaire de test - Carte - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Envoi'],
  },
  'Eligibilité|Formulaire de test - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de test - Envoi'],
    google: 'z18zCKKms_oYEJDB_MIq', // Test éligibilité
  },
  'Téléchargement|Guide FCU|coproprietaire': {
    matomo: ['Téléchargement', 'Guide FCU', 'coproprietaire'],
  },
  'Téléchargement|Guide FCU|professionnels': {
    matomo: ['Téléchargement', 'Guide FCU', 'professionnels'],
  },
  'Téléchargement|Guide FCU|Ressources': {
    matomo: ['Téléchargement', 'Guide FCU', 'Ressources'],
  },
  'Téléchargement|Tracés|carte': {
    matomo: ['Téléchargement', 'Tracés', 'carte'],
  },
  'Téléchargement|Tracés|professionnels': {
    matomo: ['Téléchargement', 'Tracés', 'professionnels'],
  },
  Vidéo: {
    matomo: ['Vidéo' /* TODO dynamique ici */],
  },
} as const satisfies Record<string, TrackingConfiguration>;

type TrackingEvent = keyof typeof trackingEvents;

/**
 * Track an custom event.
 */
export const trackEvent = (eventKey: TrackingEvent) => {
  console.log('track event', eventKey, trackingEvents[eventKey]);
  const configuration = trackingEvents[eventKey];
  if (!configuration) {
    console.error('invalid tracking key', eventKey);
    return;
  }
  console.log('performTracking', configuration);
  // debug disable
  if (!window) {
    performTracking(configuration);
  }
};

// augment window type with tracking helpers
declare let window: Window & {
  fbq: (param: any) => void; // facebook
  gtag: (...args: any[]) => void; // google
  lintrk: (action: string, param: any) => void; // linkedin
  _paq: [any]; // matomo
};

// TODO handle dynamic events / variables with matomo
const performTracking = (trackingConfig: TrackingConfiguration) => {
  if (trackingConfig.facebook && typeof window?.fbq === 'function') {
    window.fbq(['trackCustom', ...trackingConfig.facebook]);
  }
  if (trackingConfig.google && typeof window?.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: `AW-${clientConfig.tracking.googleTagId}/${trackingConfig.google}`,
    });
  }
  if (trackingConfig.linkedin && typeof window?.lintrk === 'function') {
    window.lintrk('track', { conversion_id: trackingConfig.linkedin });
  }
  // peut-être pas nécessaire si fonction direct push
  // if (trackingConfig.matomo && typeof window?._paq?.push === 'function') {
  //   window._paq.push(['trackEvent', trackingConfig.matomo]);
  // }
  if (trackingConfig.matomo) {
    push(['trackEvent', ...trackingConfig.matomo]);
  }
};
