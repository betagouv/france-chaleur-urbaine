import { sql } from 'kysely';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { USER_ROLE } from '@/types/enum/UserRole';

export type Statistiques = Awaited<ReturnType<typeof statistiques>>;

const statistiques = async () => {
  const comptesProCreated = await kdb
    .selectFrom('users')
    .select([
      sql<string>`TO_CHAR(date_trunc('month', created_at), 'yyyy-mm-dd')`.as('date'),
      sql<number>`COUNT(CASE WHEN role = ${USER_ROLE.PROFESSIONNEL} THEN 1 END)`.as('professionnels'),
      sql<number>`COUNT(CASE WHEN role = ${USER_ROLE.PARTICULIER} THEN 1 END)`.as('particuliers'),
    ])
    .groupBy(sql`date_trunc('month', created_at)`)
    .orderBy('date', 'asc')
    .execute();

  return {
    comptesPro: {
      crees: comptesProCreated,
      total: comptesProCreated.reduce((acc, curr) => acc + curr.professionnels + curr.particuliers, 0),
    },
  };
};

export default handleRouteErrors(statistiques);
