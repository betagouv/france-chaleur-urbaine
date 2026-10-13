import type { DB } from '@/server/db/kysely';

/**
 * Who owns the value of a heat / cold network column. Client-safe (types only): read by the admin, the documentation
 * inventory and the tests, so a column can never be without a documented source.
 */
export const networkFieldSources = ['admin', 'fedene', 'sdes', 'arrete_dpe', 'ecoreseau', 'geometrie', 'systeme', 'historique'] as const;
export type NetworkFieldSource = (typeof networkFieldSources)[number];

export const networkFieldSourceDefinitions: Record<NetworkFieldSource, { label: string; description: string }> = {
  admin: {
    description: "Saisi dans l'admin FCU (fenêtre de modification) ou appliqué depuis une demande de modification traitée.",
    label: 'Admin FCU',
  },
  arrete_dpe: {
    description: "Valeur réglementaire importée chaque année depuis l'annexe de l'arrêté DPE (pnpm cli data import arrete-dpe).",
    label: 'Arrêté DPE',
  },
  ecoreseau: {
    description: 'Label Écoréseau de chaleur (AMORCE), importé par commande.',
    label: 'Écoréseau',
  },
  fedene: {
    description: 'Enquête annuelle de la bibliothèque FEDENE (pnpm cli data import donnees-reseaux-bibliotheque-fedene).',
    label: 'Enquête FEDENE',
  },
  geometrie: {
    description: "Calculé automatiquement à partir du tracé (communes, département, région, présence d'un tracé ou d'un PDP).",
    label: 'Dérivé du tracé',
  },
  historique: {
    description:
      "Valeur héritée du dernier import Airtable, plus alimentée par aucune source : à réaffecter ou supprimer lors de l'harmonisation.",
    label: 'Historique (plus alimenté)',
  },
  sdes: {
    description: 'Puissances installées, données locales de l’énergie du SDES (pnpm cli data import donnees-reseaux-sdes).',
    label: 'SDES',
  },
  systeme: {
    description: 'Identifiant ou horodatage géré par l’application.',
    label: 'Système',
  },
};

export type NetworkFieldDefinition = {
  source: NetworkFieldSource;
  /** French label, as shown to the team */
  label: string;
  unit?: string;
  /** Snake-case name planned for the column rename step of the harmonisation (unset when the current name is fine). */
  canonicalName?: string;
  /** Tables carrying the column; both when unset. */
  tables?: readonly ('reseaux_de_chaleur' | 'reseaux_de_froid')[];
};

type NetworkColumn = keyof DB['reseaux_de_chaleur'] | keyof DB['reseaux_de_froid'];

const chaleurOnly = ['reseaux_de_chaleur'] as const;

const production = (label: string): NetworkFieldDefinition => ({
  label: `Production ${label}`,
  source: 'fedene',
  tables: chaleurOnly,
  unit: 'MWh',
});
const puissance = (label: string): NetworkFieldDefinition => ({
  label: `Puissance ${label}`,
  source: 'sdes',
  tables: chaleurOnly,
  unit: 'MW',
});

/** Source, label and unit of every column of the heat and cold network tables. */
export const networkFieldDefinitions = {
  adresse_mo: { canonicalName: 'adresse_maitre_ouvrage', label: "Adresse du maître d'ouvrage", source: 'historique' },
  annee_creation: { label: 'Année de création', source: 'historique' },
  CP_MO: { canonicalName: 'code_postal_maitre_ouvrage', label: "Code postal du maître d'ouvrage", source: 'historique' },
  communes: { label: 'Communes', source: 'geometrie' },
  communes_insee: { label: 'Codes INSEE des communes', source: 'geometrie' },
  'contenu CO2': { canonicalName: 'contenu_co2', label: 'Contenu CO2', source: 'arrete_dpe', unit: 'kg CO2/kWh' },
  'contenu CO2 ACV': {
    canonicalName: 'contenu_co2_acv',
    label: 'Contenu CO2 en analyse de cycle de vie',
    source: 'arrete_dpe',
    unit: 'kg CO2/kWh',
  },
  contenu_CO2_2023_tmp: { label: 'Contenu CO2 2023 (temporaire)', source: 'historique' },
  contenu_CO2_ACV_2023_tmp: { label: 'Contenu CO2 ACV 2023 (temporaire)', source: 'historique' },
  'Dev_reseau%': {
    canonicalName: 'developpement_reseau_pct',
    label: 'Développement du réseau',
    source: 'fedene',
    tables: chaleurOnly,
    unit: '%',
  },
  date_actualisation_pdp: { label: 'Date de mise à jour du PDP', source: 'geometrie', tables: chaleurOnly },
  date_actualisation_trace: { label: 'Date de mise à jour du tracé', source: 'geometrie' },
  departement: { label: 'Département', source: 'geometrie' },
  eau_chaude: { label: 'Eau chaude', source: 'historique', tables: chaleurOnly },
  eau_surchauffee: { label: 'Eau surchauffée', source: 'historique', tables: chaleurOnly },
  ecoreseau: { label: 'Label Écoréseau', source: 'ecoreseau', tables: chaleurOnly },
  fichiers: { label: 'Fichiers (remplacé par les documents publiés)', source: 'historique' },
  Gestionnaire: {
    canonicalName: 'gestionnaire',
    label: 'Gestionnaire (affiché : correction FCU sinon enquête)',
    source: 'systeme',
  },
  geom: { label: 'Tracé', source: 'admin' },
  geom_update: { label: 'Brouillon de tracé', source: 'admin' },
  gestionnaire_fcu: { label: 'Gestionnaire corrigé par FCU', source: 'admin' },
  gestionnaire_fedene: { label: 'Gestionnaire (enquête)', source: 'fedene' },
  has_PDP: { canonicalName: 'has_pdp', label: 'A un PDP', source: 'geometrie', tables: chaleurOnly },
  has_trace: { label: 'A un tracé', source: 'geometrie' },
  'Identifiant reseau': { canonicalName: 'identifiant_sncu', label: 'Identifiant SNCU', source: 'admin' },
  id_fcu: { label: 'Identifiant FCU', source: 'systeme' },
  informationsComplementaires: { canonicalName: 'informations_complementaires', label: 'Informations complémentaires', source: 'admin' },
  livraisons_agriculture_MWh: {
    canonicalName: 'livraisons_agriculture_mwh',
    label: 'Livraisons agriculture',
    source: 'fedene',
    unit: 'MWh',
  },
  livraisons_autre_MWh: { canonicalName: 'livraisons_autre_mwh', label: 'Livraisons autres', source: 'fedene', unit: 'MWh' },
  livraisons_industrie_MWh: { canonicalName: 'livraisons_industrie_mwh', label: 'Livraisons industrie', source: 'fedene', unit: 'MWh' },
  livraisons_residentiel_MWh: {
    canonicalName: 'livraisons_residentiel_mwh',
    label: 'Livraisons résidentiel',
    source: 'fedene',
    unit: 'MWh',
  },
  livraisons_tertiaire_MWh: { canonicalName: 'livraisons_tertiaire_mwh', label: 'Livraisons tertiaire', source: 'fedene', unit: 'MWh' },
  livraisons_totale_MWh: { canonicalName: 'livraisons_totales_mwh', label: 'Livraisons totales', source: 'fedene', unit: 'MWh' },
  longueur_reseau: { label: 'Longueur du réseau', source: 'historique', unit: 'km' },
  MO: { canonicalName: 'maitre_ouvrage', label: "Maître d'ouvrage (affiché : correction FCU sinon enquête)", source: 'systeme' },
  'Moyenne-annee-DPE': { canonicalName: 'annee_reference_dpe', label: 'Année de référence (arrêté DPE)', source: 'arrete_dpe' },
  mo_fcu: { label: "Maître d'ouvrage corrigé par FCU", source: 'admin' },
  mo_fedene: { label: "Maître d'ouvrage (enquête)", source: 'fedene' },
  nb_pdl: { label: 'Points de livraison', source: 'fedene' },
  nom_reseau: { label: 'Nom du réseau (affiché : correction FCU sinon enquête)', source: 'systeme' },
  nom_reseau_fcu: { label: 'Nom du réseau corrigé par FCU', source: 'admin' },
  nom_reseau_fedene: { label: 'Nom du réseau (enquête)', source: 'fedene' },
  notes: { label: 'Notes internes', source: 'admin' },
  organization_id: { label: 'Organisation', source: 'admin' },
  ouvert_aux_raccordements: { label: 'Ouvert aux raccordements', source: 'admin', tables: chaleurOnly },
  'PF%': { canonicalName: 'part_fixe_pct', label: 'Part fixe du prix', source: 'fedene', tables: chaleurOnly, unit: '%' },
  PM: { canonicalName: 'prix_moyen_ttc_mwh', label: 'Prix moyen', source: 'fedene', tables: chaleurOnly, unit: '€ TTC/MWh' },
  PM_L: {
    canonicalName: 'prix_logements_ttc_mwh',
    label: 'Prix moyen logements',
    source: 'fedene',
    tables: chaleurOnly,
    unit: '€ TTC/MWh',
  },
  PM_T: {
    canonicalName: 'prix_tertiaire_ttc_mwh',
    label: 'Prix moyen tertiaire',
    source: 'fedene',
    tables: chaleurOnly,
    unit: '€ TTC/MWh',
  },
  'PV%': { canonicalName: 'part_variable_pct', label: 'Part variable du prix', source: 'fedene', tables: chaleurOnly, unit: '%' },
  prod_MWh_autre_chaleur_recuperee: { ...production('autre chaleur récupérée'), canonicalName: 'prod_mwh_autre_chaleur_recuperee' },
  prod_MWh_autres: { ...production('autres'), canonicalName: 'prod_mwh_autres' },
  prod_MWh_autres_ENR: { ...production('autres EnR'), canonicalName: 'prod_mwh_autres_enr' },
  prod_MWh_biogaz: { ...production('biogaz'), canonicalName: 'prod_mwh_biogaz' },
  prod_MWh_biomasse_solide: { ...production('biomasse solide'), canonicalName: 'prod_mwh_biomasse_solide' },
  prod_MWh_chaleur_industiel: { ...production('chaleur industrielle'), canonicalName: 'prod_mwh_chaleur_industrielle' },
  prod_MWh_charbon: { ...production('charbon'), canonicalName: 'prod_mwh_charbon' },
  prod_MWh_chaudieres_electriques: { ...production('chaudières électriques'), canonicalName: 'prod_mwh_chaudieres_electriques' },
  prod_MWh_dechets_internes: { ...production('déchets internes (UVE interne)'), canonicalName: 'prod_mwh_dechets_internes' },
  prod_MWh_fioul_domestique: { ...production('fioul domestique'), canonicalName: 'prod_mwh_fioul_domestique' },
  prod_MWh_fioul_lourd: { ...production('fioul lourd'), canonicalName: 'prod_mwh_fioul_lourd' },
  prod_MWh_GPL: { ...production('GPL'), canonicalName: 'prod_mwh_gpl' },
  prod_MWh_gaz_naturel: { ...production('gaz naturel'), canonicalName: 'prod_mwh_gaz_naturel' },
  prod_MWh_geothermie: { ...production('géothermie'), canonicalName: 'prod_mwh_geothermie' },
  prod_MWh_PAC: { ...production('pompes à chaleur'), canonicalName: 'prod_mwh_pac' },
  prod_MWh_solaire_thermique: { ...production('solaire thermique'), canonicalName: 'prod_mwh_solaire_thermique' },
  prod_MWh_UIOM: { ...production('UVE externe'), canonicalName: 'prod_mwh_uve_externe' },
  production_totale_MWh: { canonicalName: 'production_totale_mwh', label: 'Production totale', source: 'fedene', unit: 'MWh' },
  puissance_MW_autre_chaleur_recuperee: { ...puissance('autre chaleur récupérée'), canonicalName: 'puissance_mw_autre_chaleur_recuperee' },
  puissance_MW_autres: { ...puissance('autres'), canonicalName: 'puissance_mw_autres' },
  puissance_MW_autres_ENR: { ...puissance('autres EnR'), canonicalName: 'puissance_mw_autres_enr' },
  puissance_MW_biogaz: { ...puissance('biogaz'), canonicalName: 'puissance_mw_biogaz' },
  puissance_MW_biomasse_solide: { ...puissance('biomasse solide'), canonicalName: 'puissance_mw_biomasse_solide' },
  puissance_MW_chaleur_industiel: { ...puissance('chaleur industrielle'), canonicalName: 'puissance_mw_chaleur_industrielle' },
  puissance_MW_charbon: { ...puissance('charbon'), canonicalName: 'puissance_mw_charbon' },
  puissance_MW_chaudieres_electriques: { ...puissance('chaudières électriques'), canonicalName: 'puissance_mw_chaudieres_electriques' },
  puissance_MW_dechets_internes: { ...puissance('déchets internes'), canonicalName: 'puissance_mw_dechets_internes' },
  puissance_MW_fioul_domestique: { ...puissance('fioul domestique'), canonicalName: 'puissance_mw_fioul_domestique' },
  puissance_MW_fioul_lourd: { ...puissance('fioul lourd'), canonicalName: 'puissance_mw_fioul_lourd' },
  puissance_MW_GPL: { ...puissance('GPL'), canonicalName: 'puissance_mw_gpl' },
  puissance_MW_gaz_naturel: { ...puissance('gaz naturel'), canonicalName: 'puissance_mw_gaz_naturel' },
  puissance_MW_geothermie: { ...puissance('géothermie'), canonicalName: 'puissance_mw_geothermie' },
  puissance_MW_PAC: { ...puissance('pompes à chaleur'), canonicalName: 'puissance_mw_pac' },
  puissance_MW_solaire_thermique: { ...puissance('solaire thermique'), canonicalName: 'puissance_mw_solaire_thermique' },
  puissance_MW_UIOM: { ...puissance('UVE'), canonicalName: 'puissance_mw_uve' },
  puissance_totale_MW: { canonicalName: 'puissance_totale_mw', label: 'Puissance totale installée', source: 'sdes', unit: 'MW' },
  'Rend%': { canonicalName: 'rendement_pct', label: 'Rendement de distribution', source: 'fedene', unit: '%' },
  region: { label: 'Région', source: 'geometrie' },
  'reseaux classes': { canonicalName: 'reseau_classe', label: 'Réseau classé', source: 'admin' },
  reseaux_techniques: { label: 'Réseau technique', source: 'historique', tables: chaleurOnly },
  'Taux EnR&R': { canonicalName: 'taux_enrr_pct', label: 'Taux EnR&R', source: 'arrete_dpe', unit: '%' },
  vapeur: { label: 'Vapeur', source: 'historique', tables: chaleurOnly },
  ville_mo: { canonicalName: 'ville_maitre_ouvrage', label: "Ville du maître d'ouvrage", source: 'historique' },
  website_gestionnaire: { canonicalName: 'site_internet', label: 'Site internet', source: 'admin' },
} as const satisfies Record<NetworkColumn, NetworkFieldDefinition>;

export type NetworkFieldName = keyof typeof networkFieldDefinitions;

/** Columns owned by a given source, e.g. to check that an import only writes what it owns. */
export const networkFieldsBySource = (source: NetworkFieldSource): NetworkFieldName[] =>
  (Object.keys(networkFieldDefinitions) as NetworkFieldName[]).filter((field) => networkFieldDefinitions[field].source === source);
