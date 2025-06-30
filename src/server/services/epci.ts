import { kdb, sql } from '@/server/db/kysely';

/**
 * Recherche un tag d'EPCI (métropole principalement) à partir du code INSEE d'une ville.
 * Si la ville fait partie d'une métropole, le tag est de la forme "NomMétropoleM".
 * Le tag doit aussi exister dans la table tags pour avoir du sens.
 *
 * @param codeInsee Code INSEE de la ville
 * @returns
 */
export const findMetropoleNameTagByCity = async (codeInsee: string): Promise<string | null> => {
  const epci = await kdb
    .selectFrom('epci')
    .selectAll()
    .where('membres', '@>', sql<string>`jsonb_build_array(jsonb_build_object('code', '${sql.lit(codeInsee)}'))`)
    .executeTakeFirst();

  const tagName = epci ? `${(epci.membres as any)[0].nom}M` : null;
  if (!tagName) {
    return null;
  }
  // ensure that the tag exists
  const tag = await kdb.selectFrom('tags').select('name').where('name', '=', tagName).executeTakeFirst();
  return tag ? tagName : null;
};
