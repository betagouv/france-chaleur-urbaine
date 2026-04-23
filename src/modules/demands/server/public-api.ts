import { kdb, sql } from '@/server/db/kysely';

/**
 * External API: returns demands matching tags from api_accounts.gestionnaires.
 * Used only by /api/v1/demands/[key] for API consumers.
 * @deprecated N'est plus fonctionnel depuis la migration vers le nouveau système de permissions
 */
export const getDemandsForGestionnairesApi = async (gestionnaires: string[]) => {
  const records = await kdb
    .selectFrom('demands')
    .selectAll()
    .where('validated', '=', true)
    .where('deleted_at', 'is', null)
    .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
    .execute();

  return records
    .map((record) => ({ id: record.id, ...record.legacy_values }))
    .filter((record) => record.Gestionnaires?.some((gestionnaire) => gestionnaires.includes(gestionnaire)));
};

/**
 * Retourne toutes les demandes au format legacy pour l'API publique de statistiques contacts.
 */
export const getAllDemandsForStats = async () => {
  const records = await kdb.selectFrom('demands').selectAll().orderBy(sql`legacy_values->>'Date de la demande'`, 'desc').execute();
  return records.map((record) => ({ id: record.id, ...record.legacy_values }));
};
