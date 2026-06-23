// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION EN ATTENTE — DEPLOY 2 : nettoyage final du legacy `api_accounts` / `from_api`.
//
// Ce fichier vit dans `migrations/pending/` : le migrator ne lit PAS les sous-dossiers
// (readdir non récursif + filtre `isFile`), donc il ne s'exécute JAMAIS tant qu'il est ici.
// ⚠️ Cette migration DROP `from_api` → ne la remonter dans `migrations/` qu'APRÈS le backfill
// prod (sinon perte de provenance), dans un commit séparé postérieur au deploy 1.
//
// Pré-requis prod avant activation :
//   1. Org ENGIE créée + credential (token v1 hashé) inséré.
//   2. Backfill de la provenance :
//        UPDATE users SET from_organization_id = (SELECT id FROM organizations WHERE name = 'ENGIE')
//        WHERE from_api = (SELECT key FROM api_accounts WHERE name = 'ENGIE');
//
// Nettoyage code à faire dans le MÊME commit que l'activation :
//   - src/services/api/authentication.ts  : supprimer `apiUser` (mort depuis deploy 1).
//   - src/server/db/kysely/database.ts    : supprimer l'interface `ApiAccounts`, `Users.from_api`,
//                                           et `api_accounts: ApiAccounts` de l'interface `DB`.
//   - src/modules/users/server/service.ts : retirer `from_api` de `CreateUserInput` ; simplifier la liste
//                                           `from_api IS NOT NULL OR from_organization_id IS NOT NULL`
//                                           → `from_organization_id IS NOT NULL`.
//   (Les badges admin lisent le booléen aliasé `from_api` de la liste → OK une fois simplifié.)
//   NE PAS toucher aux migrations historiques (00000000000000, 20260615120000).
//
// Activation : renommer `<timestamp frais>_cleanup_api_accounts.ts` et remonter dans `migrations/`.
// ─────────────────────────────────────────────────────────────────────────────

import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE users DROP COLUMN from_api;`.execute(db);
  await sql`DROP TABLE api_accounts;`.execute(db);
}

// Irréversible en pratique (données perdues). `down` recrée la structure vide, best-effort.
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
