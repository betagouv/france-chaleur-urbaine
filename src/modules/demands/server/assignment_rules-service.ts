import { kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import type { DetailedEligibilityStatus } from '@/server/services/addresseInformation';
import { evaluateAST, parseExpressionToAST, parseResultActions } from '@/utils/expression-parser';

const logger = parentLogger.child({
  module: 'assignment_rules',
});

export const tableName = 'assignment_rules';

export const parseAssignmentRule = (rule: Record<string, any> & { result: string; search_pattern: string }) => {
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
};

export const list = async () => {
  const assignmentRules = await kdb
    .selectFrom('assignment_rules')
    .select(['search_pattern', 'result'])
    .where('active', '=', true)
    .orderBy('search_pattern', 'asc')
    .execute();

  return {
    count: assignmentRules.length,
    items: assignmentRules,
  };
};

export const parseAssignmentRules = async (assignmentRules: Record<string, any> & { result: string; search_pattern: string }[]) => {
  return assignmentRules.map(parseAssignmentRule).filter((v) => v !== null);
};

export function applyParsedRulesToEligibilityData(
  parsedRules: NonNullable<ReturnType<typeof parseAssignmentRule>>[],
  eligibilityData: DetailedEligibilityStatus
): {
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
