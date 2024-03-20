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
  GmlID: string;
  'db_gd5kj.hsu_pnjyu.industrie_industrie.fid': number;
  id_unique: string;
  com_nom: string;
  nom_site: string;
  activite: string;
  exploitant: string;
  conso: string;
  t_major: string;
  t_minor: string;
  qualite_xy: string;
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
  GmlID: string;
  'db_gd5kj.hsu_pnjyu.unites_d_incineration_unites_d_incineration.fid': number;
  id: string;
  com_nom: string;
  nom_inst: string;
  type_inst: string;
  qualite_xy: number;
}
