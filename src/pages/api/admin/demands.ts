import { AirtableDB } from '@/server/db/airtable';
import { logger } from '@/server/helpers/logger';
import { handleRouteErrors } from '@/server/helpers/server';
import { getDetailedEligibilityStatus, getEligilityStatus } from '@/server/services/addresseInformation';
import { findMetropoleNameByCity } from '@/server/services/metropoles';
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

        const eligibilityStatus = await getEligilityStatus(demand.Latitude, demand.Longitude, demand.Ville); // TODO à supprimer une fois getDetailedEligibilityStatus suffisant
        const detailedEligibilityStatus = await getDetailedEligibilityStatus(demand.Latitude, demand.Longitude);
        const tagGestionnaire = getTagGestionnaire(eligibilityStatus.gestionnaire);
        const metropoleName = findMetropoleNameByCity(demand.Ville);
        return {
          ...demand,
          eligibilityStatus,
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
                    name: `${metropoleName}M`,
                  } as const,
                ]
              : []),
            ...(tagGestionnaire
              ? [
                  {
                    type: 'gestionnaire',
                    name: tagGestionnaire,
                  } as const,
                ]
              : []),
            ...(tagGestionnaire && eligibilityStatus.id
              ? [
                  {
                    type: 'reseau',
                    name: `${tagGestionnaire}_${eligibilityStatus.id}`,
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

function getTagGestionnaire(gestionnaireReseau: string | null) {
  const gestionnaire = (gestionnaireReseau ?? '').toLocaleLowerCase();
  return gestionnaire.includes('dalkia')
    ? 'Dalkia'
    : gestionnaire.includes('idex')
      ? 'IDEX'
      : gestionnaire.includes('coriance')
        ? 'Coriance'
        : gestionnaire.includes('engie')
          ? 'ENGIE'
          : null;
}
