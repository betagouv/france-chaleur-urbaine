import type { GetBdnbBatimentInput } from '@/modules/tiles/constants';
import { kdb } from '@/server/db/kysely';

export const getBdnbBatimentDetails = async ({ batiment_groupe_id }: GetBdnbBatimentInput) => {
  const batiment = await kdb
    .selectFrom('bdnb_batiments')
    .select([
      // tout sauf geom et id
      'adresse_cle_interop_adr_principale_ban',
      'adresse_libelle_adr_principale_ban',
      'batiment_groupe_id',
      'code_commune_insee',
      'dle_elec_multimillesime_conso_pro',
      'dle_elec_multimillesime_conso_res',
      'dle_elec_multimillesime_conso_tot',
      'dle_gaz_multimillesime_conso_pro',
      'dle_gaz_multimillesime_conso_res',
      'dle_gaz_multimillesime_conso_tot',
      'dle_reseaux_multimillesime_conso_pro',
      'dle_reseaux_multimillesime_conso_res',
      'dle_reseaux_multimillesime_conso_tot',
      'dle_reseaux_multimillesime_type_reseau',
      'dpe_representatif_logement_classe_bilan_dpe',
      'dpe_representatif_logement_classe_emission_ges',
      'dpe_representatif_logement_surface_habitable_immeuble',
      'dpe_representatif_logement_type_batiment_dpe',
      'dpe_representatif_logement_type_dpe',
      'dpe_representatif_logement_type_energie_chauffage',
      'dpe_representatif_logement_type_generateur_chauffage',
      'dpe_representatif_logement_type_installation_chauffage',
      'ffo_bat_annee_construction',
      'ffo_bat_nb_log',
      'synthese_propriete_usage',
      'rnc_l_nom_copro',
      'constructions',
    ])
    .where('batiment_groupe_id', '=', batiment_groupe_id)
    .executeTakeFirstOrThrow();

  return batiment;
};
