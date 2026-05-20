export type BatEnrBatiment = {
  adresse: string | null;
  batiment_construction_id: string | null;
  batiment_groupe_id: string | null;
  categorie_majoritaire: string | null;
  classe_bilan_dpe: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null;
  couv_sondes_200_2025: number | null;
  couv_st_ecs_2025: number | null;
  etat_ppa: string | null;
  geometry: GeoJSON.Geometry | null;
  gis_geo_profonde: boolean | null;
  gmi_nappe_200: number | null;
  gmi_sonde_200: number | null;
  place_nappe: boolean | null;
  pot_nappe: number | null;
  prod_st_mwh_an: number | null;
  propri_uni: string | null;
};
