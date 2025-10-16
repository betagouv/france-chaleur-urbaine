import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE regions;
    DROP TABLE "bnb - adresse_tiles";
    DROP TABLE "bnb - batiment_tiles";
    DROP TABLE "bnb_auvergne-rhone-alpes-batiment_adresse";
    DROP TABLE "bnb_bourgogne-franche-comte-batiment_adresse";
    DROP TABLE "bnb_bretagne-batiment_adresse";
    DROP TABLE "bnb_centre-val-de-loire-batiment_adresse";
    DROP TABLE "bnb_corse-batiment_adresse";
    DROP TABLE "bnb_grand-est-batiment_adresse";
    DROP TABLE "bnb_hauts-de-france-batiment_adresse";
    DROP TABLE "bnb_idf - batiment_adresse";
    DROP TABLE "bnb_normandie-batiment_adresse";
    DROP TABLE "bnb_nouvelle-aquitaine-batiment_adresse";
    DROP TABLE "bnb_occitanie-batiment_adresse";
    DROP TABLE "bnb_pays-de-la-loire-batiment_adresse";
    DROP TABLE "bnb_provence-alpes-cote-d_azur-batiment_adresse";
    DROP TABLE bdnb_registre2022_aura;
    DROP TABLE "bdnb_registre2022_bourgogne-franche-comte";
    DROP TABLE bdnb_registre2022_bretagne;
    DROP TABLE "bdnb_registre2022_centre-val_de_loire";
    DROP TABLE bdnb_registre2022_corse;
    DROP TABLE bdnb_registre2022_grand_est;
    DROP TABLE "bdnb_registre2022_hauts-de-france";
    DROP TABLE "bdnb_registre2022_ile-de-france";
    DROP TABLE bdnb_registre2022_normandie;
    DROP TABLE "bdnb_registre2022_nouvelle-aquitaine";
    DROP TABLE bdnb_registre2022_occitanie;
    DROP TABLE bdnb_registre2022_paca;
    DROP TABLE "bdnb_registre2022_pays-de-la-loire";
  `);
}

export async function down() {}
