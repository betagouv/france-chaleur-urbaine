import { type Kysely, sql } from 'kysely';

import { createLogger } from '@/server/helpers/logger';

const logger = createLogger('migration:normalize_zero_network_prices');

/**
 * Normalise les prix inférieurs à 1 € des réseaux de chaleur en NULL (« non communiqué » : saisies à 0 € ou en centimes).
 * Seuil aligné sur businessRules.heatNetworkPriceCommunicatedMin ; la synchro Airtable → Postgres applique
 * désormais la même règle (TypePrice dans download-network.ts).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE reseaux_de_chaleur SET "PM" = NULL WHERE "PM" < 1;
    UPDATE reseaux_de_chaleur SET "PM_L" = NULL WHERE "PM_L" < 1;
    UPDATE reseaux_de_chaleur SET "PM_T" = NULL WHERE "PM_T" < 1;
  `.execute(db);
  logger.info('prix inférieurs à 1 € normalisés en NULL');
}

export async function down(): Promise<void> {
  // Irréversible : les valeurs 0 d'origine ne peuvent pas être restaurées.
}
