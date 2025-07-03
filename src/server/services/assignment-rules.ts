import { z } from 'zod';

import { kdb } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';
import { validateExpression } from '@/utils/expression-parser';

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
        (pattern) => {
          const validation = validateExpression(pattern);
          return { message: `Expression invalide: ${validation.error}` };
        }
      ),
    result: z.string().min(1, 'Le résultat est requis'),
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
        (pattern) => {
          const validation = validateExpression(pattern);
          return { message: `Expression invalide: ${validation.error}` };
        }
      )
      .optional(),
    result: z.string().min(1, 'Le résultat est requis').optional(),
    active: z.boolean().optional(),
  }),
};
