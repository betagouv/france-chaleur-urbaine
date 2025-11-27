import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Create table for quartiers prioritaires de la politique de la ville
    CREATE TABLE IF NOT EXISTS public.quartiers_prioritaires_politique_ville
    (
        fid integer NOT NULL,
        code_qp character varying,
        lib_qp character varying,
        insee_reg character varying,
        lib_reg character varying,
        insee_dep character varying,
        lib_dep character varying,
        insee_com character varying,
        lib_com character varying,
        siren_epci character varying,
        geom geometry(MultiPolygon,2154),
        CONSTRAINT quartiers_prioritaires_politique_ville_pkey PRIMARY KEY (fid)
    );

    -- Create sequence for fid if it doesn't exist
    CREATE SEQUENCE IF NOT EXISTS quartiers_prioritaires_politique_ville_fid_seq
        AS integer
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;

    -- Set default value for fid column if not already set
    ALTER TABLE public.quartiers_prioritaires_politique_ville
        ALTER COLUMN fid SET DEFAULT nextval('quartiers_prioritaires_politique_ville_fid_seq'::regclass);

    -- Set sequence ownership
    ALTER SEQUENCE quartiers_prioritaires_politique_ville_fid_seq OWNED BY public.quartiers_prioritaires_politique_ville.fid;

    -- Create spatial index for geometry column
    CREATE INDEX IF NOT EXISTS quartiers_prioritaires_politique_ville_geom_geom_idx
        ON public.quartiers_prioritaires_politique_ville USING gist(geom);

    -- Create index on code_qp for faster lookups
    CREATE INDEX IF NOT EXISTS quartiers_prioritaires_politique_ville_code_qp_idx
        ON public.quartiers_prioritaires_politique_ville USING btree(code_qp);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS public.quartiers_prioritaires_politique_ville;
    DROP SEQUENCE IF EXISTS quartiers_prioritaires_politique_ville_fid_seq;
  `);
}
