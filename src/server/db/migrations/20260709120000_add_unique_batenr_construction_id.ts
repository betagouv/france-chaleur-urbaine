import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DELETE FROM bdnb_batenr
    WHERE ctid IN (
      SELECT ctid
      FROM (
        SELECT
          ctid,
          ROW_NUMBER() OVER (
            PARTITION BY batiment_construction_id
            ORDER BY ctid
          ) AS duplicate_rank
        FROM bdnb_batenr
        WHERE batiment_construction_id IS NOT NULL
      ) AS ranked_batenr
      WHERE duplicate_rank > 1
    );

    DROP INDEX IF EXISTS bdnb_batenr_batiment_construction_id_idx;

    CREATE UNIQUE INDEX IF NOT EXISTS bdnb_batenr_batiment_construction_id_unique_idx
      ON bdnb_batenr (batiment_construction_id)
      WHERE batiment_construction_id IS NOT NULL;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS bdnb_batenr_batiment_construction_id_unique_idx;

    CREATE INDEX IF NOT EXISTS bdnb_batenr_batiment_construction_id_idx
      ON bdnb_batenr (batiment_construction_id);
  `.execute(db);
}
