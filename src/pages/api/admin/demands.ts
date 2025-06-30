import { AirtableDB } from '@/server/db/airtable';
import { logger } from '@/server/helpers/logger';
import { handleRouteErrors } from '@/server/helpers/server';
import { getDetailedEligibilityStatus } from '@/server/services/addresseInformation';
import { findMetropoleNameTagByCity } from '@/server/services/epci';
import { type AdminDemand } from '@/types/Summary/Demand';

const GET = async () => {
  let startTime = Date.now();
  const records = await AirtableDB('FCU - Utilisateurs')
    .select({
      filterByFormula: '{Gestionnaires validés} = FALSE()',
      sort: [{ field: 'Date demandes', direction: 'desc' }],
    })
    .all();

  logger.info('airtable.getAdminDemands', {
    recordsCount: records.length,
    duration: Date.now() - startTime,
  });

  startTime = Date.now();
  const demands = (
    await Promise.all(
      records.map(async (record) => {
        const demand = { id: record.id, ...record.fields } as AdminDemand;
        demand['Gestionnaires validés'] ??= false;
        demand['Commentaire'] ??= '';
        demand['Commentaires_internes_FCU'] ??= '';

        if (!demand.Latitude || !demand.Longitude || !demand.Ville) {
          logger.warn('missing demand fields', {
            demandId: demand.id,
            missingFields: ['Latitude', 'Longitude', 'Ville'],
          });
          return null;
        }

        const detailedEligibilityStatus = await getDetailedEligibilityStatus(demand.Latitude, demand.Longitude);
        const metropoleName = await findMetropoleNameTagByCity(detailedEligibilityStatus.commune.insee_com!);
        return {
          ...demand,
          detailedEligibilityStatus,
          networkTags: detailedEligibilityStatus.tags,
          recommendedTags: [
            {
              type: 'ville',
              name: demand.Ville,
            },
            ...(metropoleName
              ? [
                  {
                    type: 'metropole',
                    name: metropoleName,
                  } as const,
                ]
              : []),
          ],
        } satisfies AdminDemand;
      })
    )
  ).filter((v) => v !== null);
  logger.info('getDetailedEligilityStatus', {
    recordsCount: records.length,
    duration: Date.now() - startTime,
  });
  return demands;
};

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
