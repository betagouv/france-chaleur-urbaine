import { sql } from 'kysely';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { handleRouteErrors } from '@/server/helpers/server';
import { type DetailedEligibilityStatus, getDetailedEligibilityStatus } from '@/server/services/addresseInformation';
import type { AdminDemand } from '@/types/Summary/Demand';
import { evaluateAST, parseExpressionToAST, parseResultActions } from '@/utils/expression-parser';

const GET = async () => {
  let startTime = Date.now();

  const records = (
    await kdb
      .selectFrom('demands')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb(sql`airtable_legacy_values->>'Gestionnaires validés'`, '=', 'false'),
          eb(sql`airtable_legacy_values->>'Gestionnaires validés'`, 'is', null),
        ])
      )
      .orderBy(sql`airtable_legacy_values->>'AirtableDate de la demande'`, 'desc')
      .execute()
  ).map(({ id, airtable_legacy_values }) => ({
    fields: airtable_legacy_values,
    id,
  }));

  logger.info('kdb.getAdminDemands', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
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
          actions: parseResultActions(rule.result),
          ast: parseExpressionToAST(rule.search_pattern),
          search_pattern: rule.search_pattern,
        };
      } catch (error) {
        logger.warn('Failed to parse assignment rule', {
          error: error instanceof Error ? error.message : 'Unknown error',
          rule: rule.search_pattern,
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
          error: error instanceof Error ? error.message : 'Unknown error',
          rule: rule.search_pattern,
        });
      }
    }

    return {
      assignment,
      tags: [...new Set(appliedTags)],
    };
  }

  startTime = Date.now();
  const demands = (
    await Promise.all(
      records.map(async (record) => {
        const demand = { id: record.id, ...record.fields } as AdminDemand;
        demand['Gestionnaires validés'] ??= false;
        demand.Commentaire ??= '';
        demand.Commentaires_internes_FCU ??= '';
        demand['Relance à activer'] ??= false;

        if (!demand.Latitude || !demand.Longitude || !demand.Ville) {
          logger.warn('missing demand fields', {
            demandId: demand.id,
            missingFields: ['Latitude', 'Longitude', 'Ville'],
          });
          return null;
        }

        const detailedEligibilityStatus = await getDetailedEligibilityStatus(demand.Latitude, demand.Longitude);
        const rulesResult = applyParsedRulesToEligibilityData(detailedEligibilityStatus);

        return {
          ...demand,
          detailedEligibilityStatus,
          recommendedAssignment: rulesResult.assignment ?? 'Non affecté',
          recommendedTags: [...detailedEligibilityStatus.tags, ...rulesResult.tags],
        } satisfies AdminDemand;
      })
    )
  ).filter((v) => v !== null);
  logger.info('getDetailedEligilityStatus', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
  });
  return demands;
};

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
