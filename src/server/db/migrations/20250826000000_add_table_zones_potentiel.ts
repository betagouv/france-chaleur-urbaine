import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS public.zone_a_potentiel_froid
    (
        ogc_fid integer NOT NULL DEFAULT nextval('zone_a_potentiel_froid_ogc_fid_seq'::regclass),
        id_zone character varying(254) COLLATE pg_catalog."default",
        com_insee character varying(254) COLLATE pg_catalog."default",
        dist_con character varying(254) COLLATE pg_catalog."default",
        dens_min character varying(254) COLLATE pg_catalog."default",
        bes_min character varying(254) COLLATE pg_catalog."default",
        filere character varying(254) COLLATE pg_catalog."default",
        froid_mwh numeric(10,0),
        bat_imp numeric(10,0),
        part_ter numeric(23,15),
        dep character varying(254) COLLATE pg_catalog."default",
        reg character varying(254) COLLATE pg_catalog."default",
        type_zone character varying(254) COLLATE pg_catalog."default",
        icu_sensib numeric(10,0),
        icu_val character varying(254) COLLATE pg_catalog."default",
        geom geometry(MultiPolygon,2154),
        CONSTRAINT zone_a_potentiel_froid_pkey PRIMARY KEY (ogc_fid)
    );

    CREATE INDEX IF NOT EXISTS zone_a_potentiel_froid_geom_geom_idx
        ON public.zone_a_potentiel_froid USING gist
        (geom);

    CREATE TABLE IF NOT EXISTS public.zone_a_potentiel_fort_froid
    (
        ogc_fid integer NOT NULL DEFAULT nextval('zone_a_potentiel_fort_froid_ogc_fid_seq'::regclass),
        id_zone character varying(254) COLLATE pg_catalog."default",
        com_insee character varying(254) COLLATE pg_catalog."default",
        dist_con character varying(254) COLLATE pg_catalog."default",
        dens_min character varying(254) COLLATE pg_catalog."default",
        bes_min character varying(254) COLLATE pg_catalog."default",
        filere character varying(254) COLLATE pg_catalog."default",
        froid_mwh numeric(10,0),
        bat_imp numeric(10,0),
        part_ter numeric(23,15),
        dep character varying(254) COLLATE pg_catalog."default",
        reg character varying(254) COLLATE pg_catalog."default",
        type_zone character varying(254) COLLATE pg_catalog."default",
        icu_sensib numeric(10,0),
        icu_val character varying(254) COLLATE pg_catalog."default",
        geom geometry(MultiPolygon,2154),
        CONSTRAINT zone_a_potentiel_fort_froid_pkey PRIMARY KEY (ogc_fid)
    );

    CREATE INDEX IF NOT EXISTS zone_a_potentiel_fort_froid_geom_geom_idx
        ON public.zone_a_potentiel_fort_froid USING gist
        (geom);

    CREATE TABLE IF NOT EXISTS public.zone_a_potentiel_froid_tiles
    (
        x bigint NOT NULL,
        y bigint NOT NULL,
        z bigint NOT NULL,
        tile bytea NOT NULL,
        CONSTRAINT zone_a_potentiel_froid_tiles_pkey PRIMARY KEY (x, y, z)
    );

    CREATE TABLE IF NOT EXISTS public.zone_a_potentiel_fort_froid_tiles
    (
        x bigint NOT NULL,
        y bigint NOT NULL,
        z bigint NOT NULL,
        tile bytea NOT NULL,
        CONSTRAINT zone_a_potentiel_fort_froid_tiles_pkey PRIMARY KEY (x, y, z)
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS public.zone_a_potentiel_froid;
    DROP TABLE IF EXISTS public.zone_a_potentiel_fort_froid;
    DROP TABLE IF EXISTS public.zone_a_potentiel_froid_tiles;
    DROP TABLE IF EXISTS public.zone_a_potentiel_fort_froid_tiles;
  `);
}
