import { z } from 'zod';

import { createBaseModel } from '@/server/db/kysely/base-model';

export const tableName = 'pro_comparateur_configurations';

const baseModel = createBaseModel(tableName);

export const create = baseModel.createMine;
export const list = baseModel.listMine;
export const get = baseModel.getMine;
export const update = baseModel.updateMine;
export const remove = baseModel.removeMine;

export const validation = {
  create: z.object({
    name: z.string(),
    situation: z.record(z.any()),
  }),
  update: z.object({
    name: z.string().optional(),
    situation: z.record(z.any()).optional(),
  }),
};
