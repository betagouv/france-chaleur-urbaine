import type { DB } from '@/server/db/kysely';

type TableInfo = {
  name: keyof DB;
  description: string;
};

export const allDatabaseTables: TableInfo[] = [
  // données utilisateur FCU
  {
    description: 'Utilisateurs de la plateforme',
    name: 'users',
  },
  {
    description: "Templates d'emails",
    name: 'email_templates',
  },
  {
    description: 'Tâches planifiées',
    name: 'jobs',
  },
  {
    description: 'Configurations du comparateur professionnel',
    name: 'pro_comparateur_configurations',
  },
  {
    description: "Tests d'éligibilité professionnels",
    name: 'pro_eligibility_tests',
  },
  {
    description: "Adresses des tests d'éligibilité professionnels",
    name: 'pro_eligibility_tests_addresses',
  },
  {
    description: "Règles d'affectation pour l'application automatique de tags",
    name: 'assignment_rules',
  },
  {
    description: "Événements pour le suivi de l'activité des utilisateurs",
    name: 'events',
  },

  // données de référence FCU
  {
    description: "Comptes API pour l'accès aux services (Engie uniquement)",
    name: 'api_accounts',
  },
  {
    description: 'Statistiques mensuelles générales et principalement en provenance de Matomo',
    name: 'matomo_stats',
  },
  {
    description: 'Réseaux de chaleur',
    name: 'reseaux_de_chaleur',
  },
  {
    description: 'Tuiles vectorielles des réseaux de chaleur',
    name: 'reseaux_de_chaleur_tiles',
  },
  {
    description: 'Réseaux de froid',
    name: 'reseaux_de_froid',
  },
  {
    description: 'Tuiles vectorielles des réseaux de froid',
    name: 'reseaux_de_froid_tiles',
  },
  {
    description: 'Tags utilisés pour la mise en relation gestionnaires <-> demandes',
    name: 'tags',
  },
  {
    description: 'Zones de développement prioritaire',
    name: 'zone_de_developpement_prioritaire',
  },
  {
    description: 'Tuiles vectorielles des zones de développement prioritaire',
    name: 'zone_de_developpement_prioritaire_tiles',
  },
  {
    description: 'Zones et réseaux en construction',
    name: 'zones_et_reseaux_en_construction',
  },
  {
    description: 'Tuiles vectorielles des zones et réseaux en construction',
    name: 'zones_et_reseaux_en_construction_tiles',
  },

  // données de référence / tuiles seules
  {
    description: 'Liste des départements français',
    name: 'departements',
  },
  {
    description: 'Liste des communes françaises (utilisées pour le comparateur des modes de chauffage)',
    name: 'communes',
    // différent de ign_communes qui elle est plus à jour, mais ne contient pas les altitudes moyennes ni les températures de référence
  },
  {
    description: 'EPCI français (utilisé pour les tags)',
    name: 'epci',
  },
  {
    description: 'Données IGN des communes',
    name: 'ign_communes',
  },
  {
    description: 'Données IGN des départements',
    name: 'ign_departements',
  },
  {
    description: 'Données IGN des régions',
    name: 'ign_regions',
  },
  {
    description: 'Données de consommation énergétique',
    name: 'donnees_de_consos',
  },
  {
    description: 'Tuiles vectorielles des données de consommation',
    name: 'donnees_de_consos_tiles',
  },
  {
    description: 'Tuiles vectorielles des communes à fort potentiel pour la création de réseaux de chaleur',
    name: 'communes_fort_potentiel_pour_creation_reseaux_chaleur_tiles',
  },
  {
    description: 'Tuiles vectorielles des raccordements',
    name: 'raccordements_tiles',
  },
  {
    description: 'Zones à potentiel chaud',
    name: 'zone_a_potentiel_chaud',
  },
  {
    description: 'Tuiles vectorielles des zones à potentiel chaud',
    name: 'zone_a_potentiel_chaud_tiles',
  },
  {
    description: 'Zones à fort potentiel chaud',
    name: 'zone_a_potentiel_fort_chaud',
  },
  {
    description: 'Tuiles vectorielles des zones à fort potentiel chaud',
    name: 'zone_a_potentiel_fort_chaud_tiles',
  },
  {
    description: 'Zones à potentiel froid',
    name: 'zone_a_potentiel_froid',
  },
  {
    description: 'Tuiles vectorielles des zones à potentiel froid',
    name: 'zone_a_potentiel_froid_tiles',
  },
  {
    description: 'Zones à fort potentiel froid',
    name: 'zone_a_potentiel_fort_froid',
  },
  {
    description: 'Tuiles vectorielles des zones à fort potentiel froid',
    name: 'zone_a_potentiel_fort_froid_tiles',
  },
  {
    description: 'Tuiles vectorielles des bâtiments raccordés aux réseaux de chaleur et froid',
    name: 'batiments_raccordes_reseaux_chaleur_froid_tiles',
  },
  {
    description: "Tuiles vectorielles des besoins en chaleur de l'industrie par commune",
    name: 'besoins_en_chaleur_industrie_communes_tiles',
  },
  {
    description: 'Besoins en chaleur des bâtiments',
    name: 'besoins_en_chaleur_batiments',
  },
  {
    description: 'Tuiles vectorielles des besoins en chaleur',
    name: 'besoins_en_chaleur_tiles',
  },
  {
    description: 'Tuiles vectorielles des friches mobilisables pour les ENR',
    name: 'enrr_mobilisables_friches_tiles',
  },
  {
    description: 'Tuiles vectorielles des parkings mobilisables pour les ENR',
    name: 'enrr_mobilisables_parkings_tiles',
  },
  {
    description: 'Tuiles des thalassothermies mobilisables pour les ENRR',
    name: 'enrr_mobilisables_thalassothermie_tiles',
  },
  {
    description: 'Tuiles vectorielles des sites mobilisables pour les ENR',
    name: 'enrr_mobilisables_tiles',
  },
  {
    description: 'Tuiles des zones de géothermie profonde mobilisables pour les ENR',
    name: 'enrr_mobilisables_zones_geothermie_profonde_tiles',
  },
  {
    description: 'Tuiles vectorielles des études en cours',
    name: 'etudes_en_cours_tiles',
  },
  {
    description: "Tuiles vectorielles des tests d'adresses",
    name: 'pro_eligibility_tests_addresses_tiles',
  },
  {
    description: "Tuiles des QPV 2015 de l'ANRU",
    name: 'quartiers_prioritaires_politique_ville_2015_anru_tiles',
  },
  {
    description: 'Tuiles des QPV 2024',
    name: 'quartiers_prioritaires_politique_ville_2024_tiles',
  },
  {
    description: 'Tuiles des installations de géothermie profonde',
    name: 'installations_geothermie_profonde_tiles',
  },
  {
    description: 'Tuiles des périmètres de géothermie profonde',
    name: 'perimetres_geothermie_profonde_tiles',
  },
  {
    description: 'Tuiles des installations de géothermie en surface avec échangeurs fermés',
    name: 'installations_geothermie_surface_echangeurs_fermes_tiles',
  },
  {
    description: 'Tuiles des installations de géothermie en surface avec échangeurs ouverts',
    name: 'installations_geothermie_surface_echangeurs_ouverts_tiles',
  },
  {
    description: 'Tuiles des ouvrages de géothermie en surface avec échangeurs fermés',
    name: 'ouvrages_geothermie_surface_echangeurs_fermes_tiles',
  },
  {
    description: 'Tuiles des ouvrages de géothermie en surface avec échangeurs ouverts',
    name: 'ouvrages_geothermie_surface_echangeurs_ouverts_tiles',
  },
  {
    description: 'Tuiles des ressources géothermales en nappes',
    name: 'ressources_geothermales_nappes_tiles',
  },

  // données BDNB (Base de données nationale des bâtiments)
  {
    description: 'Bâtiments issus de la BDNB',
    name: 'bdnb_batiments',
  },
  {
    description: 'Tuiles des bâtiments issus de la BDNB',
    name: 'bdnb_batiments_tiles',
  },
];
