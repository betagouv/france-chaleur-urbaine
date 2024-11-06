export interface Network {
  id_fcu: string;
  'Taux EnR&R': number;
  Gestionnaire: string;
  'Identifiant reseau': string;
  has_trace: boolean;
  'contenu CO2': number;
  'contenu CO2 ACV': number;
  contenu_CO2_2023_tmp: number;
  contenu_CO2_ACV_2023_tmp: number;
  nom_reseau: string;
  'Rend%': number;
  'Dev_reseau%': number;
  PM: number;
  PM_L: number;
  PM_T: number;
  'PV%': number;
  'PF%': number;
  livraisons_agriculture_MWh: number;
  livraisons_autre_MWh: number;
  livraisons_industrie_MWh: number;
  livraisons_residentiel_MWh: number;
  livraisons_tertiaire_MWh: number;
  livraisons_totale_MWh: number;
  longueur_reseau: number;
  nb_pdl: number;
  annee_creation: number;
  eau_chaude: string;
  eau_surchauffee: string;
  vapeur: string;
  MO: string;
  adresse_mo: string;
  CP_MO: string;
  ville_mo: string;
  prod_MWh_gaz_naturel: number;
  prod_MWh_charbon: number;
  prod_MWh_fioul_domestique: number;
  prod_MWh_fioul_lourd: number;
  prod_MWh_GPL: number;
  prod_MWh_biomasse_solide: number;
  prod_MWh_dechets_internes: number;
  prod_MWh_UIOM: number;
  prod_MWh_biogaz: number;
  prod_MWh_geothermie: number;
  prod_MWh_PAC: number;
  prod_MWh_solaire_thermique: number;
  prod_MWh_chaleur_industiel: number;
  prod_MWh_autre_chaleur_recuperee: number;
  prod_MWh_chaudieres_electriques: number;
  prod_MWh_autres: number;
  prod_MWh_autres_ENR: number;
  production_totale_MWh: number;
  puissance_totale_MW: number;
  puissance_MW_gaz_naturel: number;
  puissance_MW_charbon: number;
  puissance_MW_fioul_domestique: number;
  puissance_MW_fioul_lourd: number;
  puissance_MW_GPL: number;
  puissance_MW_biomasse_solide: number;
  puissance_MW_dechets_internes: number;
  puissance_MW_UIOM: number;
  puissance_MW_biogaz: number;
  puissance_MW_geothermie: number;
  puissance_MW_PAC: number;
  puissance_MW_solaire_thermique: number;
  puissance_MW_chaleur_industiel: number;
  puissance_MW_autre_chaleur_recuperee: number;
  puissance_MW_chaudieres_electriques: number;
  puissance_MW_autres: number;
  puissance_MW_autres_ENR: number;
  lon: number;
  lat: number;
  website_gestionnaire: string;
  'reseaux classes': boolean;
  informationsComplementaires: string;
  fichiers: NetworkAttachment[];
  region: string;
}

export interface NetworkAttachment {
  id: string;
  filename: string;
  size: number;
  type: string;
  // fetched from airtable and expires 2h later
  // do not use inside the UI, use the proxy /api/networks/:id/files/:id
  url: string;
}

export interface NetworkSummary {
  length: number;
  'Taux EnR&R': number;
  Gestionnaire: string;
  commentaires?: string;
  'Identifiant reseau': string;
  'reseaux classes': boolean;
  'contenu CO2 ACV': number;
  nom_reseau: string;
  livraisons_totale_MWh: number;
  nb_pdl: number;
  isCold?: boolean;
}

export interface NetworkToCompare extends Network {
  communes: string[];
  energie_ratio_biomasse: number;
  energie_ratio_geothermie: number;
  energie_ratio_uve: number;
  energie_ratio_chaleurIndustrielle: number;
  energie_ratio_solaireThermique: number;
  energie_ratio_pompeAChaleur: number;
  energie_ratio_gaz: number;
  energie_ratio_fioul: number;
  energie_ratio_autresEnr: number;
  energie_ratio_chaufferiesElectriques: number;
  energie_ratio_charbon: number;
  energie_ratio_gpl: number;
  energie_ratio_autreChaleurRecuperee: number;
  energie_ratio_biogaz: number;
}
