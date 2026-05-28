import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE bdnb_batenr
      ADD COLUMN categorie_majoritaire text,
      ADD COLUMN propri_uni text,
      ADD COLUMN classe_bilan_dpe character varying(1),
      ADD COLUMN couv_st_ecs_2025 double precision,
      ADD COLUMN couv_sondes_200_2025 double precision,
      ADD COLUMN prod_st_mwh_an double precision,
      ADD COLUMN type_installation_chauffage text,
      ADD COLUMN type_energie_chauffage text,
      ADD COLUMN type_installation_ecs text,
      ADD COLUMN type_energie_ecs text;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE bdnb_batenr
      DROP COLUMN IF EXISTS categorie_majoritaire,
      DROP COLUMN IF EXISTS propri_uni,
      DROP COLUMN IF EXISTS classe_bilan_dpe,
      DROP COLUMN IF EXISTS couv_sondes_200_2025,
      DROP COLUMN IF EXISTS couv_st_ecs_2025,
      DROP COLUMN IF EXISTS prod_st_mwh_an,
      DROP COLUMN IF EXISTS type_installation_chauffage,
      DROP COLUMN IF EXISTS type_energie_chauffage,
      DROP COLUMN IF EXISTS type_installation_ecs,
      DROP COLUMN IF EXISTS type_energie_ecs;
  `.execute(db);
}
