import { fbEvent } from '@rivercode/facebook-conversion-api-nextjs';
import { init as initMatomo } from '@socialgouv/matomo-next';
import { atom, useAtom, useAtomValue } from 'jotai';
import { Router } from 'next/router';
import { useEffect, useState } from 'react';

import { clientConfig } from '@/client-config';
import { isDevModeEnabled } from '@/hooks/useDevMode';

type ExtractSuffix<T extends string, S extends string> = T extends `${infer Prefix}${S}` ? Prefix : never;

// globally accessible atom (state)
type MatomoAnalyticsLoadingState = 'pending' | 'loaded' | 'error';

const matomoAnalyticsLoadingStateAtom = atom<MatomoAnalyticsLoadingState>('pending');

const onRouteChange = (url: string) => {
  // see https://developers.google.com/analytics/devguides/collection/ga4/views?client_type=gtag&hl=fr#manually_send_page_view_events
  if (clientConfig.tracking.googleTagIds.length > 0 && typeof window?.gtag === 'function') {
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

// prevent the double init effect due to strict mode
let hookInitialized = false;

/**
 * Register analytics (Matomo only for now).
 * Matomo and Google Analytics page views both have to be triggered manually.
 * Facebook and Linkedin track page views automatically when loaded.
 */
export const useAnalytics = () => {
  const [matomoAnalyticsLoadingState, setMatomoAnalyticsLoadedState] = useAtom(matomoAnalyticsLoadingStateAtom);

  useEffect(() => {
    if (!hookInitialized && clientConfig.tracking.matomoServerURL && clientConfig.tracking.matomoSiteId) {
      hookInitialized = true;

      initMatomo({
        url: clientConfig.tracking.matomoServerURL,
        siteId: clientConfig.tracking.matomoSiteId,
        disableCookies: true,
        excludeUrlsPatterns: [/\/carte\?.+/], // do not track query params for this URL
        onScriptLoadingError() {
          setMatomoAnalyticsLoadedState('error');
        },
      });

      // handle the case where matomo does not respond
      const errorStateTimeout = setTimeout(() => {
        if (matomoAnalyticsLoadingState === 'pending') {
          setMatomoAnalyticsLoadedState('error');
        }
      }, 2000);

      // track the async deferred loading of the script by matomo-next
      // matomoAsyncInit is a specific callback used by Matomo
      // matomoAbTestingAsyncInit is a specific callback used by Matomo AB Testing framework
      window.matomoAbTestingAsyncInit = () => {
        setMatomoAnalyticsLoadedState('loaded');
        clearTimeout(errorStateTimeout);
      };
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
      'multiplegtag_loaded',
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
  // outils
  'Carto|Mesure de distance|Tracé terminé': {
    matomo: ['Carto', 'Mesure de distance', 'Tracé terminé'],
  },
  'Carto|Mesure de distance|Ajouter un tracé': {
    matomo: ['Carto', 'Mesure de distance', 'Ajouter un tracé'],
  },
  'Carto|Mesure de distance|Supprimer un tracé': {
    matomo: ['Carto', 'Mesure de distance', 'Supprimer un tracé'],
  },
  'Carto|Extraction données batiments|Zone terminée': {
    matomo: ['Carto', 'Extraction données batiments', 'Zone terminée'],
  },
  'Carto|Extraction données batiments|Effacer': {
    matomo: ['Carto', 'Extraction données batiments', 'Effacer'],
  },
  'Carto|Extraction données batiments|Exporter les données': {
    matomo: ['Carto', 'Extraction données batiments', 'Exporter les données'],
  },
  'Carto|Densité thermique linéaire|Tracé terminé': {
    matomo: ['Carto', 'Densité thermique linéaire', 'Tracé terminé'],
  },
  'Carto|Densité thermique linéaire|Ajouter un segment': {
    matomo: ['Carto', 'Densité thermique linéaire', 'Ajouter un segment'],
  },
  'Carto|Densité thermique linéaire|Effacer': {
    matomo: ['Carto', 'Densité thermique linéaire', 'Effacer'],
  },
  'Carto|Densité thermique linéaire|Exporter le tracé': {
    matomo: ['Carto', 'Densité thermique linéaire', 'Exporter le tracé'],
  },

  'Carto|ouverture popup potentiels de raccordement': {
    matomo: ['Carto', 'ouverture popup potentiels de raccordement'],
  },

  'Carto|Légende|Ouvre': {
    matomo: ['Carto', 'Légende', 'Ouvre'],
  },
  'Carto|Légende|Ferme': {
    matomo: ['Carto', 'Légende', 'Ferme'],
  },

  // couches de la carte
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
  'Carto|Tabs|reseaux': {
    matomo: ['Carto', 'Tabs', 'reseaux'],
  },
  'Carto|Tabs|potentiel': {
    matomo: ['Carto', 'Tabs', 'potentiel'],
  },
  'Carto|Tabs|enrr': {
    matomo: ['Carto', 'Tabs', 'enrr'],
  },
  'Carto|Tabs|outils': {
    matomo: ['Carto', 'Tabs', 'outils'],
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
  'Carto|Bâtiments raccordés réseau chaleur|Active': {
    matomo: ['Carto', 'Bâtiments raccordés réseau chaleur', 'Active'],
  },
  'Carto|Bâtiments raccordés réseau chaleur|Désactive': {
    matomo: ['Carto', 'Bâtiments raccordés réseau chaleur', 'Désactive'],
  },
  'Carto|Bâtiments raccordés réseau froid|Active': {
    matomo: ['Carto', 'Bâtiments raccordés réseau froid', 'Active'],
  },
  'Carto|Bâtiments raccordés réseau froid|Désactive': {
    matomo: ['Carto', 'Bâtiments raccordés réseau froid', 'Désactive'],
  },
  'Carto|Besoins en chaleur|Active': {
    matomo: ['Carto', 'Besoins en chaleur', 'Active'],
  },
  'Carto|Besoins en chaleur|Désactive': {
    matomo: ['Carto', 'Besoins en chaleur', 'Désactive'],
  },
  'Carto|Besoins en chaleur secteur industriel|Active': {
    matomo: ['Carto', 'Besoins en chaleur secteur industriel', 'Active'],
  },
  'Carto|Besoins en chaleur secteur industriel|Désactive': {
    matomo: ['Carto', 'Besoins en chaleur secteur industriel', 'Désactive'],
  },
  'Carto|Communes à fort potentiel pour la création de réseaux de chaleur|Active': {
    matomo: ['Carto', 'Communes à fort potentiel pour la création de réseaux de chaleur', 'Active'],
  },
  'Carto|Communes à fort potentiel pour la création de réseaux de chaleur|Désactive': {
    matomo: ['Carto', 'Communes à fort potentiel pour la création de réseaux de chaleur', 'Désactive'],
  },
  'Carto|Besoins en froid|Active': {
    matomo: ['Carto', 'Besoins en froid', 'Active'],
  },
  'Carto|Besoins en froid|Désactive': {
    matomo: ['Carto', 'Besoins en froid', 'Désactive'],
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
  'Carto|Zones géothermie profonde|Active': {
    matomo: ['Carto', 'Zones géothermie profonde', 'Active'],
  },
  'Carto|Zones géothermie profonde|Désactive': {
    matomo: ['Carto', 'Zones géothermie profonde', 'Désactive'],
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
  'Carto|Thalassothermie|Active': {
    matomo: ['Carto', 'Thalassothermie', 'Active'],
  },
  'Carto|Thalassothermie|Désactive': {
    matomo: ['Carto', 'Thalassothermie', 'Désactive'],
  },
  'Carto|Installations géothermie profonde|Active': {
    matomo: ['Carto', 'Installations géothermie profonde', 'Active'],
  },
  'Carto|Installations géothermie profonde|Désactive': {
    matomo: ['Carto', 'Installations géothermie profonde', 'Désactive'],
  },
  'Carto|Installations géothermie surface fermés|Active': {
    matomo: ['Carto', 'Installations géothermie surface fermés', 'Active'],
  },
  'Carto|Installations géothermie surface fermés|Désactive': {
    matomo: ['Carto', 'Installations géothermie surface fermés', 'Désactive'],
  },
  'Carto|Installations géothermie surface ouverts|Active': {
    matomo: ['Carto', 'Installations géothermie surface ouverts', 'Active'],
  },
  'Carto|Installations géothermie surface ouverts|Désactive': {
    matomo: ['Carto', 'Installations géothermie surface ouverts', 'Désactive'],
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

  // formulaire d'éligibilité
  'Eligibilité|Formulaire de contact éligible - Carte - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Carte - Envoi'],
    google: '47QiCKeh6c0ZELGIqf89', // Contact > Formulaire envoyé - Eligible
    facebook: 'Formulaire de contact éligible - Carte - Envoi',
  },
  'Eligibilité|Formulaire de contact inéligible - Carte - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Carte - Envoi'],
    google: 'sdziCKqh6c0ZELGIqf89', // Contact > Formulaire envoyé - Non Eligible
    facebook: 'Formulaire de contact inéligible - Carte - Envoi',
  },
  'Eligibilité|Formulaire de contact éligible - Fiche réseau - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Fiche réseau - Envoi'],
    google: '47QiCKeh6c0ZELGIqf89', // Contact > Formulaire envoyé - Eligible
    facebook: 'Formulaire de contact éligible - Fiche réseau - Envoi',
  },
  'Eligibilité|Formulaire de contact inéligible - Fiche réseau - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Fiche réseau - Envoi'],
    google: 'sdziCKqh6c0ZELGIqf89', // Contact > Formulaire envoyé - Non Eligible
    facebook: 'Formulaire de contact inéligible - Fiche réseau - Envoi',
  },
  'Eligibilité|Formulaire de contact éligible - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Envoi'],
    google: '47QiCKeh6c0ZELGIqf89', // Contact > Formulaire envoyé - Eligible
    facebook: 'Formulaire de contact éligible - Envoi',
  },
  'Eligibilité|Formulaire de contact inéligible - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Envoi'],
    google: 'sdziCKqh6c0ZELGIqf89', // Contact > Formulaire envoyé - Non Eligible
    facebook: 'Formulaire de contact inéligible - Envoi',
  },
  'Eligibilité|Formulaire de test - Adresse Inéligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Adresse Inéligible'],
    google: 'izv4CKGh6c0ZELGIqf89', // Formulaire - non éligible
    facebook: 'Formulaire de test - Adresse Inéligible',
    linkedin: 5492666,
  },
  'Eligibilité|Formulaire de test - Adresse Éligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Adresse Éligible'],
    google: 'CFo-CKSh6c0ZELGIqf89', // Formulaire - éligible
    facebook: 'Formulaire de test - Adresse Éligible',
    linkedin: 5392842,
  },
  'Eligibilité|Formulaire de test - Carte - Adresse Inéligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Adresse Inéligible'],
    google: 'izv4CKGh6c0ZELGIqf89', // Formulaire - non éligible
    facebook: 'Formulaire de test - Carte - Adresse Inéligible',
    linkedin: 5492666,
  },
  'Eligibilité|Formulaire de test - Carte - Adresse Éligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Adresse Éligible'],
    google: 'CFo-CKSh6c0ZELGIqf89', // Formulaire - éligible
    facebook: 'Formulaire de test - Carte - Adresse Éligible',
    linkedin: 5392842,
  },
  'Eligibilité|Formulaire de test - Carte - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Envoi'],
    google: 'XNYRCJ6h6c0ZELGIqf89', // Test éligibilité
    facebook: 'Formulaire de test - Carte - Envoi',
    linkedin: 5492674,
  },
  // fiche réseau
  'Eligibilité|Formulaire de test - Fiche réseau - Adresse Inéligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Fiche réseau - Adresse Inéligible'],
    google: 'izv4CKGh6c0ZELGIqf89', // Formulaire - non éligible
    facebook: 'Formulaire de test - Fiche réseau - Adresse Inéligible',
    linkedin: 5492666,
  },
  'Eligibilité|Formulaire de test - Fiche réseau - Adresse Éligible': {
    matomo: ['Eligibilité', 'Formulaire de test - Fiche réseau - Adresse Éligible'],
    google: 'CFo-CKSh6c0ZELGIqf89', // Formulaire - éligible
    facebook: 'Formulaire de test - Fiche réseau - Adresse Éligible',
    linkedin: 5392842,
  },
  'Eligibilité|Formulaire de test - Fiche réseau - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de test - Fiche réseau - Envoi'],
    google: 'XNYRCJ6h6c0ZELGIqf89', // Test éligibilité
    facebook: 'Formulaire de test - Fiche réseau - Envoi',
    linkedin: 5492674,
  },
  'Eligibilité|Formulaire de test - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de test - Envoi'],
    google: 'XNYRCJ6h6c0ZELGIqf89', // Test éligibilité
    facebook: 'Formulaire de test - Envoi',
    linkedin: 5492674,
  },

  // téléchargements
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
    matomo: ['Téléchargement', 'Guide Collectivités', 'Collectivités et exploitants'],
  },
  'Téléchargement|Guide Exploitants|Collectivités et exploitants': {
    matomo: ['Téléchargement', 'Guide Exploitants', 'Collectivités et exploitants'],
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
    matomo: ['Téléchargement', 'Supports', 'Visuel promotion affiche information'],
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
  'Téléchargement|Supports|Normandie': {
    matomo: ['Téléchargement', 'Supports', 'Normandie'],
  },
  'Téléchargement|Supports|Hauts-de-France': {
    matomo: ['Téléchargement', 'Supports', 'Hauts-de-France'],
  },
  'Téléchargement|Supports|Grand Est': {
    matomo: ['Téléchargement', 'Supports', 'Grand Est'],
  },
  'Téléchargement|Supports|Bougogne-Franche-Comté': {
    matomo: ['Téléchargement', 'Supports', 'Bougogne-Franche-Comté'],
  },
  'Téléchargement|Supports|Auvergne-Rhône-Alpes': {
    matomo: ['Téléchargement', 'Supports', 'Auvergne-Rhône-Alpes'],
  },
  "Téléchargement|Supports|Provence-Alpes-Côte-d'Azur": {
    matomo: ['Téléchargement', 'Supports', "Provence-Alpes-Côte-d'Azur"],
  },
  'Téléchargement|Supports|Occitanie': {
    matomo: ['Téléchargement', 'Supports', 'Occitanie'],
  },
  'Téléchargement|Supports|Nouvelle-Aquitaine': {
    matomo: ['Téléchargement', 'Supports', 'Nouvelle-Aquitaine'],
  },
  'Téléchargement|Supports|Pays de la Loire': {
    matomo: ['Téléchargement', 'Supports', 'Pays de la Loire'],
  },
  'Téléchargement|Supports|Centre-Val de Loire': {
    matomo: ['Téléchargement', 'Supports', 'Centre-Val de Loire'],
  },
  'Téléchargement|Supports|Bretagne': {
    matomo: ['Téléchargement', 'Supports', 'Bretagne'],
  },
  'Téléchargement|Supports|Chiffres-clés des réseaux de chaleur 2023': {
    matomo: ['Téléchargement', 'Supports', 'Chiffres-clés des réseaux de chaleur 2023'],
  },
  'Téléchargement|Supports|Chiffres-clés des réseaux de froid 2023': {
    matomo: ['Téléchargement', 'Supports', 'Chiffres-clés des réseaux de froid 2023'],
  },
  'Téléchargement|Supports|Décarboner le chauffage': {
    matomo: ['Téléchargement', 'Supports', 'Décarboner le chauffage'],
  },
  'Téléchargement|Schéma directeur': {
    matomo: ['Téléchargement', 'Schéma directeur'],
  },
  'Outils|Simulation coût raccordement': {
    matomo: ['Outils', 'Simulation coût raccordement'],
  },
  'Villes Potentiel - Visites|Réseau Existant': {
    matomo: ['Villes Potentiel - Visites', 'Réseau Existant'],
  },
  'Villes Potentiel - Demandes|Réseau Existant': {
    matomo: ['Villes Potentiel - Demandes', 'Réseau Existant'],
  },
  'Villes Potentiel - Visites|Réseau Futur': {
    matomo: ['Villes Potentiel - Visites', 'Réseau Futur'],
  },
  'Villes Potentiel - Demandes|Réseau Futur': {
    matomo: ['Villes Potentiel - Demandes', 'Réseau Futur'],
  },
  'Villes Potentiel - Visites|Fort Potentiel': {
    matomo: ['Villes Potentiel - Visites', 'Fort Potentiel'],
  },
  'Villes Potentiel - Demandes|Fort Potentiel': {
    matomo: ['Villes Potentiel - Demandes', 'Fort Potentiel'],
  },
  'Villes Potentiel - Visites|Potentiel': {
    matomo: ['Villes Potentiel - Visites', 'Potentiel'],
  },
  'Villes Potentiel - Demandes|Potentiel': {
    matomo: ['Villes Potentiel - Demandes', 'Potentiel'],
  },
  'Villes Potentiel - Visites|Sans Potentiel': {
    matomo: ['Villes Potentiel - Visites', 'Sans Potentiel'],
  },
  'Villes Potentiel - Demandes|Sans Potentiel': {
    matomo: ['Villes Potentiel - Demandes', 'Sans Potentiel'],
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
export type LegendTrackingEvent = ExtractSuffix<TrackingEvent, '|Active'>;
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

const performTracking = (trackingConfig: TrackingConfiguration, eventPayload?: any[]) => {
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
    clientConfig.tracking.googleTagIds.forEach((googleTagId) => {
      window.gtag('event', 'conversion', {
        send_to: `${googleTagId}/${trackingConfig.google}`,
      });
    });
  }
  if (trackingConfig.linkedin && typeof window?.lintrk === 'function') {
    window.lintrk('track', { conversion_id: trackingConfig.linkedin });
  }
  if (trackingConfig.matomo && typeof window?._paq?.push === 'function') {
    window._paq.push(['trackEvent', ...trackingConfig.matomo, ...(eventPayload ?? [])]);
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
  // placeholder to make types work
  {
    name: '_internal',
    percentage: 100,
    includedTargets: [],
    excludedTargets: [],
    variations: [
      {
        name: 'original',
        activate: emptyActivateMethod,
      },
    ],
  },
  // add the experiments below
] as const satisfies ReadonlyArray<MatomoABTestingExperiment>;

type MatomoABTestingExperimentName = (typeof matomoABTestingExperiments)[number]['name'];

export type MatomoABTestingExperimentVariations<Name extends MatomoABTestingExperimentName> = Extract<
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
export const useMatomoAbTestingExperiment = <Name extends MatomoABTestingExperimentName>(
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
  const matomoAnalyticsLoadingState = useAtomValue(matomoAnalyticsLoadingStateAtom);
  if (matomoAnalyticsLoadingState === 'pending') {
    return { ready: false, variation: undefined };
  }

  // if the script could not be loaded or the experiment is disabled, we fallback to the original variation
  if (matomoAnalyticsLoadingState === 'error' || !options.enable) {
    return { ready: true, variation: 'original' };
  }

  const experiment = new window.Matomo.AbTesting.Experiment(matomoABTestingExperiments.find((e) => e.name === experimentName));

  return { ready: true, variation: experiment.getActivatedVariationName() };
};
