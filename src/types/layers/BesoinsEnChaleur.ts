export type BesoinsEnChaleur = {
  CHAUF_MWH: number;
  COM_INSEE: string;
  ECS_MWH: number;
  FROID_MWH: number;
  IDBATIMENT: string;
  PART_TER: number;
  SDP_M2: number;
};

export type BesoinsEnChaleurIndustrieCommunes = {
  conso_autr: number;
  conso_chal: number;
  codgeo: string;
  libgeo: string;
  conso_proc: number;
  dep: string;
  reg: string;
  conso_tot: number;
  conso_loca: number;
};
