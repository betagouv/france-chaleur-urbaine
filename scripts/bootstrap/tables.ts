import { type DB } from '@/server/db/kysely';

type TableInfo = {
  name: keyof DB;
  description: string;
};

export const allDatabaseTables: TableInfo[] = [
  // données utilisateur FCU
  {
    name: 'users',
    description: 'Utilisateurs de la plateforme',
  },
  {
    name: 'email_templates',
    description: "Templates d'emails",
  },
  {
    name: 'jobs',
    description: 'Tâches planifiées',
  },
  {
    name: 'pro_comparateur_configurations',
    description: 'Configurations du comparateur professionnel',
  },
  {
    name: 'pro_eligibility_tests',
    description: "Tests d'éligibilité professionnels",
  },
  {
    name: 'pro_eligibility_tests_addresses',
    description: "Adresses des tests d'éligibilité professionnels",
  },
  {
    name: 'eligibility_tests',
    description: "Tests d'éligibilité (obsolète, date d'avant le compte professionnel)",
  },
  {
    name: 'eligibility_demands',
    description: "Demandes d'éligibilité (obsolète, date d'avant le compte professionnel)",
  },
  {
    name: 'assignment_rules',
    description: "Règles d'affectation pour l'application automatique de tags",
  },

  // données de référence FCU
  {
    name: 'api_accounts',
    description: "Comptes API pour l'accès aux services (Engie uniquement)",
  },
  {
    name: 'matomo_stats',
    description: 'Statistiques mensuelles générales et principalement en provenance de Matomo',
  },
  {
    name: 'reseaux_de_chaleur',
    description: 'Réseaux de chaleur',
  },
  {
    name: 'reseaux_de_chaleur_tiles',
    description: 'Tuiles vectorielles des réseaux de chaleur',
  },
  {
    name: 'reseaux_de_froid',
    description: 'Réseaux de froid',
  },
  {
    name: 'reseaux_de_froid_tiles',
    description: 'Tuiles vectorielles des réseaux de froid',
  },
  {
    name: 'tags',
    description: 'Tags utilisés pour la mise en relation gestionnaires <-> demandes',
  },
  {
    name: 'zone_de_developpement_prioritaire',
    description: 'Zones de développement prioritaire',
  },
  {
    name: 'zone_de_developpement_prioritaire_tiles',
    description: 'Tuiles vectorielles des zones de développement prioritaire',
  },
  {
    name: 'zones_et_reseaux_en_construction',
    description: 'Zones et réseaux en construction',
  },
  {
    name: 'zones_et_reseaux_en_construction_tiles',
    description: 'Tuiles vectorielles des zones et réseaux en construction',
  },

  // données de référence / tuiles seules
  {
    name: 'regions',
    description: 'Liste des régions françaises (obsolète)',
  },
  {
    name: 'departements',
    description: 'Liste des départements français',
  },
  {
    name: 'communes',
    description: 'Liste des communes françaises (utilisées pour le comparateur des modes de chauffage)',
    // différent de ign_communes qui elle est plus à jour, mais ne contient pas les altitudes moyennes ni les températures de référence
  },
  {
    name: 'epci',
    description: 'EPCI français (utilisé pour les tags)',
  },
  {
    name: 'ign_communes',
    description: 'Données IGN des communes',
  },
  {
    name: 'ign_departements',
    description: 'Données IGN des départements',
  },
  {
    name: 'ign_regions',
    description: 'Données IGN des régions',
  },
  {
    name: 'registre_copro_r11_220125',
    description: 'Registre des copropriétés R11 du 25/01/2022',
  },
  {
    name: 'donnees_de_consos',
    description: 'Données de consommation énergétique',
  },
  {
    name: 'donnees_de_consos_tiles',
    description: 'Tuiles vectorielles des données de consommation',
  },
  {
    name: 'communes_fort_potentiel_pour_creation_reseaux_chaleur_tiles',
    description: 'Tuiles vectorielles des communes à fort potentiel pour la création de réseaux de chaleur',
  },
  {
    name: 'raccordements_tiles',
    description: 'Tuiles vectorielles des raccordements',
  },
  {
    name: 'zone_a_potentiel_chaud',
    description: 'Zones à potentiel chaud',
  },
  {
    name: 'zone_a_potentiel_chaud_tiles',
    description: 'Tuiles vectorielles des zones à potentiel chaud',
  },
  {
    name: 'zone_a_potentiel_fort_chaud',
    description: 'Zones à fort potentiel chaud',
  },
  {
    name: 'zone_a_potentiel_fort_chaud_tiles',
    description: 'Tuiles vectorielles des zones à fort potentiel chaud',
  },
  {
    name: 'batiments_raccordes_rdc',
    description: 'Bâtiments raccordés au réseau de chaleur au rez-de-chaussée',
  },
  {
    name: 'batiments_raccordes_reseaux_chaleur_froid_tiles',
    description: 'Tuiles vectorielles des bâtiments raccordés aux réseaux de chaleur et froid',
  },
  {
    name: 'besoins_en_chaleur_industrie_communes_tiles',
    description: "Tuiles vectorielles des besoins en chaleur de l'industrie par commune",
  },
  {
    name: 'besoins_en_chaleur_batiments',
    description: 'Besoins en chaleur des bâtiments',
  },
  {
    name: 'besoins_en_chaleur_tiles',
    description: 'Tuiles vectorielles des besoins en chaleur',
  },
  {
    name: 'enrr_mobilisables_friches_tiles',
    description: 'Tuiles vectorielles des friches mobilisables pour les ENR',
  },
  {
    name: 'enrr_mobilisables_parkings_tiles',
    description: 'Tuiles vectorielles des parkings mobilisables pour les ENR',
  },
  {
    name: 'enrr_mobilisables_thalassothermie_tiles',
    description: 'Tuiles des thalassothermies mobilisables pour les ENRR',
  },
  {
    name: 'enrr_mobilisables_tiles',
    description: 'Tuiles vectorielles des sites mobilisables pour les ENR',
  },
  {
    name: 'enrr_mobilisables_zones_geothermie_profonde_tiles',
    description: 'Tuiles des zones de géothermie profonde mobilisables pour les ENR',
  },
  {
    name: 'etudes_en_cours_tiles',
    description: 'Tuiles vectorielles des études en cours',
  },
  {
    name: 'pro_eligibility_tests_addresses_tiles',
    description: "Tuiles vectorielles des tests d'adresses",
  },
  {
    name: 'quartiers_prioritaires_politique_ville_2015_anru_tiles',
    description: "Tuiles des QPV 2015 de l'ANRU",
  },
  {
    name: 'quartiers_prioritaires_politique_ville_2024_tiles',
    description: 'Tuiles des QPV 2024',
  },
  {
    name: 'Donnees_de_conso_et_pdl_gaz_nat_2020',
    description: 'Données de consommation et PDL gaz naturel 2020 (obsolète)',
  },
  {
    name: 'Donnees_de_conso_et_pdl_gaz_nat_2020_tiles',
    description: 'Tuiles des données de consommation et PDL gaz naturel 2020 (obsolète)',
  },
  {
    name: 'installations_geothermie_profonde_tiles',
    description: 'Tuiles des installations de géothermie profonde',
  },
  {
    name: 'perimetres_geothermie_profonde_tiles',
    description: 'Tuiles des périmètres de géothermie profonde',
  },
  {
    name: 'installations_geothermie_surface_echangeurs_fermes_tiles',
    description: 'Tuiles des installations de géothermie en surface avec échangeurs fermés',
  },
  {
    name: 'installations_geothermie_surface_echangeurs_ouverts_tiles',
    description: 'Tuiles des installations de géothermie en surface avec échangeurs ouverts',
  },
  {
    name: 'ouvrages_geothermie_surface_echangeurs_fermes_tiles',
    description: 'Ouvrages de géothermie en surface avec échangeurs fermés',
  },
  {
    name: 'ouvrages_geothermie_surface_echangeurs_ouverts_tiles',
    description: 'Ouvrages de géothermie en surface avec échangeurs ouverts',
  },

  // données BDNB (Base de données nationale des bâtiments)
  // découpées historiquement par région pour résoudre des problèmes de performance et de taille d'indexes
  // la prochaine fois, n'avoir qu'une seule
  {
    name: 'bdnb_registre2022_aura',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Auvergne-Rhône-Alpes',
  },
  {
    name: 'bdnb_registre2022_bourgogne-franche-comte',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Bourgogne-Franche-Comté',
  },
  {
    name: 'bdnb_registre2022_bretagne',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Bretagne',
  },
  {
    name: 'bdnb_registre2022_centre-val_de_loire',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Centre-Val de Loire',
  },
  {
    name: 'bdnb_registre2022_corse',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Corse',
  },
  {
    name: 'bdnb_registre2022_grand_est',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Grand Est',
  },
  {
    name: 'bdnb_registre2022_hauts-de-france',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Hauts-de-France',
  },
  {
    name: 'bdnb_registre2022_ile-de-france',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Île-de-France',
  },
  {
    name: 'bdnb_registre2022_normandie',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Normandie',
  },
  {
    name: 'bdnb_registre2022_nouvelle-aquitaine',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Nouvelle-Aquitaine',
  },
  {
    name: 'bdnb_registre2022_occitanie',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Occitanie',
  },
  {
    name: 'bdnb_registre2022_paca',
    description: "BDNB complétée avec le registre des copropriétés 2022 pour la région Provence-Alpes-Côte d'Azur",
  },
  {
    name: 'bdnb_registre2022_pays-de-la-loire',
    description: 'BDNB complétée avec le registre des copropriétés 2022 pour la région Pays de la Loire',
  },
  {
    name: 'bnb_auvergne-rhone-alpes-batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Auvergne-Rhône-Alpes',
  },
  {
    name: 'bnb_bourgogne-franche-comte-batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Bourgogne-Franche-Comté',
  },
  {
    name: 'bnb_bretagne-batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Bretagne',
  },
  {
    name: 'bnb_centre-val-de-loire-batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Centre-Val de Loire',
  },
  {
    name: 'bnb_corse-batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Corse',
  },
  {
    name: 'bnb_grand-est-batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Grand Est',
  },
  {
    name: 'bnb_hauts-de-france-batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Hauts-de-France',
  },
  {
    name: 'bnb_idf - batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Île-de-France',
  },
  {
    name: 'bnb_normandie-batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Normandie',
  },
  {
    name: 'bnb_nouvelle-aquitaine-batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Nouvelle-Aquitaine',
  },
  {
    name: 'bnb_occitanie-batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Occitanie',
  },
  {
    name: 'bnb_pays-de-la-loire-batiment_adresse',
    description: 'Relation bâtiment-adresse BDNB pour Pays de la Loire',
  },
  {
    name: 'bnb_provence-alpes-cote-d_azur-batiment_adresse',
    description: "Relation bâtiment-adresse BDNB pour Provence-Alpes-Côte d'Azur",
  },

  {
    name: 'bnb - adresse_tiles',
    description: 'Tuiles vectorielles des adresses BDNB',
  },
  {
    name: 'bnb - batiment_tiles',
    description: 'Tuiles vectorielles des bâtiments BDNB',
  },
];
