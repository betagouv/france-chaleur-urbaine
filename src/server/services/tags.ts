import { z } from 'zod';

import { createBaseModel } from '@/server/db/kysely/base-model';

export const tableName = 'tags';

const baseModel = createBaseModel(tableName);

export const create = baseModel.create;
export const list = baseModel.list;
export const update = baseModel.update;
export const remove = baseModel.remove;

export const validation = {
  create: z.object({
    name: z.string(),
  }),
  update: z.object({
    name: z.string().optional(),
  }),
};
