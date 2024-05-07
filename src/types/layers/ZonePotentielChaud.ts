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
  fid: number;
  geothermie: number;
  surf_sol_8: number;
  part_ter: number;
  dep: string;
  rdt_bt: number;
  chauf_mwh: number;
  ecs_mwh: number;
  surf_sol_1: number;
  id_zone: string;
  rdt_ht: number;
  surf_capt_: number;
  code_com_i: string;
  surf_cap_1: number;
  bat_imp: number;
  com_arr: string;
  SHAPE__Length: number;
  sol_moy: number;
  part_ecs: number;
  SHAPE__Area: number;
};
