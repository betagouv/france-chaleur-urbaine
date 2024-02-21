import { fbEvent } from '@rivercode/facebook-conversion-api-nextjs';
import { init as initMatomo } from '@socialgouv/matomo-next';
import { Router } from 'next/router';
import { useEffect, useState } from 'react';
import { clientConfig } from 'src/client-config';

const onRouteChange = (url: string) => {
  // see https://developers.google.com/analytics/devguides/collection/ga4/views?client_type=gtag&hl=fr#manually_send_page_view_events
  if (clientConfig.tracking.googleTagId && typeof window?.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: url,
    });
  }
  // see https://help.hotjar.com/hc/en-us/articles/115011805428-Hotjar-on-Single-Page-Apps
  if (clientConfig.tracking.hotjarId && typeof window?.hj === 'function') {
    window.hj('stateChange', url);
  }
};

/**
 * Register analytics (Matomo only for now).
 * Matomo and Google Analytics page views both have to be triggered manually.
 * Facebook and Linkedin track page views automatically when loaded.
 */
export const useAnalytics = () => {
  useEffect(() => {
    if (
      clientConfig.tracking.matomoServerURL &&
      clientConfig.tracking.matomoSiteId
    ) {
      initMatomo({
        url: clientConfig.tracking.matomoServerURL,
        siteId: clientConfig.tracking.matomoSiteId,
        disableCookies: true,
      });
    }
  }, []);

  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);
  useEffect(() => {
    if (!analyticsLoaded) {
      return;
    }
    Router.events.on('routeChangeComplete', onRouteChange);
    return () => {
      Router.events.off('routeChangeComplete', onRouteChange);
    };
  }, [analyticsLoaded]);

  if (typeof window === 'object') {
    document.addEventListener(
      'gtag_loaded',
      () => {
        setAnalyticsLoaded(true);
      },
      {
        once: true,
      }
    );
    document.addEventListener(
      'hotjar_loaded',
      () => {
        setAnalyticsLoaded(true);
      },
      {
        once: true,
      }
    );
  }
};

type TrackingConfiguration = {
  matomo?: readonly string[]; // ex: ['Carto', 'Ajouter un segment']
  facebook?: string; // ex: Formulaire de contact éligible - Envoi
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

/**
 * List of all events tracked by analytics tools.
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
  'Carto|Réseaux chaleur|Active': {
    matomo: ['Carto', 'Réseaux chaleur', 'Active'],
  },
  'Carto|Réseaux chaleur|Désactive': {
    matomo: ['Carto', 'Réseaux chaleur', 'Désactive'],
  },
  'Carto|Périmètres de développement prioritaire|Active': {
    matomo: ['Carto', 'Périmètres de développement prioritaire', 'Active'],
  },
  'Carto|Périmètres de développement prioritaire|Désactive': {
    matomo: ['Carto', 'Périmètres de développement prioritaire', 'Désactive'],
  },
  'Carto|Réseaux en construction|Active': {
    matomo: ['Carto', 'Réseaux en construction', 'Active'],
  },
  'Carto|Réseaux en construction|Désactive': {
    matomo: ['Carto', 'Réseaux en construction', 'Désactive'],
  },
  'Carto|Réseaux de froid|Active': {
    matomo: ['Carto', 'Réseaux de froid', 'Active'],
  },
  'Carto|Réseaux de froid|Désactive': {
    matomo: ['Carto', 'Réseaux de froid', 'Désactive'],
  },
  'Carto|Active Pro Mode': {
    matomo: ['Carto', 'Active Pro Mode'],
  },
  'Carto|Demandes de raccordement|Active': {
    matomo: ['Carto', 'Demandes de raccordement', 'Active'],
  },
  'Carto|Demandes de raccordement|Désactive': {
    matomo: ['Carto', 'Demandes de raccordement', 'Désactive'],
  },
  'Carto|Consommations globales de gaz|Active': {
    matomo: ['Carto', 'Consommations globales de gaz', 'Active'],
  },
  'Carto|Consommations globales de gaz|Désactive': {
    matomo: ['Carto', 'Consommations globales de gaz', 'Désactive'],
  },
  'Carto|Bâtiments au gaz collectif|Active': {
    matomo: ['Carto', 'Bâtiments au gaz collectif', 'Active'],
  },
  'Carto|Bâtiments au gaz collectif|Désactive': {
    matomo: ['Carto', 'Bâtiments au gaz collectif', 'Désactive'],
  },
  'Carto|Bâtiments au fioul collectif|Active': {
    matomo: ['Carto', 'Bâtiments au fioul collectif', 'Active'],
  },
  'Carto|Bâtiments au fioul collectif|Désactive': {
    matomo: ['Carto', 'Bâtiments au fioul collectif', 'Désactive'],
  },
  'Carto|Bâtiments raccordés|Active': {
    matomo: ['Carto', 'Bâtiments raccordés', 'Active'],
  },
  'Carto|Bâtiments raccordés|Désactive': {
    matomo: ['Carto', 'Bâtiments raccordés', 'Désactive'],
  },
  'Carto|DPE|Active': {
    matomo: ['Carto', 'DPE', 'Active'],
  },
  'Carto|DPE|Désactive': {
    matomo: ['Carto', 'DPE', 'Désactive'],
  },
  'Carto|Zones à potentiel chaud|Active': {
    matomo: ['Carto', 'Zones à potentiel chaud', 'Active'],
  },
  'Carto|Zones à potentiel chaud|Désactive': {
    matomo: ['Carto', 'Zones à potentiel chaud', 'Désactive'],
  },
  'Carto|Zones à potentiel fort chaud|Active': {
    matomo: ['Carto', 'Zones à potentiel fort chaud', 'Active'],
  },
  'Carto|Zones à potentiel fort chaud|Désactive': {
    matomo: ['Carto', 'Zones à potentiel fort chaud', 'Désactive'],
  },
  'Eligibilité|Formulaire de contact éligible - Carte - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Carte - Envoi'],
    google: 'boNMCKums_oYEJDB_MIq', // Contact > Formulaire envoyé - Eligible
    facebook: 'Formulaire de contact éligible - Carte - Envoi',
  },
  'Eligibilité|Formulaire de contact inéligible - Carte - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Carte - Envoi'],
    google: 'Pm33CK6ms_oYEJDB_MIq', // Contact > Formulaire envoyé - Non Eligible
    facebook: 'Formulaire de contact inéligible - Carte - Envoi',
  },
  'Eligibilité|Formulaire de contact éligible - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Envoi'],
    google: 'boNMCKums_oYEJDB_MIq', // Contact > Formulaire envoyé - Eligible
    facebook: 'Formulaire de contact éligible - Envoi',
  },
  'Eligibilité|Formulaire de contact inéligible - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Envoi'],
    google: 'Pm33CK6ms_oYEJDB_MIq', // Contact > Formulaire envoyé - Non Eligible
    facebook: 'Formulaire de contact inéligible - Envoi',
  },
  'Eligibilité|Formulaire de test - Adresse Inéligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Adresse Inéligible'],
    google: 'Pb_7CKWms_oYEJDB_MIq', // Formulaire - non éligible
    facebook: 'Formulaire de test - Adresse Inéligible',
    linkedin: 5492666,
  },
  'Eligibilité|Formulaire de test - Adresse Éligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Adresse Éligible'],
    google: 'hhBSCKims_oYEJDB_MIq', // Formulaire - éligible
    facebook: 'Formulaire de test - Adresse Éligible',
    linkedin: 5392842,
  },
  'Eligibilité|Formulaire de test - Carte - Adresse Inéligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Adresse Inéligible'],
    google: 'Pb_7CKWms_oYEJDB_MIq', // Formulaire - non éligible
    facebook: 'Formulaire de test - Carte - Adresse Inéligible',
    linkedin: 5492666,
  },
  'Eligibilité|Formulaire de test - Carte - Adresse Éligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Adresse Éligible'],
    google: 'hhBSCKims_oYEJDB_MIq', // Formulaire - éligible
    facebook: 'Formulaire de test - Carte - Adresse Éligible',
    linkedin: 5392842,
  },
  'Eligibilité|Formulaire de test - Carte - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Envoi'],
    google: 'z18zCKKms_oYEJDB_MIq', // Test éligibilité
    facebook: 'Formulaire de test - Carte - Envoi',
    linkedin: 5492674,
  },
  'Eligibilité|Formulaire de test - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de test - Envoi'],
    google: 'z18zCKKms_oYEJDB_MIq', // Test éligibilité
    facebook: 'Formulaire de test - Envoi',
    linkedin: 5492674,
  },
  'Téléchargement|Guide FCU|coproprietaire': {
    matomo: ['Téléchargement', 'Guide FCU', 'coproprietaire'],
  },
  'Téléchargement|Dossier Présentation|coproprietaire': {
    matomo: ['Téléchargement', 'Dossier Présentation', 'coproprietaire'],
  },
  'Téléchargement|Guide FCU|professionnels': {
    matomo: ['Téléchargement', 'Guide FCU', 'professionnels'],
  },
  'Téléchargement|Guide FCU|Ressources': {
    matomo: ['Téléchargement', 'Guide FCU', 'Ressources'],
  },
  'Téléchargement|Guide FCU|Supports': {
    matomo: ['Téléchargement', 'Guide FCU', 'Supports'],
  },
  'Téléchargement|Guide FCU|Confirmation éligibilité': {
    matomo: ['Téléchargement', 'Guide FCU', 'Confirmation éligibilité'],
  },
  'Téléchargement|Guide Collectivités|Collectivités et exploitants': {
    matomo: [
      'Téléchargement',
      'Guide Collectivités',
      'Collectivités et exploitants',
    ],
  },
  'Téléchargement|Guide Exploitants|Collectivités et exploitants': {
    matomo: [
      'Téléchargement',
      'Guide Exploitants',
      'Collectivités et exploitants',
    ],
  },
  'Téléchargement|Tracés|carte': {
    matomo: ['Téléchargement', 'Tracés', 'carte'],
  },
  'Téléchargement|Tracés|professionnels': {
    matomo: ['Téléchargement', 'Tracés', 'professionnels'],
  },
  'Téléchargement|Carto sources': {
    matomo: ['Téléchargement', 'Carto sources'],
  },
  'Téléchargement|Dossier Presse|Partenaires': {
    matomo: ['Téléchargement', 'Dossier Presse', 'Partenaires'],
  },
  'Téléchargement|Dossier Presse|Supports': {
    matomo: ['Téléchargement', 'Dossier Presse', 'Supports'],
  },
  'Téléchargement|Supports|Reportage géothermie Champigny': {
    matomo: ['Téléchargement', 'Supports', 'Reportage géothermie Champigny'],
  },
  'Téléchargement|Supports|Reportage chaufferie Surville': {
    matomo: ['Téléchargement', 'Supports', 'Reportage chaufferie Surville'],
  },
  'Téléchargement|Supports|Reportage datacenter Equinix': {
    matomo: ['Téléchargement', 'Supports', 'Reportage datacenter Equinix'],
  },
  'Téléchargement|Supports|Reportage réseau froid Annecy': {
    matomo: ['Téléchargement', 'Supports', 'Reportage réseau froid Annecy'],
  },
  'Téléchargement|Supports|Reportage Isseane': {
    matomo: ['Téléchargement', 'Supports', 'Reportage Isseane'],
  },
  'Téléchargement|Supports|Reportage Alsace Charras': {
    matomo: ['Téléchargement', 'Supports', 'Reportage Alsace Charras'],
  },
  'Téléchargement|Supports|Vidéo Evry-Courcouronnes': {
    matomo: ['Téléchargement', 'Supports', 'Vidéo Evry-Courcouronnes'],
  },
  'Téléchargement|Supports|Vidéo comment ça marche': {
    matomo: ['Téléchargement', 'Supports', 'Vidéo comment ça marche'],
  },
  'Téléchargement|Supports|Campagne pub affiche abribus': {
    matomo: ['Téléchargement', 'Supports', 'Campagne pub affiche abribus'],
  },
  'Téléchargement|Supports|Campagne pub facebook 1': {
    matomo: ['Téléchargement', 'Supports', 'Campagne pub facebook 1'],
  },
  'Téléchargement|Supports|Campagne pub facebook 2': {
    matomo: ['Téléchargement', 'Supports', 'Campagne pub facebook 2'],
  },
  'Téléchargement|Supports|Visuel promotion affiche information': {
    matomo: [
      'Téléchargement',
      'Supports',
      'Visuel promotion affiche information',
    ],
  },
  'Téléchargement|Supports|Visuel promotion post LI ou FB 1': {
    matomo: ['Téléchargement', 'Supports', 'Visuel promotion post LI ou FB 1'],
  },
  'Téléchargement|Supports|Visuel promotion post LI ou FB 2': {
    matomo: ['Téléchargement', 'Supports', 'Visuel promotion post LI ou FB 2'],
  },
  'Téléchargement|Supports|Infographie Avenir': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Avenir'],
  },
  'Téléchargement|Supports|Infographie Classement': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Classement'],
  },
  'Téléchargement|Supports|Infographie Ménages': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Ménages'],
  },
  'Téléchargement|Supports|Infographie Cout': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Cout'],
  },
  'Téléchargement|Supports|Infographie ENRR': {
    matomo: ['Téléchargement', 'Supports', 'Infographie ENRR'],
  },
  'Téléchargement|Supports|Infographie Géothermie': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Géothermie'],
  },
  'Téléchargement|Supports|Infographie Biomasse': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Biomasse'],
  },
  'Téléchargement|Supports|Infographie Chaleur Fatale': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Chaleur Fatale'],
  },
  'Téléchargement|Supports|Infographie Solaire': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Solaire'],
  },
  'Téléchargement|Supports|Infographie Froid': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Froid'],
  },
  'Téléchargement|Supports|Infographie Optimisation': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Optimisation'],
  },
  Vidéo: {
    matomo: ['Vidéo'],
  },
} as const satisfies Record<string, TrackingConfiguration>;

export type TrackingEvent = keyof typeof trackingEvents;

/**
 * Track an custom event.
 *
 * eventPayload is only use for Matomo at the moment.
 */
export const trackEvent = (eventKey: TrackingEvent, ...eventPayload: any[]) => {
  if ((window as any).devMode) {
    // eslint-disable-next-line no-console
    console.log('trackEvent', eventKey, eventPayload, trackingEvents[eventKey]);
  }
  const configuration = trackingEvents[eventKey];
  if (!configuration) {
    console.error('invalid tracking key', eventKey);
    return;
  }
  performTracking(configuration, eventPayload);
};

// augment window type with tracking helpers
declare let window: Window & {
  fbq: (param: any) => void; // facebook
  gtag: (...args: any[]) => void; // google
  lintrk: (action: string, param: any) => void; // linkedin
  _paq: [any]; // matomo
  hj: (...args: any[]) => void; // hotjar
};

const performTracking = (
  trackingConfig: TrackingConfiguration,
  eventPayload?: any[]
) => {
  if (trackingConfig.facebook && typeof window?.fbq === 'function') {
    // we may need to use custom events trackCustom when we want more information
    // see https://developers.facebook.com/docs/meta-pixel/reference
    // window.fbq(['track', ...trackingConfig.facebook]);
    // use standard pixel and conversion api
    // see https://github.com/RivercodeAB/facebook-conversion-api-nextjs/blob/7279e607b0f07a841d695406f47c7782b623973a/src/conversion-api.ts#L28
    fbEvent({
      eventName: trackingConfig.facebook,
      enableStandardPixel: true,
    });
  }
  if (trackingConfig.google && typeof window?.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: `AW-${clientConfig.tracking.googleTagId}/${trackingConfig.google}`,
    });
  }
  if (trackingConfig.linkedin && typeof window?.lintrk === 'function') {
    window.lintrk('track', { conversion_id: trackingConfig.linkedin });
  }
  if (trackingConfig.matomo && typeof window?._paq?.push === 'function') {
    window._paq.push([
      'trackEvent',
      ...trackingConfig.matomo,
      ...(eventPayload ?? []),
    ]);
  }
};
