import { AirtableDB } from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { handleRouteErrors } from '@/server/helpers/server';
import { type DetailedEligibilityStatus, getDetailedEligibilityStatus } from '@/server/services/addresseInformation';
import { findMetropoleNameTagByCity } from '@/server/services/epci';
import { type AdminDemand } from '@/types/Summary/Demand';
import { evaluateAST, parseExpressionToAST, parseResultActions } from '@/utils/expression-parser';

const GET = async () => {
  let startTime = Date.now();
  const records = await AirtableDB('FCU - Utilisateurs')
    .select({
      filterByFormula: '{Gestionnaires validés} = FALSE()',
      sort: [{ field: 'Date de la demande', direction: 'desc' }],
    })
    .all();

  logger.info('airtable.getAdminDemands', {
    recordsCount: records.length,
    duration: Date.now() - startTime,
  });

  // Récupére et parse les règles et leurs résultats
  const assignmentRules = await kdb
    .selectFrom('assignment_rules')
    .select(['search_pattern', 'result'])
    .where('active', '=', true)
    .orderBy('search_pattern', 'asc')
    .execute();
  const parsedRules = assignmentRules
    .map((rule) => {
      try {
        return {
          ast: parseExpressionToAST(rule.search_pattern),
          actions: parseResultActions(rule.result),
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

  function applyParsedRulesToEligibilityData(eligibilityData: DetailedEligibilityStatus): {
    tags: string[];
    assignment: string | null;
  } {
    const appliedTags: string[] = [];
    let assignment: string | null = null;

    for (const rule of parsedRules) {
      try {
        const matches = evaluateAST(rule.ast, eligibilityData);

        if (matches) {
          for (const action of rule.actions) {
            if (action.type === 'tag') {
              appliedTags.push(action.value);
            } else if (action.type === 'affecte' && assignment === null) {
              // prend la première affectation trouvée
              assignment = action.value;
            }
          }
        }
      } catch (error) {
        logger.warn('Failed to evaluate assignment rule', {
          rule: rule.search_pattern,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      tags: [...new Set(appliedTags)],
      assignment,
    };
  }

  startTime = Date.now();
  const demands = (
    await Promise.all(
      records.map(async (record) => {
        const demand = { id: record.id, ...record.fields } as AdminDemand;
        demand['Gestionnaires validés'] ??= false;
        demand['Commentaire'] ??= '';
        demand['Commentaires_internes_FCU'] ??= '';
        demand['Relance à activer'] ??= false;

        if (!demand.Latitude || !demand.Longitude || !demand.Ville) {
          logger.warn('missing demand fields', {
            demandId: demand.id,
            missingFields: ['Latitude', 'Longitude', 'Ville'],
          });
          return null;
        }

        const detailedEligibilityStatus = await getDetailedEligibilityStatus(demand.Latitude, demand.Longitude);
        const metropoleName = await findMetropoleNameTagByCity(detailedEligibilityStatus.commune.insee_com!);

        const rulesResult = applyParsedRulesToEligibilityData(detailedEligibilityStatus);

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
          // Ajouter les tags issus des règles
          ...rulesResult.tags.map((tag) => ({
            type: 'gestionnaire' as const,
            name: tag,
          })),
        ] satisfies AdminDemand['recommendedTags'];

        return {
          ...demand,
          detailedEligibilityStatus,
          recommendedTags,
          recommendedAssignment: rulesResult.assignment ?? 'Non affecté',
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
