import { AirtableDB } from '@/server/db/airtable';
import { logger } from '@/server/helpers/logger';
import { handleRouteErrors } from '@/server/helpers/server';
import { getEligilityStatus } from '@/server/services/addresseInformation';
import { type AdminDemand } from '@/types/Summary/Demand';

const GET = async () => {
  const startTime = Date.now();
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

  const demands = await Promise.all(
    records.map(async (record) => {
      const demand = { id: record.id, ...record.fields } as AdminDemand;
      const eligibilityStatus = await getEligilityStatus(demand.Latitude, demand.Longitude, demand.Ville);
      const tagGestionnaire = getTagGestionnaire(eligibilityStatus.gestionnaire);
      return {
        ...demand,
        eligibilityStatus,
        recommended_tags: [
          {
            type: 'ville',
            name: demand.Ville,
          },
          // {
          //   type: 'metropole',
          //   name: demand.Metropole,
          // },
          ...(tagGestionnaire
            ? [
                {
                  type: 'gestionnaire',
                  name: tagGestionnaire,
                },
              ]
            : []),
        ],
      };
    })
  );

  return demands;
  // TODO ajouter les tags conseillés, ville, métropole, gestionnaire, réseau
  // TODO ajouter l'éligibilité pour chaque demande pour avoir plus d'informations
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
