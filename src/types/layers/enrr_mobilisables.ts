export interface Datacenter {
  GmlID: string;
  'db_gd5kj.hsu_pnjyu.datacenter_datacenter.fid': number;
  id: string;
  com_nom: string;
  nom: string;
  categorie: string;
  qualite_xy: string;
  source: string;
}

export interface Industrie {
  GmlID: string; // computed with a script
  fid: number;
  comm_bt: string;
  quali_xy: number;
  potbas_ht: number;
  source: string;
  pothaut_bt: number;
  nom_commun: string;
  nom_etabli: string;
  pothaut_ht: number;
  type_act: string;
  comm_ht: string;
  commentair: string;
  potbas_bt: number;
}

export interface InstallationElectrogene {
  GmlID: string;
  'db_gd5kj.hsu_pnjyu.installations_electrogenes_installations_electrogene.fid': number;
  id: string;
  com_nom: string;
  nom_inst: string;
  type_inst: string;
  qualite_xy: string;
}

export interface StationDEpuration {
  GmlID: string;
  'db_gd5kj.hsu_pnjyu.stations_d_epuration_stations_d_epuration.fid': number;
  id_unique: string;
  com_nom: string;
  step_nom: string;
  exploitant: string;
  capa_eh: number;
  debit_m3j: number;
  en_mwh_an: number;
}

export interface UniteDIncineration {
  GmlID: string; // computed with a script
  fid: number;
  nom_comm: string;
  max_prd_cr: number;
  insee_com: number;
  min_prd_cr: number;
  dep: string;
  max_prd: number;
  code_dep: number;
  nom_inst: string;
  min_prd: number;
  type_inst: string;
  comt: string;
  info: string;
}

export interface SolaireThermiqueFriche {
  GmlID: string;
  comm_insee: string;
  'db_gd5kj.hsu_pnjyu.solaire_thermique_friches_solaire_thermique_friches.fid': number;
  site_id: string;
  site_nom: string;
  source_nom: string;
  st_area_shape_: number;
  st_length_shape_: number;
  surf_site: number;
  urba_zone_: string;
}

export interface SolaireThermiqueParking {
  GmlID: string;
  TYPE: string;
  'db_gd5kj.hsu_pnjyu.parkings_sup500m2_parkings_sup500m2.fid': number;
  st_area_shape_: number;
  st_length_shape_: number;
  surfm2: number;
}
