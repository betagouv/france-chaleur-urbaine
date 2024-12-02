// generated with quicktype -l ts --prefer-unions --prefer-types --prefer-const-values -o types.ts mon-fichier-source.geojson

export type InstallationGeothermieProfonde = {
  gid: string;
  Id_du_site: string;
  Site: string;
  Région: Région;
  Département: string;
  nom_departemt: string;
  Commune: string;
  Bassin_sédimentaire: BassinSédimentaire;
  Type_exploitation: TypeExploitation;
  Date_début_exploitation?: Date;
  etat_operation: 'FONCTIONNEMENT';
  Utilisation?: string;
  annee?: string;
  Débit_exploitation_moyen?: string;
  Température_moyennne_réinjection_ou_rejet?: string;
  Energie_géothermale_annuelle_produite?: string;
  Nombre_équivalents_logements_chauffés?: string;
  Taux_couverture_géothermie?: string;
  Présence_PAC?: string;
  Puissance_PAC?: string;
  Puissance_max_délivrée?: string;
  Cogeneration?: Cogeneration;
  Type: 'Profonde';
  geom_2154: string;
  date_maj: Date;
  Hydrocarbures_subsitués?: string;
  Pollution_évitée?: string;
};

export type BassinSédimentaire = 'Bassin Parisien' | 'Bassin Aquitain' | 'Bassin parisien' | 'Bassin du Sud-Est' | 'Fossé Rhénan';

export type Cogeneration = 'non' | 'oui';

export type Région = 'ILE-DE-FRANCE' | 'NOUVELLE-AQUITAINE' | 'OCCITANIE' | 'CENTRE-VAL DE LOIRE' | 'GRAND EST';

export type TypeExploitation = 'triplet' | 'doublet' | 'puits unique' | 'quadruplet' | 'multiples producteurs';

export type InstallationGeothermieSurfaceEchangeursOuverts = {
  bss_rel: number;
  gmi_instal: null | string;
  nom_instal: null | string;
  gmi_decla: null | string;
  categ_gth: null | string;
  type_inst: 'GTH_AQUIFERE';
  proced_gth: 'sur aquifère' | null;
  usage_gth: null | string;
  desc_inst: null | string;
  nombre_ouv: number;
  statut_inst: StatutInst;
  tvx_date: null | string;
  date_rel: string;
  p_frigo: number | null;
  cop_chaud: number | null;
  cop_froid: number | null;
  p_pac: number | null;
  num_region: string;
  num_dpt: string;
  nom_dpt: string;
  code_insee: string;
  nom_comm: string;
  x_ouv93: number;
  y_ouv93: number;
  alti_inst: number | null;
  recueil: string | null;
  date_extra: '2024-11-30Z';
  puissance_calorifique: number | null;
  taux_couverture: TauxCouverture | null;
  surface: number | null;
  debit_nominal: number | null;
  volume_total: number | null;
  batiment: null | string;
};

export type InstallationGeothermieSurfaceEchangeursFermes = {
  bss_rel: number;
  gmi_instal: null | string;
  nom_instal: string;
  gmi_decla: null | string;
  categ_gth: null | string;
  type_inst: 'GTH_SONDE';
  proced_gth: 'avec sonde';
  usage_gth: null | string;
  desc_inst: null | string;
  nombre_ouv: number;
  l_sgv_tota: number | null;
  statut_inst: StatutInst;
  tvx_date: null | string;
  date_rel: string;
  p_frigo: number | null;
  cop_chaud: number | null;
  cop_froid: number | null;
  p_pac: number | null;
  num_region: null | string;
  num_dpt: null | string;
  nom_dpt: string | null;
  code_insee: null | string;
  nom_comm: null | string;
  x_ouv93: number;
  y_ouv93: number;
  alti_inst: number | null;
  recueil: string | null;
  date_extra: '2024-11-30Z';
  puissance_calorifique: number | null;
  taux_couverture: TauxCouverture | null;
  surface: number | null;
  batiment: null | string;
};

export type StatutInst = 'Réalisé' | 'Déclaré' | 'Déclaré, Réalisé';

export type TauxCouverture = 'Entre 50% et 70%' | 'Entre 30% et 50%' | 'Plus de 90%' | 'Entre 70% et 90%' | 'Moins de 30%';
