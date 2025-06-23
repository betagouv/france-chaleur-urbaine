import { z } from 'zod';

import { kdb, sql } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';
import { type User } from '@/types/User';

export const tableName = 'tags';

const baseModel = createBaseModel(tableName);

export const list = async () => {
  const records = await kdb
    .selectFrom('tags as t')
    .select(['t.id', 't.name', 't.type', 't.created_at', 't.updated_at'])
    .orderBy('t.name')
    .execute();

  return {
    items: records,
    count: records.length,
  };
};
export type Tag = Awaited<ReturnType<typeof list>>['items'][number];

export const listWithUsers = async () => {
  const records = await kdb
    .selectFrom('tags as t')
    .leftJoin(
      'users as u',
      (join) => join.on(sql.ref('t.name'), '=', sql`ANY(${sql.ref('u.gestionnaires')})`) // expression builder ne supporte pas `ANY()` directement
    )
    .select([
      't.id',
      't.name',
      't.type',
      't.created_at',
      't.updated_at',
      sql
        .raw<User[]>(
          `COALESCE(
          JSON_AGG(
            json_build_object(
              'id', u.id,
              'email', u.email,
              'tags', u.gestionnaires
            )
          ) FILTER (WHERE u.email IS NOT NULL),
          '[]'::json
        )`
        )
        .as('users'),
    ])
    .groupBy(['t.id', 't.name', 't.type', 't.created_at', 't.updated_at'])
    .orderBy('t.name')
    .execute();

  return records;
};
export type TagWithUsers = Awaited<ReturnType<typeof listWithUsers>>[number];

export const create = baseModel.create;
export const update = baseModel.update;
export const remove = baseModel.remove;

export const validation = {
  create: z.object({
    name: z.string(),
    type: z.string().optional(),
  }),
  update: z.object({
    name: z.string().optional(),
    type: z.string().optional(),
  }),
};
