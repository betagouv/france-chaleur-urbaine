import { isDevModeEnabled } from '@components/Map/components/DevModeIcon';
import { fbEvent } from '@rivercode/facebook-conversion-api-nextjs';
import { init as initMatomo } from '@totak/matomo-next';
import { atom, useAtom, useAtomValue } from 'jotai';
import { Router } from 'next/router';
import { useEffect, useState } from 'react';
import { clientConfig } from 'src/client-config';

// globally accessible atom (state)
type MatomoAnalyticsLoadingState = 'pending' | 'loaded' | 'error';

const matomoAnalyticsLoadingStateAtom =
  atom<MatomoAnalyticsLoadingState>('pending');

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
  const [matomoAnalyticsLoadingState, setMatomoAnalyticsLoadedState] = useAtom(
    matomoAnalyticsLoadingStateAtom
  );

  useEffect(() => {
    if (
      clientConfig.tracking.matomoServerURL &&
      clientConfig.tracking.matomoSiteId
    ) {
      initMatomo({
        url: clientConfig.tracking.matomoServerURL,
        siteId: clientConfig.tracking.matomoSiteId,
        disableCookies: true,
        excludeUrlsPatterns: [/\/carte\?.+/], // do not track query params for this URL
        onScriptLoadingError() {
          setMatomoAnalyticsLoadedState('error');
        },
      });

      // track the async deferred loading of the script by matomo-next
      // matomoAsyncInit is a specific callback used by Matomo
      // matomoAbTestingAsyncInit is a specific callback used by Matomo AB Testing framework
      window.matomoAbTestingAsyncInit = () => {
        setMatomoAnalyticsLoadedState('loaded');
      };

      // handle the case where matomo does not respond
      setTimeout(() => {
        if (matomoAnalyticsLoadingState === 'pending') {
          setMatomoAnalyticsLoadedState('error');
        }
      }, 2000);
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
 * These ids are used in Matomo to track Forms interactions.
 */
export enum AnalyticsFormId {
  form_test_adresse = 'form_test_adresse',
  form_contact = 'form_contact',
}

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
  'Carto|ENR&R Mobilisables|Active': {
    matomo: ['Carto', 'ENR&R Mobilisables', 'Active'],
  },
  'Carto|ENR&R Mobilisables|Désactive': {
    matomo: ['Carto', 'ENR&R Mobilisables', 'Désactive'],
  },
  'Carto|Datacenters|Active': {
    matomo: ['Carto', 'Datacenters', 'Active'],
  },
  'Carto|Datacenters|Désactive': {
    matomo: ['Carto', 'Datacenters', 'Désactive'],
  },
  'Carto|Industrie|Active': {
    matomo: ['Carto', 'Industrie', 'Active'],
  },
  'Carto|Industrie|Désactive': {
    matomo: ['Carto', 'Industrie', 'Désactive'],
  },
  'Carto|Installations électrogènes|Active': {
    matomo: ['Carto', 'Installations électrogènes', 'Active'],
  },
  'Carto|Installations électrogènes|Désactive': {
    matomo: ['Carto', 'Installations électrogènes', 'Désactive'],
  },
  "Carto|Stations d'épuration|Active": {
    matomo: ['Carto', "Stations d'épuration", 'Active'],
  },
  "Carto|Stations d'épuration|Désactive": {
    matomo: ['Carto', "Stations d'épuration", 'Désactive'],
  },
  "Carto|Unités d'incinération|Active": {
    matomo: ['Carto', "Unités d'incinération", 'Active'],
  },
  "Carto|Unités d'incinération|Désactive": {
    matomo: ['Carto', "Unités d'incinération", 'Désactive'],
  },
  'Carto|Solaire thermique - friches|Active': {
    matomo: ['Carto', 'Solaire thermique - friches', 'Active'],
  },
  'Carto|Solaire thermique - friches|Désactive': {
    matomo: ['Carto', 'Solaire thermique - friches', 'Désactive'],
  },
  'Carto|Solaire thermique - parkings|Active': {
    matomo: ['Carto', 'Solaire thermique - parkings', 'Active'],
  },
  'Carto|Solaire thermique - parkings|Désactive': {
    matomo: ['Carto', 'Solaire thermique - parkings', 'Désactive'],
  },
  "Carto|Zones d'opportunité|Active": {
    matomo: ['Carto', "Zones d'opportunité", 'Active'],
  },
  "Carto|Zones d'opportunité|Désactive": {
    matomo: ['Carto', "Zones d'opportunité", 'Désactive'],
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
    google: '6pB-CLSj87oZEOmokKkq', // Contact > Formulaire envoyé - Eligible
    facebook: 'Formulaire de contact éligible - Carte - Envoi',
  },
  'Eligibilité|Formulaire de contact inéligible - Carte - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Carte - Envoi'],
    google: '8xWLCLej87oZEOmokKkq', // Contact > Formulaire envoyé - Non Eligible
    facebook: 'Formulaire de contact inéligible - Carte - Envoi',
  },
  'Eligibilité|Formulaire de contact éligible - Fiche réseau - Envoi': {
    matomo: [
      'Eligibilité',
      'Formulaire de contact éligible - Fiche réseau - Envoi',
    ],
    google: '6pB-CLSj87oZEOmokKkq', // Contact > Formulaire envoyé - Eligible
    facebook: 'Formulaire de contact éligible - Fiche réseau - Envoi',
  },
  'Eligibilité|Formulaire de contact inéligible - Fiche réseau - Envoi': {
    matomo: [
      'Eligibilité',
      'Formulaire de contact inéligible - Fiche réseau - Envoi',
    ],
    google: '8xWLCLej87oZEOmokKkq', // Contact > Formulaire envoyé - Non Eligible
    facebook: 'Formulaire de contact inéligible - Fiche réseau - Envoi',
  },
  'Eligibilité|Formulaire de contact éligible - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Envoi'],
    google: '6pB-CLSj87oZEOmokKkq', // Contact > Formulaire envoyé - Eligible
    facebook: 'Formulaire de contact éligible - Envoi',
  },
  'Eligibilité|Formulaire de contact inéligible - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Envoi'],
    google: '8xWLCLej87oZEOmokKkq', // Contact > Formulaire envoyé - Non Eligible
    facebook: 'Formulaire de contact inéligible - Envoi',
  },
  'Eligibilité|Formulaire de test - Adresse Inéligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Adresse Inéligible'],
    google: 'OKZNCK6j87oZEOmokKkq', // Formulaire - non éligible
    facebook: 'Formulaire de test - Adresse Inéligible',
    linkedin: 5492666,
  },
  'Eligibilité|Formulaire de test - Adresse Éligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Adresse Éligible'],
    google: 'x-ftCLGj87oZEOmokKkq', // Formulaire - éligible
    facebook: 'Formulaire de test - Adresse Éligible',
    linkedin: 5392842,
  },
  'Eligibilité|Formulaire de test - Carte - Adresse Inéligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Adresse Inéligible'],
    google: 'OKZNCK6j87oZEOmokKkq', // Formulaire - non éligible
    facebook: 'Formulaire de test - Carte - Adresse Inéligible',
    linkedin: 5492666,
  },
  'Eligibilité|Formulaire de test - Carte - Adresse Éligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Adresse Éligible'],
    google: 'x-ftCLGj87oZEOmokKkq', // Formulaire - éligible
    facebook: 'Formulaire de test - Carte - Adresse Éligible',
    linkedin: 5392842,
  },
  'Eligibilité|Formulaire de test - Carte - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Envoi'],
    google: 'Sv1OCKuj87oZEOmokKkq', // Test éligibilité
    facebook: 'Formulaire de test - Carte - Envoi',
    linkedin: 5492674,
  },
  // fiche réseau
  'Eligibilité|Formulaire de test - Fiche réseau - Adresse Inéligible': {
    matomo: [
      'Eligibilité',
      'Formulaire de test - Fiche réseau - Adresse Inéligible',
    ],
    google: 'OKZNCK6j87oZEOmokKkq', // Formulaire - non éligible
    facebook: 'Formulaire de test - Fiche réseau - Adresse Inéligible',
    linkedin: 5492666,
  },
  'Eligibilité|Formulaire de test - Fiche réseau - Adresse Éligible': {
    matomo: [
      'Eligibilité',
      'Formulaire de test - Fiche réseau - Adresse Éligible',
    ],
    google: 'x-ftCLGj87oZEOmokKkq', // Formulaire - éligible
    facebook: 'Formulaire de test - Fiche réseau - Adresse Éligible',
    linkedin: 5392842,
  },
  'Eligibilité|Formulaire de test - Fiche réseau - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de test - Fiche réseau - Envoi'],
    google: 'Sv1OCKuj87oZEOmokKkq', // Test éligibilité
    facebook: 'Formulaire de test - Fiche réseau - Envoi',
    linkedin: 5492674,
  },
  'Eligibilité|Formulaire de test - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de test - Envoi'],
    google: 'Sv1OCKuj87oZEOmokKkq', // Test éligibilité
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
  'Téléchargement|Supports|Idées reçues 1': {
    matomo: ['Téléchargement', 'Supports', 'Idées reçues 1'],
  },
  'Téléchargement|Supports|Idées reçues 2': {
    matomo: ['Téléchargement', 'Supports', 'Idées reçues 2'],
  },
  'Téléchargement|Supports|Idées reçues 3': {
    matomo: ['Téléchargement', 'Supports', 'Idées reçues 3'],
  },
  'Téléchargement|Supports|Idées reçues 4': {
    matomo: ['Téléchargement', 'Supports', 'Idées reçues 4'],
  },
  'Téléchargement|Supports|Idées reçues 5': {
    matomo: ['Téléchargement', 'Supports', 'Idées reçues 5'],
  },
  'Téléchargement|Schéma directeur': {
    matomo: ['Téléchargement', 'Schéma directeur'],
  },
  Vidéo: {
    matomo: ['Vidéo'],
  },

  // used to test Matomo configuration
  'Debug|Event 1': {
    matomo: ['Debug', 'Debug Event 1'],
  },
  'Debug|Event 2': {
    matomo: ['Debug', 'Debug Event 2'],
  },
} as const satisfies Record<string, TrackingConfiguration>;

export type TrackingEvent = keyof typeof trackingEvents;

/**
 * Track an custom event.
 *
 * eventPayload is only use for Matomo at the moment.
 */
export const trackEvent = (eventKey: TrackingEvent, ...eventPayload: any[]) => {
  if (isDevModeEnabled()) {
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
  Matomo: any; // matomo
  matomoAbTestingAsyncInit: any; // matomo
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

type MatomoABTestingExperiment = {
  name: string;
  percentage: number;
  includedTargets: ReadonlyArray<any>;
  excludedTargets: ReadonlyArray<any>;
  variations: ReadonlyArray<{
    name: string;
    percentage?: number;
    activate: () => void;
  }>;
};

const emptyActivateMethod = () => {
  // code changes are executed using the variation name, not this callback method
};

const matomoABTestingExperiments = [
  {
    name: 'TestMessagesFormulaireContact', // you can also use '1' (ID of the experiment) to hide the name
    percentage: 100,
    includedTargets: [],
    excludedTargets: [],
    variations: [
      {
        name: 'original',
        activate: emptyActivateMethod,
      },
      {
        name: 'AmeliorationA',
        activate: emptyActivateMethod,
      },
      {
        name: 'AmeliorationB',
        activate: emptyActivateMethod,
      },
      {
        name: 'AmeliorationA+B',
        activate: emptyActivateMethod,
      },
    ],
  },
] as const satisfies ReadonlyArray<MatomoABTestingExperiment>;

type MatomoABTestingExperimentName =
  (typeof matomoABTestingExperiments)[number]['name'];

export type MatomoABTestingExperimentVariations<
  Name extends MatomoABTestingExperimentName,
> = Extract<
  (typeof matomoABTestingExperiments)[number],
  { name: Name }
>['variations'][number]['name'];

type MatomoAbTestingExperimentOptions = {
  enable?: boolean;
};

const defaultOptions: MatomoAbTestingExperimentOptions = {
  enable: true,
};

/**
 * Use an AB Testing Experiment a retrieve a variation name.
 *
 * Usage:
 *
 *   ```tsx
 *   ...
 *   const { ready, variation } = useMatomoAbTestingExperiment(
 *     'TitreDynamiquePageCopro'
 *   );
 *   if (!ready) {
 *     return null;
 *   }
 *
 *   return (
 *     <Button>{variation === 'NouveauLabel' ? 'nouveau label' : 'label original'}</Button>
 *   )
 *   ```
 */
export const useMatomoAbTestingExperiment = <
  Name extends MatomoABTestingExperimentName,
>(
  experimentName: MatomoABTestingExperimentName,
  options: MatomoAbTestingExperimentOptions = defaultOptions
):
  | {
      ready: boolean;
      variation: MatomoABTestingExperimentVariations<Name>;
    }
  | {
      ready: boolean;
      variation: undefined;
    } => {
  const matomoAnalyticsLoadingState = useAtomValue(
    matomoAnalyticsLoadingStateAtom
  );
  if (matomoAnalyticsLoadingState === 'pending') {
    return { ready: false, variation: undefined };
  }

  // if the script could not be loaded or the experiment is disabled, we fallback to the original variation
  if (matomoAnalyticsLoadingState === 'error' || !options.enable) {
    return { ready: true, variation: 'original' };
  }

  const experiment = new window.Matomo.AbTesting.Experiment(
    matomoABTestingExperiments.find((e) => e.name === experimentName)
  );

  return { ready: true, variation: experiment.getActivatedVariationName() };
};
