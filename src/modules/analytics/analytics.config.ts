export type TrackingConfiguration = {
  matomo?: readonly string[]; // ex: ['Carto', 'Ajouter un segment']
  facebook?: string; // ex: Formulaire de contact éligible - Envoi
  google?: string; // ex: 6QaoCJfrtN8DEIqs-vYo (ads id)
  linkedin?: number; // ex: 5492674 (conversion id)
};

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
export const trackingEvents = {
  'Carto|Active Pro Mode': {
    matomo: ['Carto', 'Active Pro Mode'],
  },
  'Carto|Adresses testées|Active': {
    matomo: ['Carto', 'Carto|Adresses testées', 'Active'],
  },
  'Carto|Adresses testées|Désactive': {
    matomo: ['Carto', 'Carto|Adresses testées', 'Désactive'],
  },
  'Carto|Besoins en chaleur secteur industriel|Active': {
    matomo: ['Carto', 'Besoins en chaleur secteur industriel', 'Active'],
  },
  'Carto|Besoins en chaleur secteur industriel|Désactive': {
    matomo: ['Carto', 'Besoins en chaleur secteur industriel', 'Désactive'],
  },
  'Carto|Besoins en chaleur|Active': {
    matomo: ['Carto', 'Besoins en chaleur', 'Active'],
  },
  'Carto|Besoins en chaleur|Désactive': {
    matomo: ['Carto', 'Besoins en chaleur', 'Désactive'],
  },
  'Carto|Besoins en froid|Active': {
    matomo: ['Carto', 'Besoins en froid', 'Active'],
  },
  'Carto|Besoins en froid|Désactive': {
    matomo: ['Carto', 'Besoins en froid', 'Désactive'],
  },
  'Carto|Bâtiments au fioul collectif|Active': {
    matomo: ['Carto', 'Bâtiments au fioul collectif', 'Active'],
  },
  'Carto|Bâtiments au fioul collectif|Désactive': {
    matomo: ['Carto', 'Bâtiments au fioul collectif', 'Désactive'],
  },
  'Carto|Bâtiments au gaz collectif|Active': {
    matomo: ['Carto', 'Bâtiments au gaz collectif', 'Active'],
  },
  'Carto|Bâtiments au gaz collectif|Désactive': {
    matomo: ['Carto', 'Bâtiments au gaz collectif', 'Désactive'],
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
  'Carto|Communes à fort potentiel pour la création de réseaux de chaleur|Active': {
    matomo: ['Carto', 'Communes à fort potentiel pour la création de réseaux de chaleur', 'Active'],
  },
  'Carto|Communes à fort potentiel pour la création de réseaux de chaleur|Désactive': {
    matomo: ['Carto', 'Communes à fort potentiel pour la création de réseaux de chaleur', 'Désactive'],
  },
  'Carto|Consommations globales de gaz|Active': {
    matomo: ['Carto', 'Consommations globales de gaz', 'Active'],
  },
  'Carto|Consommations globales de gaz|Désactive': {
    matomo: ['Carto', 'Consommations globales de gaz', 'Désactive'],
  },
  'Carto|Datacenters|Active': {
    matomo: ['Carto', 'Datacenters', 'Active'],
  },
  'Carto|Datacenters|Désactive': {
    matomo: ['Carto', 'Datacenters', 'Désactive'],
  },
  'Carto|Demandes de raccordement|Active': {
    matomo: ['Carto', 'Demandes de raccordement', 'Active'],
  },
  'Carto|Demandes de raccordement|Désactive': {
    matomo: ['Carto', 'Demandes de raccordement', 'Désactive'],
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
  'Carto|Densité thermique linéaire|Tracé terminé': {
    matomo: ['Carto', 'Densité thermique linéaire', 'Tracé terminé'],
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
  'Carto|Etudes en cours|Active': {
    matomo: ['Carto', 'Etudes en cours', 'Active'],
  },
  'Carto|Etudes en cours|Désactive': {
    matomo: ['Carto', 'Etudes en cours', 'Désactive'],
  },
  'Carto|Extraction données batiments|Effacer': {
    matomo: ['Carto', 'Extraction données batiments', 'Effacer'],
  },
  'Carto|Extraction données batiments|Exporter les données': {
    matomo: ['Carto', 'Extraction données batiments', 'Exporter les données'],
  },
  'Carto|Extraction données batiments|Zone terminée': {
    matomo: ['Carto', 'Extraction données batiments', 'Zone terminée'],
  },
  'Carto|Géothermie profonde|Active': {
    matomo: ['Carto', 'Géothermie profonde', 'Active'],
  },
  'Carto|Géothermie profonde|Désactive': {
    matomo: ['Carto', 'Géothermie profonde', 'Désactive'],
  },
  'Carto|Géothermie sur nappe|Active': {
    matomo: ['Carto', 'Géothermie sur nappe', 'Active'],
  },
  'Carto|Géothermie sur nappe|Désactive': {
    matomo: ['Carto', 'Géothermie sur nappe', 'Désactive'],
  },
  'Carto|Géothermie sur sonde|Active': {
    matomo: ['Carto', 'Géothermie sur sonde', 'Active'],
  },
  'Carto|Géothermie sur sonde|Désactive': {
    matomo: ['Carto', 'Géothermie sur sonde', 'Désactive'],
  },
  'Carto|Industrie|Active': {
    matomo: ['Carto', 'Industrie', 'Active'],
  },
  'Carto|Industrie|Désactive': {
    matomo: ['Carto', 'Industrie', 'Désactive'],
  },
  'Carto|Installations géothermie profonde|Active': {
    matomo: ['Carto', 'Installations géothermie profonde', 'Active'],
  },
  'Carto|Installations géothermie profonde|Désactive': {
    matomo: ['Carto', 'Installations géothermie profonde', 'Désactive'],
  },
  'Carto|Installations géothermie sur nappe déclarées|Active': {
    matomo: ['Carto', 'Installations géothermie sur nappe déclarées', 'Active'],
  },
  'Carto|Installations géothermie sur nappe déclarées|Désactive': {
    matomo: ['Carto', 'Installations géothermie sur nappe déclarées', 'Désactive'],
  },
  'Carto|Installations géothermie sur nappe réalisées|Active': {
    matomo: ['Carto', 'Installations géothermie sur nappe réalisées', 'Active'],
  },
  'Carto|Installations géothermie sur nappe réalisées|Désactive': {
    matomo: ['Carto', 'Installations géothermie sur nappe réalisées', 'Désactive'],
  },
  'Carto|Installations géothermie sur sonde déclarées|Active': {
    matomo: ['Carto', 'Installations géothermie sur sonde déclarées', 'Active'],
  },
  'Carto|Installations géothermie sur sonde déclarées|Désactive': {
    matomo: ['Carto', 'Installations géothermie sur sonde déclarées', 'Désactive'],
  },
  'Carto|Installations géothermie sur sonde réalisées|Active': {
    matomo: ['Carto', 'Installations géothermie sur sonde réalisées', 'Active'],
  },
  'Carto|Installations géothermie sur sonde réalisées|Désactive': {
    matomo: ['Carto', 'Installations géothermie sur sonde réalisées', 'Désactive'],
  },
  'Carto|Installations électrogènes|Active': {
    matomo: ['Carto', 'Installations électrogènes', 'Active'],
  },
  'Carto|Installations électrogènes|Désactive': {
    matomo: ['Carto', 'Installations électrogènes', 'Désactive'],
  },
  'Carto|Légende|Ferme': {
    matomo: ['Carto', 'Légende', 'Ferme'],
  },

  'Carto|Légende|Ouvre': {
    matomo: ['Carto', 'Légende', 'Ouvre'],
  },
  'Carto|Mesure de distance|Ajouter un tracé': {
    matomo: ['Carto', 'Mesure de distance', 'Ajouter un tracé'],
  },
  'Carto|Mesure de distance|Supprimer un tracé': {
    matomo: ['Carto', 'Mesure de distance', 'Supprimer un tracé'],
  },
  // outils
  'Carto|Mesure de distance|Tracé terminé': {
    matomo: ['Carto', 'Mesure de distance', 'Tracé terminé'],
  },
  'Carto|Ouvrages géothermie sur nappe déclarés|Active': {
    matomo: ['Carto', 'Ouvrages géothermie sur nappe déclarés', 'Active'],
  },
  'Carto|Ouvrages géothermie sur nappe déclarés|Désactive': {
    matomo: ['Carto', 'Ouvrages géothermie sur nappe déclarés', 'Désactive'],
  },
  'Carto|Ouvrages géothermie sur nappe réalisés|Active': {
    matomo: ['Carto', 'Ouvrages géothermie sur nappe réalisés', 'Active'],
  },
  'Carto|Ouvrages géothermie sur nappe réalisés|Désactive': {
    matomo: ['Carto', 'Ouvrages géothermie sur nappe réalisés', 'Désactive'],
  },
  'Carto|Ouvrages géothermie sur sonde déclarés|Active': {
    matomo: ['Carto', 'Ouvrages géothermie sur sonde déclarés', 'Active'],
  },
  'Carto|Ouvrages géothermie sur sonde déclarés|Désactive': {
    matomo: ['Carto', 'Ouvrages géothermie sur sonde déclarés', 'Désactive'],
  },
  'Carto|Ouvrages géothermie sur sonde réalisés|Active': {
    matomo: ['Carto', 'Ouvrages géothermie sur sonde réalisés', 'Active'],
  },
  'Carto|Ouvrages géothermie sur sonde réalisés|Désactive': {
    matomo: ['Carto', 'Ouvrages géothermie sur sonde réalisés', 'Désactive'],
  },

  'Carto|ouverture popup potentiels de raccordement': {
    matomo: ['Carto', 'ouverture popup potentiels de raccordement'],
  },
  'Carto|Périmètres de développement prioritaire|Active': {
    matomo: ['Carto', 'Périmètres de développement prioritaire', 'Active'],
  },
  'Carto|Périmètres de développement prioritaire|Désactive': {
    matomo: ['Carto', 'Périmètres de développement prioritaire', 'Désactive'],
  },
  'Carto|Périmètres géothermie profonde|Active': {
    matomo: ['Carto', 'Périmètres géothermie profonde', 'Active'],
  },
  'Carto|Périmètres géothermie profonde|Désactive': {
    matomo: ['Carto', 'Installations géothermie profonde', 'Désactive'],
  },
  'Carto|Quartiers Prioritaires politique Ville 2015 ANRU|Active': {
    matomo: ['Carto', 'Quartiers Prioritaires politique Ville 2015 ANRU', 'Active'],
  },
  'Carto|Quartiers Prioritaires politique Ville 2015 ANRU|Désactive': {
    matomo: ['Carto', 'Quartiers Prioritaires politique Ville 2015 ANRU', 'Désactive'],
  },
  'Carto|Quartiers Prioritaires politique Ville 2024|Active': {
    matomo: ['Carto', 'Quartiers Prioritaires politique Ville 2024', 'Active'],
  },
  'Carto|Quartiers Prioritaires politique Ville 2024|Désactive': {
    matomo: ['Carto', 'Quartiers Prioritaires politique Ville 2024', 'Désactive'],
  },
  'Carto|Quartiers Prioritaires politique Ville|Active': {
    matomo: ['Carto', 'Quartiers Prioritaires politique Ville', 'Active'],
  },
  'Carto|Quartiers Prioritaires politique Ville|Désactive': {
    matomo: ['Carto', 'Quartiers Prioritaires politique Ville', 'Désactive'],
  },
  'Carto|Ressources géothermales nappes|Active': {
    matomo: ['Carto', 'Ressources géothermales nappes', 'Active'],
  },
  'Carto|Ressources géothermales nappes|Désactive': {
    matomo: ['Carto', 'Ressources géothermales nappes', 'Désactive'],
  },

  // couches de la carte
  'Carto|Réseaux chaleur|Active': {
    matomo: ['Carto', 'Réseaux chaleur', 'Active'],
  },
  'Carto|Réseaux chaleur|Désactive': {
    matomo: ['Carto', 'Réseaux chaleur', 'Désactive'],
  },
  'Carto|Réseaux de froid|Active': {
    matomo: ['Carto', 'Réseaux de froid', 'Active'],
  },
  'Carto|Réseaux de froid|Désactive': {
    matomo: ['Carto', 'Réseaux de froid', 'Désactive'],
  },
  'Carto|Réseaux en construction|Active': {
    matomo: ['Carto', 'Réseaux en construction', 'Active'],
  },
  'Carto|Réseaux en construction|Désactive': {
    matomo: ['Carto', 'Réseaux en construction', 'Désactive'],
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
  "Carto|Stations d'épuration|Active": {
    matomo: ['Carto', "Stations d'épuration", 'Active'],
  },
  "Carto|Stations d'épuration|Désactive": {
    matomo: ['Carto', "Stations d'épuration", 'Désactive'],
  },
  'Carto|Tabs|enrr': {
    matomo: ['Carto', 'Tabs', 'enrr'],
  },
  'Carto|Tabs|outils': {
    matomo: ['Carto', 'Tabs', 'outils'],
  },
  'Carto|Tabs|potentiel': {
    matomo: ['Carto', 'Tabs', 'potentiel'],
  },
  'Carto|Tabs|reseaux': {
    matomo: ['Carto', 'Tabs', 'reseaux'],
  },
  'Carto|Thalassothermie|Active': {
    matomo: ['Carto', 'Thalassothermie', 'Active'],
  },
  'Carto|Thalassothermie|Désactive': {
    matomo: ['Carto', 'Thalassothermie', 'Désactive'],
  },
  "Carto|Unités d'incinération|Active": {
    matomo: ['Carto', "Unités d'incinération", 'Active'],
  },
  "Carto|Unités d'incinération|Désactive": {
    matomo: ['Carto', "Unités d'incinération", 'Désactive'],
  },
  "Carto|Zones d'opportunité froid|Active": {
    matomo: ['Carto', "Zones d'opportunité froid", 'Active'],
  },
  "Carto|Zones d'opportunité froid|Désactive": {
    matomo: ['Carto', "Zones d'opportunité froid", 'Désactive'],
  },
  "Carto|Zones d'opportunité|Active": {
    matomo: ['Carto', "Zones d'opportunité", 'Active'],
  },
  "Carto|Zones d'opportunité|Désactive": {
    matomo: ['Carto', "Zones d'opportunité", 'Désactive'],
  },
  'Carto|Zones géothermie profonde|Active': {
    matomo: ['Carto', 'Zones géothermie profonde', 'Active'],
  },
  'Carto|Zones géothermie profonde|Désactive': {
    matomo: ['Carto', 'Zones géothermie profonde', 'Désactive'],
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
  'Carto|Zones à potentiel fort froid|Active': {
    matomo: ['Carto', 'Zones à potentiel fort froid', 'Active'],
  },
  'Carto|Zones à potentiel fort froid|Désactive': {
    matomo: ['Carto', 'Zones à potentiel fort froid', 'Désactive'],
  },
  'Carto|Zones à potentiel froid|Active': {
    matomo: ['Carto', 'Zones à potentiel froid', 'Active'],
  },
  'Carto|Zones à potentiel froid|Désactive': {
    matomo: ['Carto', 'Zones à potentiel froid', 'Désactive'],
  },
  'Carto|Zones à urbaniser|Active': {
    matomo: ['Carto', 'Zones à urbaniser', 'Active'],
  },
  'Carto|Zones à urbaniser|Désactive': {
    matomo: ['Carto', 'Zones à urbaniser', 'Désactive'],
  },
  'Comparateur Coûts CO2|Chargement d’une configuration partagée': {
    matomo: ['Comparateur Coûts CO2', 'Chargement d’une configuration partagée'],
  },
  'Comparateur Coûts CO2|Chargement d’une configuration sauvegardée': {
    matomo: ['Comparateur Coûts CO2', 'Chargement d’une configuration sauvegardée'],
  },
  'Comparateur Coûts CO2|Création d’une configuration': {
    matomo: ['Comparateur Coûts CO2', 'Création d’une configuration'],
  },
  'Comparateur Coûts CO2|Partage d’une configuration': {
    matomo: ['Comparateur Coûts CO2', 'Partage d’une configuration'],
  },

  // used to test Matomo configuration
  'Debug|Event 1': {
    matomo: ['Debug', 'Debug Event 1'],
  },
  'Debug|Event 2': {
    matomo: ['Debug', 'Debug Event 2'],
  },
  'Eligibilité|Formulaire de contact inéligible - Carte - Envoi': {
    facebook: 'Formulaire de contact inéligible - Carte - Envoi',
    google: 'sdziCKqh6c0ZELGIqf89', // Contact > Formulaire envoyé - Non Eligible
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Carte - Envoi'],
  },
  'Eligibilité|Formulaire de contact inéligible - Choix chauffage - Envoi': {
    facebook: 'Formulaire de contact inéligible - Choix chauffage - Envoi',
    google: 'sdziCKqh6c0ZELGIqf89', // Contact > Formulaire envoyé - Non Eligible
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Choix chauffage - Envoi'],
  },
  'Eligibilité|Formulaire de contact inéligible - Comparateur - Envoi': {
    facebook: 'Formulaire de contact inéligible - Comparateur - Envoi',
    google: 'sdziCKqh6c0ZELGIqf89', // Contact > Formulaire envoyé - Non Eligible
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Comparateur - Envoi'],
  },
  'Eligibilité|Formulaire de contact inéligible - Envoi': {
    facebook: 'Formulaire de contact inéligible - Envoi',
    google: 'sdziCKqh6c0ZELGIqf89', // Contact > Formulaire envoyé - Non Eligible
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Envoi'],
  },
  'Eligibilité|Formulaire de contact inéligible - Fiche réseau - Envoi': {
    facebook: 'Formulaire de contact inéligible - Fiche réseau - Envoi',
    google: 'sdziCKqh6c0ZELGIqf89', // Contact > Formulaire envoyé - Non Eligible
    matomo: ['Eligibilité', 'Formulaire de contact inéligible - Fiche réseau - Envoi'],
  },

  // formulaire d'éligibilité
  'Eligibilité|Formulaire de contact éligible - Carte - Envoi': {
    facebook: 'Formulaire de contact éligible - Carte - Envoi',
    google: '47QiCKeh6c0ZELGIqf89', // Contact > Formulaire envoyé - Eligible
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Carte - Envoi'],
  },
  'Eligibilité|Formulaire de contact éligible - Choix chauffage - Envoi': {
    facebook: 'Formulaire de contact éligible - Choix chauffage - Envoi',
    google: '47QiCKeh6c0ZELGIqf89', // Contact > Formulaire envoyé - Eligible
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Choix chauffage - Envoi'],
  },
  'Eligibilité|Formulaire de contact éligible - Comparateur - Envoi': {
    facebook: 'Formulaire de contact éligible - Comparateur - Envoi',
    google: '47QiCKeh6c0ZELGIqf89', // Contact > Formulaire envoyé - Eligible
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Comparateur - Envoi'],
  },
  'Eligibilité|Formulaire de contact éligible - Envoi': {
    facebook: 'Formulaire de contact éligible - Envoi',
    google: '47QiCKeh6c0ZELGIqf89', // Contact > Formulaire envoyé - Eligible
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Envoi'],
  },
  'Eligibilité|Formulaire de contact éligible - Fiche réseau - Envoi': {
    facebook: 'Formulaire de contact éligible - Fiche réseau - Envoi',
    google: '47QiCKeh6c0ZELGIqf89', // Contact > Formulaire envoyé - Eligible
    matomo: ['Eligibilité', 'Formulaire de contact éligible - Fiche réseau - Envoi'],
  },
  'Eligibilité|Formulaire de test - Adresse Inéligible': {
    facebook: 'Formulaire de test - Adresse Inéligible',
    google: 'izv4CKGh6c0ZELGIqf89', // Formulaire - non éligible
    linkedin: 5492666,
    matomo: ['Eligibilité', 'Formulaire de test - Adresse Inéligible'],
  },
  'Eligibilité|Formulaire de test - Adresse Éligible': {
    facebook: 'Formulaire de test - Adresse Éligible',
    google: 'CFo-CKSh6c0ZELGIqf89', // Formulaire - éligible
    linkedin: 5392842,
    matomo: ['Eligibilité', 'Formulaire de test - Adresse Éligible'],
  },
  'Eligibilité|Formulaire de test - Carte - Adresse Inéligible': {
    facebook: 'Formulaire de test - Carte - Adresse Inéligible',
    google: 'izv4CKGh6c0ZELGIqf89', // Formulaire - non éligible
    linkedin: 5492666,
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Adresse Inéligible'],
  },
  'Eligibilité|Formulaire de test - Carte - Adresse Éligible': {
    facebook: 'Formulaire de test - Carte - Adresse Éligible',
    google: 'CFo-CKSh6c0ZELGIqf89', // Formulaire - éligible
    linkedin: 5392842,
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Adresse Éligible'],
  },
  'Eligibilité|Formulaire de test - Carte - Envoi': {
    facebook: 'Formulaire de test - Carte - Envoi',
    google: 'XNYRCJ6h6c0ZELGIqf89', // Test éligibilité
    linkedin: 5492674,
    matomo: ['Eligibilité', 'Formulaire de test - Carte - Envoi'],
  },
  // comparateur
  'Eligibilité|Formulaire de test - Comparateur - Adresse Inéligible': {
    facebook: 'Formulaire de test - Comparateur - Adresse Inéligible',
    google: 'izv4CKGh6c0ZELGIqf89', // Formulaire - non éligible
    linkedin: 5492666,
    matomo: ['Eligibilité', 'Formulaire de test - Comparateur - Adresse Inéligible'],
  },
  'Eligibilité|Formulaire de test - Comparateur - Adresse Éligible': {
    facebook: 'Formulaire de test - Comparateur - Adresse Éligible',
    google: 'CFo-CKSh6c0ZELGIqf89', // Formulaire - éligible
    linkedin: 5392842,
    matomo: ['Eligibilité', 'Formulaire de test - Comparateur - Adresse Éligible'],
  },
  'Eligibilité|Formulaire de test - Comparateur - Envoi': {
    facebook: 'Formulaire de test - Comparateur - Envoi',
    google: 'XNYRCJ6h6c0ZELGIqf89', // Test éligibilité
    linkedin: 5492674,
    matomo: ['Eligibilité', 'Formulaire de test - Comparateur - Envoi'],
  },
  'Eligibilité|Formulaire de test - Envoi': {
    facebook: 'Formulaire de test - Envoi',
    google: 'XNYRCJ6h6c0ZELGIqf89', // Test éligibilité
    linkedin: 5492674,
    matomo: ['Eligibilité', 'Formulaire de test - Envoi'],
  },
  // fiche réseau
  'Eligibilité|Formulaire de test - Fiche réseau - Adresse Inéligible': {
    facebook: 'Formulaire de test - Fiche réseau - Adresse Inéligible',
    google: 'izv4CKGh6c0ZELGIqf89', // Formulaire - non éligible
    linkedin: 5492666,
    matomo: ['Eligibilité', 'Formulaire de test - Fiche réseau - Adresse Inéligible'],
  },
  'Eligibilité|Formulaire de test - Fiche réseau - Adresse Éligible': {
    facebook: 'Formulaire de test - Fiche réseau - Adresse Éligible',
    google: 'CFo-CKSh6c0ZELGIqf89', // Formulaire - éligible
    linkedin: 5392842,
    matomo: ['Eligibilité', 'Formulaire de test - Fiche réseau - Adresse Éligible'],
  },
  'Eligibilité|Formulaire de test - Fiche réseau - Envoi': {
    facebook: 'Formulaire de test - Fiche réseau - Envoi',
    google: 'XNYRCJ6h6c0ZELGIqf89', // Test éligibilité
    linkedin: 5492674,
    matomo: ['Eligibilité', 'Formulaire de test - Fiche réseau - Envoi'],
  },

  'Lien|Choix chauffage vers comparateur': {
    matomo: ['Lien', 'Choix chauffage vers comparateur'],
  },

  'Outil|Carte des réseaux et potentiels': {
    matomo: ['Outil', 'Carte des réseaux et potentiels'],
  },
  "Outil|Comparateur de coûts et d'émissions de CO2": {
    matomo: ['Outil', "Comparateur de coûts et d'émissions de CO2"],
  },
  'Outil|Compatibilité des modes de chauffage': {
    matomo: ['Outil', 'Compatibilité des modes de chauffage'],
  },
  'Outil|Coûts de raccordement et aides': {
    matomo: ['Outil', 'Coûts de raccordement et aides'],
  },
  'Outil|Liste des réseaux de chaleur': {
    matomo: ['Outil', 'Liste des réseaux de chaleur'],
  },
  'Outil|Liste dépliée': {
    matomo: ['Outil', 'Liste dépliée'],
  },
  'Outil|Liste repliée': {
    matomo: ['Outil', 'Liste repliée'],
  },
  'Outil|Obligations de raccordement': {
    matomo: ['Outil', 'Obligations de raccordement'],
  },
  'Outil|Potentiel des communes sans réseau': {
    matomo: ['Outil', 'Potentiel des communes sans réseau'],
  },
  'Outil|Supports pédagogiques': {
    matomo: ['Outil', 'Supports pédagogiques'],
  },
  "Outil|Test d'adresses en masse": {
    matomo: ['Outil', 'Test d’adresses en masse'],
  },
  'Outil|Téléchargement de données et outils': {
    matomo: ['Outil', 'Téléchargement de données et outils'],
  },
  'Outils|Simulation coût raccordement': {
    matomo: ['Outils', 'Simulation coût raccordement'],
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
  'Téléchargement|Dossier Présentation|coproprietaire': {
    matomo: ['Téléchargement', 'Dossier Présentation', 'coproprietaire'],
  },
  'Téléchargement|Guide Collectivités|Collectivités et exploitants': {
    matomo: ['Téléchargement', 'Guide Collectivités', 'Collectivités et exploitants'],
  },
  'Téléchargement|Guide Exploitants|Collectivités et exploitants': {
    matomo: ['Téléchargement', 'Guide Exploitants', 'Collectivités et exploitants'],
  },
  'Téléchargement|Guide FCU|Confirmation éligibilité': {
    matomo: ['Téléchargement', 'Guide FCU', 'Confirmation éligibilité'],
  },

  // téléchargements
  'Téléchargement|Guide FCU|coproprietaire': {
    matomo: ['Téléchargement', 'Guide FCU', 'coproprietaire'],
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
  'Téléchargement|Méthodologie comparateur': {
    matomo: ['Téléchargement', 'Méthodologie comparateur'],
  },
  'Téléchargement|Schéma directeur': {
    matomo: ['Téléchargement', 'Schéma directeur'],
  },
  'Téléchargement|Supports|Auvergne-Rhône-Alpes': {
    matomo: ['Téléchargement', 'Supports', 'Auvergne-Rhône-Alpes'],
  },
  'Téléchargement|Supports|Bougogne-Franche-Comté': {
    matomo: ['Téléchargement', 'Supports', 'Bougogne-Franche-Comté'],
  },
  'Téléchargement|Supports|Bretagne': {
    matomo: ['Téléchargement', 'Supports', 'Bretagne'],
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
  'Téléchargement|Supports|Centre-Val de Loire': {
    matomo: ['Téléchargement', 'Supports', 'Centre-Val de Loire'],
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
  'Téléchargement|Supports|Grand Est': {
    matomo: ['Téléchargement', 'Supports', 'Grand Est'],
  },
  'Téléchargement|Supports|Hauts-de-France': {
    matomo: ['Téléchargement', 'Supports', 'Hauts-de-France'],
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
  'Téléchargement|Supports|Infographie Avenir': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Avenir'],
  },
  'Téléchargement|Supports|Infographie Biomasse': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Biomasse'],
  },
  'Téléchargement|Supports|Infographie Chaleur Fatale': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Chaleur Fatale'],
  },
  'Téléchargement|Supports|Infographie Classement': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Classement'],
  },
  'Téléchargement|Supports|Infographie Cout': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Cout'],
  },
  'Téléchargement|Supports|Infographie ENRR': {
    matomo: ['Téléchargement', 'Supports', 'Infographie ENRR'],
  },
  'Téléchargement|Supports|Infographie Froid': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Froid'],
  },
  'Téléchargement|Supports|Infographie Géothermie': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Géothermie'],
  },
  'Téléchargement|Supports|Infographie Ménages': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Ménages'],
  },
  'Téléchargement|Supports|Infographie Optimisation': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Optimisation'],
  },
  'Téléchargement|Supports|Infographie Solaire': {
    matomo: ['Téléchargement', 'Supports', 'Infographie Solaire'],
  },
  'Téléchargement|Supports|Normandie': {
    matomo: ['Téléchargement', 'Supports', 'Normandie'],
  },
  'Téléchargement|Supports|Nouvelle-Aquitaine': {
    matomo: ['Téléchargement', 'Supports', 'Nouvelle-Aquitaine'],
  },
  'Téléchargement|Supports|Occitanie': {
    matomo: ['Téléchargement', 'Supports', 'Occitanie'],
  },
  'Téléchargement|Supports|Pays de la Loire': {
    matomo: ['Téléchargement', 'Supports', 'Pays de la Loire'],
  },
  "Téléchargement|Supports|Provence-Alpes-Côte-d'Azur": {
    matomo: ['Téléchargement', 'Supports', "Provence-Alpes-Côte-d'Azur"],
  },
  'Téléchargement|Supports|Reportage Alsace Charras': {
    matomo: ['Téléchargement', 'Supports', 'Reportage Alsace Charras'],
  },
  'Téléchargement|Supports|Reportage chaufferie Surville': {
    matomo: ['Téléchargement', 'Supports', 'Reportage chaufferie Surville'],
  },
  'Téléchargement|Supports|Reportage datacenter Equinix': {
    matomo: ['Téléchargement', 'Supports', 'Reportage datacenter Equinix'],
  },
  'Téléchargement|Supports|Reportage géothermie Champigny': {
    matomo: ['Téléchargement', 'Supports', 'Reportage géothermie Champigny'],
  },
  'Téléchargement|Supports|Reportage Isseane': {
    matomo: ['Téléchargement', 'Supports', 'Reportage Isseane'],
  },
  'Téléchargement|Supports|Reportage réseau froid Annecy': {
    matomo: ['Téléchargement', 'Supports', 'Reportage réseau froid Annecy'],
  },
  'Téléchargement|Supports|Vidéo comment ça marche': {
    matomo: ['Téléchargement', 'Supports', 'Vidéo comment ça marche'],
  },
  'Téléchargement|Supports|Vidéo Evry-Courcouronnes': {
    matomo: ['Téléchargement', 'Supports', 'Vidéo Evry-Courcouronnes'],
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
  'Téléchargement|Supports|Île-de-France': {
    matomo: ['Téléchargement', 'Supports', 'Île-de-France'],
  },
  'Téléchargement|Tracés|carte': {
    matomo: ['Téléchargement', 'Tracés', 'carte'],
  },
  'Téléchargement|Tracés|professionnels': {
    matomo: ['Téléchargement', 'Tracés', 'professionnels'],
  },
  Vidéo: {
    matomo: ['Vidéo'],
  },
  'Villes Potentiel - Demandes|Fort Potentiel': {
    matomo: ['Villes Potentiel - Demandes', 'Fort Potentiel'],
  },
  'Villes Potentiel - Demandes|Potentiel': {
    matomo: ['Villes Potentiel - Demandes', 'Potentiel'],
  },
  'Villes Potentiel - Demandes|Réseau Existant': {
    matomo: ['Villes Potentiel - Demandes', 'Réseau Existant'],
  },
  'Villes Potentiel - Demandes|Réseau Futur': {
    matomo: ['Villes Potentiel - Demandes', 'Réseau Futur'],
  },
  'Villes Potentiel - Demandes|Sans Potentiel': {
    matomo: ['Villes Potentiel - Demandes', 'Sans Potentiel'],
  },
  'Villes Potentiel - Visites|Fort Potentiel': {
    matomo: ['Villes Potentiel - Visites', 'Fort Potentiel'],
  },
  'Villes Potentiel - Visites|Potentiel': {
    matomo: ['Villes Potentiel - Visites', 'Potentiel'],
  },
  'Villes Potentiel - Visites|Réseau Existant': {
    matomo: ['Villes Potentiel - Visites', 'Réseau Existant'],
  },
  'Villes Potentiel - Visites|Réseau Futur': {
    matomo: ['Villes Potentiel - Visites', 'Réseau Futur'],
  },
  'Villes Potentiel - Visites|Sans Potentiel': {
    matomo: ['Villes Potentiel - Visites', 'Sans Potentiel'],
  },
} as const satisfies Record<string, TrackingConfiguration>;
