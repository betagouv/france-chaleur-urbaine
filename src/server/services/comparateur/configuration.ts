import { z } from 'zod';

import { createBaseModel } from '@/server/db/kysely/base-model';

export const tableName = 'pro_comparateur_configurations';

const baseModel = createBaseModel(tableName);

export const create = baseModel.createMine;
export const list = baseModel.listMine;
export const get = baseModel.get; // A user can get any configuration when it's shared with him
export const update = baseModel.updateMine;
export const remove = baseModel.removeMine;

export const validation = {
  create: z.object({
    name: z.string(),
    situation: z.record(z.string(), z.any()),
    address: z.string().optional(),
  }),
  update: z.object({
    name: z.string().optional(),
    situation: z.record(z.string(), z.any()).optional(),
    address: z.string().optional(),
  }),
};
