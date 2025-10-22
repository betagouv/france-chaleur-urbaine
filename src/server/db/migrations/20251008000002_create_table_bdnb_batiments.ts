import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
CREATE TABLE IF NOT EXISTS public.bdnb_batiments
(
    id integer,
    batiment_groupe_id character varying(22) COLLATE pg_catalog."default",
    geom geometry(MultiPolygon,2154),
    code_commune_insee character varying(5) COLLATE pg_catalog."default",
    adresse_cle_interop_adr_principale_ban character varying COLLATE pg_catalog."default",
    adresse_libelle_adr_principale_ban character varying COLLATE pg_catalog."default",
    ffo_bat_nb_log smallint,
    ffo_bat_annee_construction smallint,
    ffo_bat_usage_niveau_1_txt character varying COLLATE pg_catalog."default",
    dle_elec_multimillesime_conso_pro real,
    dle_elec_multimillesime_conso_res real,
    dle_elec_multimillesime_conso_tot real,
    dle_gaz_multimillesime_conso_pro real,
    dle_gaz_multimillesime_conso_res real,
    dle_gaz_multimillesime_conso_tot real,
    dle_reseaux_multimillesime_conso_pro real,
    dle_reseaux_multimillesime_conso_res real,
    dle_reseaux_multimillesime_conso_tot real,
    rnc_l_nom_copro character varying[] COLLATE pg_catalog."default",
    dpe_representatif_logement_classe_bilan_dpe character varying COLLATE pg_catalog."default",
    dpe_representatif_logement_classe_emission_ges character varying COLLATE pg_catalog."default",
    dpe_representatif_logement_type_energie_chauffage character varying COLLATE pg_catalog."default",
    dpe_representatif_logement_type_batiment_dpe character varying COLLATE pg_catalog."default",
    dpe_representatif_logement_type_dpe character varying COLLATE pg_catalog."default",
    dpe_representatif_logement_type_generateur_chauffage character varying COLLATE pg_catalog."default",
    dpe_representatif_logement_surface_habitable_immeuble real,
    dpe_representatif_logement_type_installation_chauffage character varying COLLATE pg_catalog."default",
    synthese_propriete_usage character varying COLLATE pg_catalog."default",
    constructions jsonb
);

CREATE INDEX IF NOT EXISTS bdnb_batiments_batiment_groupe_id_idx
    ON public.bdnb_batiments USING btree(batiment_groupe_id);

CREATE INDEX IF NOT EXISTS bdnb_batiments_geom_idx
    ON public.bdnb_batiments USING gist(geom);

CREATE INDEX IF NOT EXISTS bdnb_batiments_id_idx
    ON public.bdnb_batiments USING btree(id);
  `);
}

export async function down() {}
