import { describe, expect, it } from 'vitest';

import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/constants';

import { getSimulationPrefillFromBatEnrBatiment } from './simulation-prefill';

describe('getSimulationPrefillFromBatEnrBatiment', () => {
  it('prefills simulation values from the selected building without guessing the heating mode', () => {
    const batiment = {
      ac1: null,
      ac2: null,
      ac3: null,
      ac4: null,
      ac4bis: null,
      adresse: '1 rue de la Paix',
      batiment_construction_id: 'BATIMENT-1',
      batiment_groupe_id: 'GROUPE-1',
      categorie_majoritaire: 'res col',
      classe_bilan_dpe: 'C',
      couv_sondes_200_2025: null,
      couv_st_ecs_2025: null,
      dpe_representatif_logement_surface_habitable_immeuble: 1_800,
      etat_ppa: null,
      ffo_bat_nb_log: 30,
      geometry: null,
      gis_geo_profonde: null,
      gmi_nappe_200: null,
      gmi_sonde_200: null,
      place_nappe: null,
      pot_nappe: null,
      prod_st_mwh_an: null,
      propri_uni: null,
      type_energie_chauffage: null,
      type_energie_ecs: null,
      type_installation_chauffage: 'collectif',
      type_installation_ecs: 'collectif',
    } satisfies BatEnrBatiment;

    expect(getSimulationPrefillFromBatEnrBatiment(batiment)).toStrictEqual({
      dpe: 'C',
      modeEauChaudeSanitaire: 'Collectif',
      nbLogements: 30,
      surfaceMoyenne: 60,
    });
  });
});
