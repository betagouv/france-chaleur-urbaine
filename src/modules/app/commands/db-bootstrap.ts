import prompts from 'prompts';

import type { DB } from '@/server/db/kysely';

// Bundles de tables pour `pnpm db:bootstrap` : chaque bundle est fermé sur ses clés étrangères (sauf dépendance indiquée),
// de sorte qu'un bundle entier s'importe toujours sans violation de FK.
// Les tailles sont indicatives (mesurées sur une base locale complète) et servent uniquement au choix dans le prompt.
export const bootstrapBundles = {
  'externes-volumineux': {
    description: 'BDNB (~18 Go), BatEnr (~18 Go), besoins en chaleur des bâtiments (~10 Go), tuiles BDNB (~5 Go)',
    title: 'Données externes volumineuses',
  },
  fcu: {
    description: 'Utilisateurs, demandes, réseaux, événements, modifications réseaux… (~250 Mo)',
    title: 'Données métier FCU',
  },
  'fcu-volumineux': {
    description: 'Adresses des tests pro (~2,3 Go) et fichiers uploadés (~400 Mo) — nécessite le bundle fcu',
    title: 'Données métier FCU volumineuses',
  },
  geo: {
    description: 'Communes, départements, EPCI, IGN (~1,3 Go), zones à potentiel, QPV, consommations (~1,5 Go)',
    title: 'Référentiels géographiques et couches sources',
  },
  tiles: {
    description: 'Toutes les tables *_tiles hors BDNB (~2 Go, dont besoins en chaleur ~1,4 Go)',
    title: 'Tuiles vectorielles',
  },
} as const satisfies Record<string, { title: string; description: string }>;

export type BootstrapBundle = keyof typeof bootstrapBundles;
// ordre d'affichage dans le prompt (du plus courant au plus lourd)
export const bootstrapBundleNames = [
  'fcu',
  'fcu-volumineux',
  'geo',
  'tiles',
  'externes-volumineux',
] as const satisfies readonly BootstrapBundle[];

type TableInfo = {
  name: keyof DB;
  description: string;
  bundle: BootstrapBundle;
};

// L'ordre des tables détermine l'ordre des DELETE lors de l'import (--data-only) :
// une table référençant une autre sans ON DELETE CASCADE / SET NULL doit précéder la table référencée.
// Toute nouvelle table créée par une migration doit être ajoutée ici dans le bon bundle.
export const allDatabaseTables = [
  // --- Données métier FCU ---
  {
    bundle: 'fcu',
    description: 'Organisations gestionnaires',
    name: 'organizations',
  },
  {
    bundle: 'fcu',
    description: "Clés d'API des organisations",
    name: 'organization_api_credentials',
  },
  {
    // avant users : FK author_id sans ON DELETE CASCADE
    bundle: 'fcu',
    description: 'Relances liées aux réseaux',
    name: 'network_reminders',
  },
  {
    bundle: 'fcu',
    description: 'Utilisateurs de la plateforme',
    name: 'users',
  },
  {
    bundle: 'fcu',
    description: 'Permissions des utilisateurs',
    name: 'user_permissions',
  },
  {
    bundle: 'fcu',
    description: 'Catalogue des étiquettes utilisateurs',
    name: 'user_tags',
  },
  {
    bundle: 'fcu',
    description: 'Affectations des étiquettes aux utilisateurs',
    name: 'user_tag_assignments',
  },
  {
    bundle: 'fcu',
    description: "Templates d'emails",
    name: 'email_templates',
  },
  {
    bundle: 'fcu',
    description: 'Contacts bloqués chez Brevo (bounces, plaintes, désinscriptions)',
    name: 'email_blocked_contacts',
  },
  {
    bundle: 'fcu',
    description: 'Tâches planifiées',
    name: 'jobs',
  },
  {
    bundle: 'fcu',
    description: 'Configurations du comparateur professionnel',
    name: 'pro_comparateur_configurations',
  },
  {
    bundle: 'fcu',
    description: "Tests d'éligibilité professionnels",
    name: 'pro_eligibility_tests',
  },
  {
    bundle: 'fcu',
    description: "Demandes d'éligibilité",
    name: 'demands',
  },
  {
    bundle: 'fcu',
    description: 'Emails envoyés pour les demandes',
    name: 'demand_emails',
  },
  {
    bundle: 'fcu',
    description: 'Demandes de chaleur renouvelable (communes sans réseau)',
    name: 'demands_chaleur_renouvelable',
  },
  {
    bundle: 'fcu',
    description: 'Suivi des simulations du parcours chaleur renouvelable',
    name: 'simulations_chaleur_renouvelable',
  },
  {
    bundle: 'fcu',
    description: "Emails envoyés pour les demandes d'accompagnement CCRT",
    name: 'ccrt_demand_emails',
  },
  {
    bundle: 'fcu',
    description: "Notes de suivi des demandes d'accompagnement CCRT",
    name: 'ccrt_demand_notes',
  },
  {
    bundle: 'fcu',
    description: "Événements pour le suivi de l'activité des utilisateurs",
    name: 'events',
  },
  {
    bundle: 'fcu',
    description: 'Sources de suivi des conversions',
    name: 'conversion_sources',
  },
  {
    bundle: 'fcu',
    description: 'Événements de conversion',
    name: 'conversion_events',
  },
  {
    bundle: 'fcu',
    description: "Règles d'exclusion d'IP du suivi des conversions",
    name: 'conversion_ip_rules',
  },
  {
    bundle: 'fcu',
    description: 'Demandes de modification de réseaux',
    name: 'network_change_requests',
  },
  {
    bundle: 'fcu',
    description: 'Géométries soumises avec les demandes de modification de réseaux',
    name: 'network_change_request_geometries',
  },
  {
    bundle: 'fcu',
    description: 'Statistiques mensuelles générales et principalement en provenance de Matomo',
    name: 'matomo_stats',
  },
  {
    bundle: 'fcu',
    description: 'Réseaux de chaleur',
    name: 'reseaux_de_chaleur',
  },
  {
    bundle: 'fcu',
    description: 'Réseaux de froid',
    name: 'reseaux_de_froid',
  },
  {
    bundle: 'fcu',
    description: 'Zones de développement prioritaire',
    name: 'zone_de_developpement_prioritaire',
  },
  {
    bundle: 'fcu',
    description: 'Zones et réseaux en construction',
    name: 'zones_et_reseaux_en_construction',
  },
  {
    bundle: 'fcu',
    description: 'Études en cours (source Grist)',
    name: 'etudes_en_cours',
  },

  // --- Données métier FCU volumineuses (nécessitent le bundle fcu : FK vers demands, pro_eligibility_tests, reseaux) ---
  {
    bundle: 'fcu-volumineux',
    description: "Adresses des tests d'éligibilité professionnels",
    name: 'pro_eligibility_tests_addresses',
  },
  {
    bundle: 'fcu-volumineux',
    description: 'Fichiers uploadés (contenu binaire inclus)',
    name: 'files',
  },
  {
    bundle: 'fcu-volumineux',
    description: 'Fichiers attachés aux réseaux',
    name: 'network_files',
  },
  {
    bundle: 'fcu-volumineux',
    description: 'Fichiers attachés aux demandes de modification de réseaux',
    name: 'network_change_request_files',
  },

  // --- Référentiels géographiques et couches sources ---
  {
    // avant departements : FK departement_id sans ON DELETE CASCADE
    bundle: 'geo',
    description: 'Liste des communes françaises (utilisées pour le comparateur des modes de chauffage)',
    name: 'communes',
    // différent de ign_communes qui elle est plus à jour, mais ne contient pas les altitudes moyennes ni les températures de référence
  },
  {
    bundle: 'geo',
    description: 'Liste des départements français',
    name: 'departements',
  },
  {
    bundle: 'geo',
    description: 'EPCI français',
    name: 'epci',
  },
  {
    bundle: 'geo',
    description: 'EPT français',
    name: 'ept',
  },
  {
    bundle: 'geo',
    description: 'Données IGN des communes',
    name: 'ign_communes',
  },
  {
    bundle: 'geo',
    description: 'Données IGN des départements',
    name: 'ign_departements',
  },
  {
    bundle: 'geo',
    description: 'Données IGN des régions',
    name: 'ign_regions',
  },
  {
    bundle: 'geo',
    description: 'Données de consommation énergétique',
    name: 'donnees_de_consos',
  },
  {
    bundle: 'geo',
    description: 'Zones à potentiel chaud',
    name: 'zone_a_potentiel_chaud',
  },
  {
    bundle: 'geo',
    description: 'Zones à fort potentiel chaud',
    name: 'zone_a_potentiel_fort_chaud',
  },
  {
    bundle: 'geo',
    description: 'Zones à potentiel froid',
    name: 'zone_a_potentiel_froid',
  },
  {
    bundle: 'geo',
    description: 'Zones à fort potentiel froid',
    name: 'zone_a_potentiel_fort_froid',
  },
  {
    bundle: 'geo',
    description: 'Quartiers prioritaires de la politique de la ville (QPV)',
    name: 'quartiers_prioritaires_politique_ville',
  },

  // --- Tuiles vectorielles ---
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des réseaux de chaleur',
    name: 'reseaux_de_chaleur_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des réseaux de froid',
    name: 'reseaux_de_froid_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des zones de développement prioritaire',
    name: 'zone_de_developpement_prioritaire_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des zones et réseaux en construction',
    name: 'zones_et_reseaux_en_construction_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des données de consommation',
    name: 'donnees_de_consos_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des communes à fort potentiel pour la création de réseaux de chaleur',
    name: 'communes_fort_potentiel_pour_creation_reseaux_chaleur_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des raccordements',
    name: 'raccordements_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des zones à potentiel chaud',
    name: 'zone_a_potentiel_chaud_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des zones à fort potentiel chaud',
    name: 'zone_a_potentiel_fort_chaud_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des zones à potentiel froid',
    name: 'zone_a_potentiel_froid_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des zones à fort potentiel froid',
    name: 'zone_a_potentiel_fort_froid_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des bâtiments raccordés aux réseaux de chaleur et froid',
    name: 'batiments_raccordes_reseaux_chaleur_froid_tiles',
  },
  {
    bundle: 'tiles',
    description: "Tuiles vectorielles des besoins en chaleur de l'industrie par commune",
    name: 'besoins_en_chaleur_industrie_communes_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des besoins en chaleur',
    name: 'besoins_en_chaleur_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des friches mobilisables pour les ENR',
    name: 'enrr_mobilisables_friches_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des parkings mobilisables pour les ENR',
    name: 'enrr_mobilisables_parkings_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles des thalassothermies mobilisables pour les ENRR',
    name: 'enrr_mobilisables_thalassothermie_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des sites mobilisables pour les ENR',
    name: 'enrr_mobilisables_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles des zones de géothermie profonde mobilisables pour les ENR',
    name: 'enrr_mobilisables_zones_geothermie_profonde_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des études en cours',
    name: 'etudes_en_cours_tiles',
  },
  {
    bundle: 'tiles',
    description: "Tuiles des QPV 2015 de l'ANRU",
    name: 'quartiers_prioritaires_politique_ville_2015_anru_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles des QPV 2024',
    name: 'quartiers_prioritaires_politique_ville_2024_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles vectorielles des zones à urbaniser',
    name: 'zone_a_urbaniser_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles des installations de géothermie profonde',
    name: 'installations_geothermie_profonde_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles des périmètres de géothermie profonde',
    name: 'perimetres_geothermie_profonde_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles des installations de géothermie en surface avec échangeurs fermés',
    name: 'installations_geothermie_surface_echangeurs_fermes_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles des installations de géothermie en surface avec échangeurs ouverts',
    name: 'installations_geothermie_surface_echangeurs_ouverts_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles des ouvrages de géothermie en surface avec échangeurs fermés',
    name: 'ouvrages_geothermie_surface_echangeurs_fermes_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles des ouvrages de géothermie en surface avec échangeurs ouverts',
    name: 'ouvrages_geothermie_surface_echangeurs_ouverts_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Tuiles des ressources géothermales en nappes',
    name: 'ressources_geothermales_nappes_tiles',
  },
  {
    bundle: 'tiles',
    description: 'Dates de dernière modification des sources de tuiles',
    name: 'tiles_metadata',
  },

  // --- Données externes volumineuses ---
  {
    bundle: 'externes-volumineux',
    description: 'Bâtiments issus de la BDNB',
    name: 'bdnb_batiments',
  },
  {
    bundle: 'externes-volumineux',
    description: 'Tuiles des bâtiments issus de la BDNB',
    name: 'bdnb_batiments_tiles',
  },
  {
    bundle: 'externes-volumineux',
    description: 'Bâtiments issus de BatEnr',
    name: 'bdnb_batenr',
  },
  {
    bundle: 'externes-volumineux',
    description: 'Besoins en chaleur des bâtiments',
    name: 'besoins_en_chaleur_batiments',
  },
] as const satisfies readonly TableInfo[];

type UnregisteredTables = Exclude<keyof DB, (typeof allDatabaseTables)[number]['name']>;
// Échoue à la compilation (pnpm ts) si une table de database.ts n'est pas enregistrée ci-dessus : le type nomme la table manquante
const _allTablesRegistered: UnregisteredTables extends never ? true : UnregisteredTables = true;

/**
 * Sélectionne les tables à télécharger : par bundles passés en option, sinon via un prompt en deux temps
 * (bundles, puis affinage optionnel table par table). L'ordre de `allDatabaseTables` est conservé.
 */
export async function selectBootstrapTables(bundles: BootstrapBundle[]): Promise<string[]> {
  let selectedBundles = bundles;
  if (selectedBundles.length === 0) {
    const answer = (await prompts({
      choices: bootstrapBundleNames.map((bundle) => ({
        description: bootstrapBundles[bundle].description,
        selected: bundle === 'fcu',
        title: bootstrapBundles[bundle].title,
        value: bundle,
      })),
      hint: '- Espace pour sélectionner/désélectionner, Entrée pour valider',
      message: 'Sélectionnez les bundles à télécharger :',
      name: 'bundles',
      type: 'multiselect',
    })) as { bundles?: BootstrapBundle[] };
    selectedBundles = answer.bundles ?? [];
    if (selectedBundles.length === 0) return [];
  }

  const bundleTables = allDatabaseTables.filter((table) => selectedBundles.includes(table.bundle));
  if (bundles.length > 0) return bundleTables.map((table) => table.name);

  const { refine } = (await prompts({
    initial: false,
    message: 'Affiner la sélection table par table ?',
    name: 'refine',
    type: 'confirm',
  })) as { refine?: boolean };
  if (!refine) return bundleTables.map((table) => table.name);

  const { selectedTables } = (await prompts({
    choices: bundleTables.map((table) => ({
      selected: true,
      title: `${table.name} - ${table.description}`,
      value: table.name,
    })),
    hint: '- Espace pour sélectionner/désélectionner, Entrée pour valider',
    message: 'Sélectionnez les tables à télécharger :',
    name: 'selectedTables',
    type: 'multiselect',
  })) as { selectedTables?: string[] };
  return selectedTables ?? [];
}
