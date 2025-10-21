import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS regions;
    DROP TABLE IF EXISTS "bnb - adresse_tiles";
    DROP TABLE IF EXISTS "bnb - batiment_tiles";
    DROP TABLE IF EXISTS "bnb_auvergne-rhone-alpes-batiment_adresse";
    DROP TABLE IF EXISTS "bnb_bourgogne-franche-comte-batiment_adresse";
    DROP TABLE IF EXISTS "bnb_bretagne-batiment_adresse";
    DROP TABLE IF EXISTS "bnb_centre-val-de-loire-batiment_adresse";
    DROP TABLE IF EXISTS "bnb_corse-batiment_adresse";
    DROP TABLE IF EXISTS "bnb_grand-est-batiment_adresse";
    DROP TABLE IF EXISTS "bnb_hauts-de-france-batiment_adresse";
    DROP TABLE IF EXISTS "bnb_idf - batiment_adresse";
    DROP TABLE IF EXISTS "bnb_normandie-batiment_adresse";
    DROP TABLE IF EXISTS "bnb_nouvelle-aquitaine-batiment_adresse";
    DROP TABLE IF EXISTS "bnb_occitanie-batiment_adresse";
    DROP TABLE IF EXISTS "bnb_pays-de-la-loire-batiment_adresse";
    DROP TABLE IF EXISTS "bnb_provence-alpes-cote-d_azur-batiment_adresse";
    DROP TABLE IF EXISTS bdnb_registre2022_aura;
    DROP TABLE IF EXISTS "bdnb_registre2022_bourgogne-franche-comte";
    DROP TABLE IF EXISTS bdnb_registre2022_bretagne;
    DROP TABLE IF EXISTS "bdnb_registre2022_centre-val_de_loire";
    DROP TABLE IF EXISTS bdnb_registre2022_corse;
    DROP TABLE IF EXISTS bdnb_registre2022_grand_est;
    DROP TABLE IF EXISTS "bdnb_registre2022_hauts-de-france";
    DROP TABLE IF EXISTS "bdnb_registre2022_ile-de-france";
    DROP TABLE IF EXISTS bdnb_registre2022_normandie;
    DROP TABLE IF EXISTS "bdnb_registre2022_nouvelle-aquitaine";
    DROP TABLE IF EXISTS bdnb_registre2022_occitanie;
    DROP TABLE IF EXISTS bdnb_registre2022_paca;
    DROP TABLE IF EXISTS "bdnb_registre2022_pays-de-la-loire";
  `);
}

export async function down() {}
