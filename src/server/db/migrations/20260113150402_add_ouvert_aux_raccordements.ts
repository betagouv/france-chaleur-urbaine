import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.reseaux_de_chaleur
    ADD COLUMN IF NOT EXISTS ouvert_aux_raccordements boolean NOT NULL DEFAULT true;

    ALTER TABLE public.zones_et_reseaux_en_construction
    ADD COLUMN IF NOT EXISTS ouvert_aux_raccordements boolean NOT NULL DEFAULT true;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.reseaux_de_chaleur
    DROP COLUMN IF EXISTS ouvert_aux_raccordements;

    ALTER TABLE public.zones_et_reseaux_en_construction
    DROP COLUMN IF EXISTS ouvert_aux_raccordements;
  `.execute(db);
}
