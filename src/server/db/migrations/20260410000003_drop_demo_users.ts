import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // The `demo` role has been removed from the application (replaced by admin impersonation
  // with an anonymization toggle). Residual users with `role = 'demo'` can no longer log in
  // to pro pages. FKs on users are either CASCADE or SET NULL, except network_reminders
  // (no demo rows — verified before the migration).
  await sql`DELETE FROM users WHERE role = 'demo'`.execute(db);
}

export async function down(_db: Kysely<any>): Promise<void> {
  // Irreversible: demo users and their dependent rows are permanently deleted.
}
