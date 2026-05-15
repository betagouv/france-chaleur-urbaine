import { kdb, sql } from '@/server/db/kysely';

/**
 * Retourne toutes les demandes au format legacy pour l'API publique de statistiques contacts.
 */
export const getAllDemandsForStats = async () => {
  const records = await kdb.selectFrom('demands').selectAll().orderBy(sql`legacy_values->>'Date de la demande'`, 'desc').execute();
  return records.map((record) => ({ id: record.id, ...record.legacy_values }));
};
