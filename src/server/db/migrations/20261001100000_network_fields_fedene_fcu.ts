import type { Kysely } from 'kysely';
import { sql } from 'kysely';

const tables = ['reseaux_de_chaleur', 'reseaux_de_froid'] as const;
const fields = [
  { column: 'nom_reseau', fcu: 'nom_reseau_fcu', fedene: 'nom_reseau_fedene' },
  { column: 'Gestionnaire', fcu: 'gestionnaire_fcu', fedene: 'gestionnaire_fedene' },
  { column: 'MO', fcu: 'mo_fcu', fedene: 'mo_fedene' },
] as const;

/**
 * Provenance of the name, gestionnaire and maître d'ouvrage of heat and cold networks: one column written by the FEDENE
 * import (`*_fedene`), one written by the admin (`*_fcu`, null = no correction), and the historical column becomes a
 * generated column `coalesce(fcu, fedene)` so every reader (API, opendata, tiles, pages) keeps its name.
 *
 * Data: the current value is kept as the survey value and no correction is set; the one-off Airtable metadata import run
 * right after the deployment splits the provenance from the Airtable per-edition columns.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // the opendata views are recreated by the archive script at each run
  await sql`DROP VIEW IF EXISTS opendata.reseaux_de_chaleur_shp, opendata.reseaux_de_froid_shp, opendata.reseaux_de_chaleur, opendata.reseaux_de_froid CASCADE`.execute(
    db
  );
  for (const table of tables) {
    for (const field of fields) {
      await sql
        .raw(
          `ALTER TABLE ${table} ADD COLUMN ${field.fedene} text, ADD COLUMN ${field.fcu} text;
           UPDATE ${table} SET ${field.fedene} = "${field.column}";
           ALTER TABLE ${table} DROP COLUMN "${field.column}",
             ADD COLUMN "${field.column}" text GENERATED ALWAYS AS (COALESCE(${field.fcu}, ${field.fedene})) STORED`
        )
        .execute(db);
    }
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  for (const table of tables) {
    for (const field of fields) {
      await sql
        .raw(
          `ALTER TABLE ${table} DROP COLUMN "${field.column}", ADD COLUMN "${field.column}" character varying(254);
           UPDATE ${table} SET "${field.column}" = COALESCE(${field.fcu}, ${field.fedene});
           ALTER TABLE ${table} DROP COLUMN ${field.fcu}, DROP COLUMN ${field.fedene}`
        )
        .execute(db);
    }
  }
}
