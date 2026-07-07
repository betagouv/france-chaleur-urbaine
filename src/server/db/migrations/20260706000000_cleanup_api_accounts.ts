// Nettoyage final du legacy `api_accounts` / `users.from_api`, remplacés par `organizations` +
// `organization_api_credentials` (auth API partenaire) et `users.from_organization_id` (provenance).
// La provenance a déjà été reprojetée sur `from_organization_id` (backfill fait) → ce DROP est le nettoyage
// terminal. Irréversible : `down` recrée la structure vide, best-effort.

import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE users DROP COLUMN from_api;`.execute(db);
  await sql`DROP TABLE api_accounts;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE api_accounts (
      key TEXT PRIMARY KEY,
      name TEXT,
      token TEXT NOT NULL
    );
  `.execute(db);
  await sql`ALTER TABLE users ADD COLUMN from_api TEXT;`.execute(db);
}
