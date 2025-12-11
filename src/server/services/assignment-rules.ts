import { z } from 'zod';

import { kdb } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';
import { validateExpression, validateResult } from '@/utils/expression-parser';

export const tableName = 'assignment_rules';

const baseModel = createBaseModel(tableName);

export const list = async () => {
  const records = await kdb
    .selectFrom('assignment_rules')
    .select(['id', 'search_pattern', 'result', 'active', 'created_at', 'updated_at'])
    .orderBy('search_pattern', 'asc')
    .execute();

  return {
    count: records.length,
    items: records,
  };
};
export type AssignmentRule = Awaited<ReturnType<typeof list>>['items'][number];

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
          const validation = validateResult(result);
          return validation.isValid;
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
          const validation = validateExpression(pattern);
          return validation.isValid;
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
          const validation = validateResult(result);
          return validation.isValid;
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
          const validation = validateExpression(pattern);
          return validation.isValid;
        },
        {
          message: 'Expression invalide',
        }
      )
      .optional(),
  }),
};
