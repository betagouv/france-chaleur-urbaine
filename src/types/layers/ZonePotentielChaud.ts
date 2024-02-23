/*
Example :
"GmlID": "zone_a_potentiel_fort_chaud.1",
"db_gd5kj.hsu_pnjyu.zone_a_potentiel_fort_chaud_zone_a_potentiel_fort_ch.fid": 1,
"ID_ZONE": " 0100087",
"CHAUF_MWH": 1783.00000000,
"ECS_MWH": 469.00000000,
"NBRE_BAT": 4.00000000,
"PART_TER": 0.65364122,
"st_area_shape_": 140818.81363232,
"st_length_shape_": 1595.24228630

idem ZonePotentielFortChaud
*/
export type ZonePotentielChaud = {
  GmlID: string;
  'db_gd5kj.hsu_pnjyu.zone_a_potentiel_fort_chaud_zone_a_potentiel_fort_ch.fid': number;
  ID_ZONE: string;
  CHAUF_MWH: number;
  ECS_MWH: number;
  NBRE_BAT: number;
  PART_TER: number;
  st_area_shape_: number;
  st_length_shape_: number;
};
