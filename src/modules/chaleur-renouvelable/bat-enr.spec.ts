import { describe, expect, it } from 'vitest';

import { EMPTY_BAT_ENR_INFO, getBatEnrInfoFromBatiment } from './bat-enr';
import type { BatEnrBatiment } from './constants';

const emptyBatiment = {
  ac1: null,
  ac2: null,
  ac3: null,
  ac4: null,
  ac4bis: null,
  adresse: null,
  batiment_construction_id: null,
  batiment_groupe_id: null,
  categorie_majoritaire: null,
  classe_bilan_dpe: null,
  couv_sondes_200_2025: null,
  couv_st_ecs_2025: null,
  dpe_representatif_logement_surface_habitable_immeuble: null,
  etat_ppa: null,
  ffo_bat_nb_log: null,
  geometry: null,
  gis_geo_profonde: null,
  gmi_nappe_200: null,
  gmi_sonde_200: null,
  place_nappe: null,
  prod_st_mwh_an: null,
  propri_uni: null,
  type_energie_chauffage: null,
  type_energie_ecs: null,
  type_installation_chauffage: null,
  type_installation_ecs: null,
} satisfies BatEnrBatiment;

describe('getBatEnrInfoFromBatiment', () => {
  it.each([null, 0, 1, 5, 6, 7, 8, 9])('ignores stored aquifer potential %s in the simulation context', (potential) => {
    const batiment = { ...emptyBatiment, couv_sondes_200_2025: 31, pot_nappe: potential };

    expect(getBatEnrInfoFromBatiment(batiment)).toStrictEqual({ ...EMPTY_BAT_ENR_INFO, geothermalCoverage: 31 });
  });

  it.each([null, 0, 30, 31, 100])('reads geothermal coverage %s from couv_sondes_200_2025', (coverage) => {
    expect(getBatEnrInfoFromBatiment({ ...emptyBatiment, couv_sondes_200_2025: coverage })).toStrictEqual({
      ...EMPTY_BAT_ENR_INFO,
      geothermalCoverage: coverage,
    });
  });

  it.each([null, undefined])('keeps geothermal coverage unknown when the building is %s', (batiment) => {
    expect(getBatEnrInfoFromBatiment(batiment)).toStrictEqual(EMPTY_BAT_ENR_INFO);
  });
});
