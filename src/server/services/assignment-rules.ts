import { z } from 'zod';

import { kdb } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';
import { type DetailedEligibilityStatus } from '@/server/services/addresseInformation';
import { evaluateAST, parseExpressionToAST, parseResultActions, validateExpression, validateResult } from '@/utils/expression-parser';

export const tableName = 'assignment_rules';

const baseModel = createBaseModel(tableName);

export const list = async () => {
  const records = await kdb
    .selectFrom('assignment_rules')
    .select(['id', 'search_pattern', 'result', 'active', 'created_at', 'updated_at'])
    .orderBy('search_pattern', 'asc')
    .execute();

  return {
    items: records,
    count: records.length,
  };
};
export type AssignmentRule = Awaited<ReturnType<typeof list>>['items'][number];

export const create = baseModel.create;
export const update = baseModel.update;
export const remove = baseModel.remove;

/**
 * Applique les règles d'assignation aux données d'éligibilité et retourne les tags et affectations
 */
export const applyRulesToEligibilityData = async (
  eligibilityData: DetailedEligibilityStatus
): Promise<{
  tags: string[];
  assignment: string | null;
}> => {
  // Récupérer toutes les règles actives
  const activeRules = await kdb
    .selectFrom('assignment_rules')
    .select(['search_pattern', 'result'])
    .where('active', '=', true)
    .orderBy('search_pattern', 'asc')
    .execute();

  const appliedTags: string[] = [];
  let assignment: string | null = null;

  // Appliquer chaque règle
  for (const rule of activeRules) {
    try {
      // Parser l'expression
      const ast = parseExpressionToAST(rule.search_pattern);

      // Évaluer la condition
      const matches = evaluateAST(ast, eligibilityData);

      if (matches) {
        // Parser et appliquer les actions
        const actions = parseResultActions(rule.result);

        for (const action of actions) {
          if (action.type === 'tag') {
            appliedTags.push(action.value);
          } else if (action.type === 'affecte' && assignment === null) {
            // Prendre la première affectation trouvée
            assignment = action.value;
          }
        }
      }
    } catch (error) {
      // Logger l'erreur mais continuer avec les autres règles
      console.warn('Failed to apply assignment rule', {
        rule: rule.search_pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    tags: [...new Set(appliedTags)], // Dédupliquer les tags
    assignment,
  };
};

export const validation = {
  create: z.object({
    search_pattern: z
      .string()
      .min(1, 'La règle est requise')
      .refine(
        (pattern) => {
          const validation = validateExpression(pattern);
          return validation.isValid;
        },
        {
          message: 'Expression invalide',
        }
      ),
    result: z
      .string()
      .min(1, 'Le résultat est requis')
      .refine(
        (result) => {
          const validation = validateResult(result);
          return validation.isValid;
        },
        {
          message: 'Format de résultat invalide',
        }
      ),
    active: z.boolean().optional(),
  }),
  update: z.object({
    search_pattern: z
      .string()
      .min(1, 'La règle est requise')
      .refine(
        (pattern) => {
          const validation = validateExpression(pattern);
          return validation.isValid;
        },
        {
          message: 'Expression invalide',
        }
      )
      .optional(),
    result: z
      .string()
      .min(1, 'Le résultat est requis')
      .refine(
        (result) => {
          const validation = validateResult(result);
          return validation.isValid;
        },
        {
          message: 'Format de résultat invalide',
        }
      )
      .optional(),
    active: z.boolean().optional(),
  }),
};
