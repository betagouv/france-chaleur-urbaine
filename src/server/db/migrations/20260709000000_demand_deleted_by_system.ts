import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Backfill des suppressions automatiques de demandes.
 *
 * Les suppressions manuelles (admin/gestionnaire) portent un `author_id` et gardent le type `demand_deleted`.
 * Les suppressions sans auteur proviennent uniquement du batch de dédoublonnage (`removeDemand` sans `userId`) :
 * on les retype en `demand_deleted_by_system` pour un rendu correct dans le suivi d'activité.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE events
    SET type = 'demand_deleted_by_system'
    WHERE type = 'demand_deleted'
      AND context_type = 'demand'
      AND author_id IS NULL;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE events
    SET type = 'demand_deleted'
    WHERE type = 'demand_deleted_by_system'
      AND context_type = 'demand'
      AND author_id IS NULL;
  `.execute(db);
}
