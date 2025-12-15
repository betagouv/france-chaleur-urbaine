import { z } from 'zod';

import { type AssignmentRules, kdb } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';
import { parentLogger } from '@/server/helpers/logger';
import type { DetailedEligibilityStatus } from '@/server/services/addresseInformation';
import { evaluateAST, parseExpressionToAST, parseResultActions, validateExpression, validateResult } from '@/utils/expression-parser';

const logger = parentLogger.child({
  module: 'assignment_rules',
});

export const tableName = 'assignment_rules';

const baseModel = createBaseModel(tableName);

export const list = baseModel.list;

export const create = baseModel.create;
export const update = baseModel.update;
export const remove = baseModel.remove;

export const validation = {
  create: z.object({
    active: z.boolean().optional(),
    result: z
      .string()
      .min(1, 'Le résultat est requis')
      .refine(
        (result) => {
          const validationResult = validateResult(result);
          return validationResult.isValid;
        },
        {
          message: 'Format de résultat invalide',
        }
      ),
    search_pattern: z
      .string()
      .min(1, 'La règle est requise')
      .refine(
        (pattern) => {
          const validationResult = validateExpression(pattern);
          return validationResult.isValid;
        },
        {
          message: 'Expression invalide',
        }
      ),
  }),
  update: z.object({
    active: z.boolean().optional(),
    result: z
      .string()
      .min(1, 'Le résultat est requis')
      .refine(
        (result) => {
          const validationResult = validateResult(result);
          return validationResult.isValid;
        },
        {
          message: 'Format de résultat invalide',
        }
      )
      .optional(),
    search_pattern: z
      .string()
      .min(1, 'La règle est requise')
      .refine(
        (pattern) => {
          const validationResult = validateExpression(pattern);
          return validationResult.isValid;
        },
        {
          message: 'Expression invalide',
        }
      )
      .optional(),
  }),
};

export type AssignmentRule = Awaited<ReturnType<typeof list>>['items'][number];

const parseAssignmentRule = (rule: Pick<AssignmentRules, 'result' | 'search_pattern'>) => {
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

export const listActive = async () => {
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

export const parseAssignmentRules = async (assignmentRules: Pick<AssignmentRules, 'result' | 'search_pattern'>[]) => {
  return assignmentRules.map(parseAssignmentRule).filter((v) => v !== null);
};

/**
 * Applique les règles d'assignation aux données d'éligibilité et retourne les tags et affectations.
 */
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
