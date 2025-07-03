import { AirtableDB } from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { handleRouteErrors } from '@/server/helpers/server';
import { getDetailedEligibilityStatus } from '@/server/services/addresseInformation';
import { findMetropoleNameTagByCity } from '@/server/services/epci';
import { type AdminDemand } from '@/types/Summary/Demand';
import { evaluateAST, parseExpressionToAST } from '@/utils/expression-parser';

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

  const assignmentRules = await kdb
    .selectFrom('assignment_rules')
    .select(['search_pattern', 'result'])
    .where('active', 'is', true)
    .orderBy('search_pattern', 'asc')
    .execute();
  // Parse les règles une seule fois
  const parsedRules = assignmentRules
    .map((rule) => {
      try {
        return {
          ast: parseExpressionToAST(rule.search_pattern),
          result: rule.result,
          search_pattern: rule.search_pattern,
        };
      } catch (error) {
        logger.warn('Failed to parse assignment rule', {
          rule: rule.search_pattern,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return null;
      }
    })
    .filter((rule): rule is NonNullable<typeof rule> => rule !== null);

  function getRecommendedAssignment(tags: string[]) {
    for (const rule of parsedRules) {
      try {
        const matches = evaluateAST(rule.ast, tags);
        if (matches) {
          return rule.result;
        }
      } catch (error) {
        logger.warn('Failed to evaluate assignment rule', {
          rule: rule.search_pattern,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    return '';
  }

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

        const recommendedTags = [
          {
            type: 'ville',
            name: demand.Ville,
          },
          ...(metropoleName
            ? [
                {
                  type: 'metropole' as const,
                  name: metropoleName,
                },
              ]
            : []),
          ...detailedEligibilityStatus.tags.map((tag) => ({
            type: 'reseau' as const,
            name: tag,
          })),
        ] satisfies AdminDemand['recommendedTags'];

        return {
          ...demand,
          detailedEligibilityStatus,
          networkTags: detailedEligibilityStatus.tags,
          recommendedTags,
          recommendedAssignment: getRecommendedAssignment(recommendedTags.map((tag) => tag.name)),
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
