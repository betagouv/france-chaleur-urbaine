import { z } from 'zod';

import { createUserEvent } from '@/modules/events/server/service';
import { kdb, sql } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';
import type { User } from '@/types/User';

export const tableName = 'tags';

const baseModel = createBaseModel(tableName);

export const list = async () => {
  const records = await kdb
    .selectFrom('tags as t')
    .select(['t.id', 't.name', 't.type', 't.created_at', 't.updated_at'])
    .orderBy('t.name')
    .execute();

  return {
    count: records.length,
    items: records,
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
          ) FILTER (WHERE u.email IS NOT NULL AND active IS TRUE),
          '[]'::json
        )`
        )
        .as('users'),
    ])
    .groupBy(['t.id', 't.name', 't.type', 't.created_at', 't.updated_at'])
    .orderBy('t.name')
    .execute();

  return {
    count: records.length,
    items: records,
  };
};
export type TagWithUsers = Awaited<ReturnType<typeof listWithUsers>>['items'][number];

export const create = baseModel.create;
export const update = baseModel.update;
export const remove = baseModel.remove;

export const validation = {
  create: z.object({
    comment: z.string().optional(),
    name: z.string(),
    type: z.string().optional(),
  }),
  update: z.object({
    comment: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
  }),
};

/**
 * Met à jour le commentaire d'un tag.
 */
export const updateTagComment = async (tagId: string, comment: string | null, authorId: string) => {
  const updated = await kdb
    .updateTable('tags')
    .set({
      comment: comment?.trim(),
      updated_at: new Date(),
    })
    .where('id', '=', tagId)
    .returning(['name', 'comment'])
    .executeTakeFirstOrThrow();

  await createUserEvent({
    author_id: authorId,
    context_id: tagId,
    context_type: 'tag',
    data: {
      comment: updated.comment,
      tag_name: updated.name,
    },
    type: 'tag_comment_updated',
  });
};

/**
 * Crée une relance pour un tag.
 */
export const createTagReminder = async (tagId: string, authorId: string) => {
  const tag = await kdb.selectFrom('tags').where('id', '=', tagId).select('name').executeTakeFirstOrThrow();

  const [reminder] = await kdb
    .insertInto('tags_reminders')
    .values({
      author_id: authorId,
      created_at: new Date(),
      tag_id: tagId,
    })
    .returningAll()
    .execute();

  await createUserEvent({
    author_id: authorId,
    context_id: tagId,
    context_type: 'tag',
    data: {
      tag_name: tag.name,
    },
    type: 'tag_reminder_created',
  });
};

/**
 * Supprime une relance pour un tag.
 */
export const deleteTagReminder = async (tagId: string, authorId: string) => {
  const tag = await kdb.selectFrom('tags').where('id', '=', tagId).select('name').executeTakeFirstOrThrow();
  const deleted = await kdb.deleteFrom('tags_reminders').where('tag_id', '=', tagId).returningAll().executeTakeFirst();

  if (deleted) {
    await createUserEvent({
      author_id: authorId,
      context_id: tagId,
      context_type: 'tag',
      data: {
        tag_name: tag.name,
      },
      type: 'tag_reminder_deleted',
    });
  }
};
