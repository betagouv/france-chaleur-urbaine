import { TRPCError } from '@trpc/server';
import { sql } from 'kysely';

import type { EventDataMap } from '@/modules/events/constants';
import { createUserEvent } from '@/modules/events/server/service';
import { kdb } from '@/server/db/kysely';
import { ObjectKeys } from '@/utils/typescript';

import type { UserTagColor } from '../constants';

export type UserTag = { id: string; name: string; color: UserTagColor };

// ─── Catalog ──────────────────────────────────────────────────────────────

export const listTags = async (): Promise<UserTag[]> =>
  kdb
    .selectFrom('user_tags')
    .select(['id', 'name', 'color'])
    .orderBy((eb) => eb.fn<string>('lower', ['name']))
    .execute();

export const createTag = async (name: string, color: UserTagColor, authorId: string): Promise<UserTag> => {
  const existing = await kdb
    .selectFrom('user_tags')
    .select('id')
    .where(sql<boolean>`immutable_unaccent(lower(name)) = immutable_unaccent(lower(${name}))`)
    .executeTakeFirst();
  if (existing) {
    throw new TRPCError({ code: 'CONFLICT', message: `L'étiquette « ${name} » existe déjà.` });
  }

  const created = await kdb.insertInto('user_tags').values({ color, name }).returning(['id', 'name', 'color']).executeTakeFirstOrThrow();
  await createUserEvent({
    author_id: authorId,
    context_id: created.id,
    context_type: 'user_tag',
    data: { color: created.color, name: created.name, tag_id: created.id },
    type: 'user_tag_created',
  });
  return created;
};

export const updateTag = async (id: string, patch: { name: string; color: UserTagColor }, authorId: string): Promise<UserTag> => {
  const conflict = await kdb
    .selectFrom('user_tags')
    .select('id')
    .where(sql<boolean>`immutable_unaccent(lower(name)) = immutable_unaccent(lower(${patch.name}))`)
    .where('id', '!=', id)
    .executeTakeFirst();
  if (conflict) {
    throw new TRPCError({ code: 'CONFLICT', message: `L'étiquette « ${patch.name} » existe déjà.` });
  }

  const previous = await kdb.selectFrom('user_tags').select(['name', 'color']).where('id', '=', id).executeTakeFirst();

  const updated = await kdb
    .updateTable('user_tags')
    .set({ color: patch.color, name: patch.name, updated_at: new Date() })
    .where('id', '=', id)
    .returning(['id', 'name', 'color'])
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Étiquette introuvable' }));

  const changes: EventDataMap['user_tag_updated']['changes'] = {};
  if (previous && previous.name !== updated.name) changes.name = { from: previous.name, to: updated.name };
  if (previous && previous.color !== updated.color) changes.color = { from: previous.color, to: updated.color };
  if (ObjectKeys(changes).length > 0) {
    await createUserEvent({
      author_id: authorId,
      context_id: updated.id,
      context_type: 'user_tag',
      data: { changes, name: updated.name, tag_id: updated.id },
      type: 'user_tag_updated',
    });
  }
  return updated;
};

/** Removes the tag from the catalog; ON DELETE CASCADE detaches it from every user. */
export const deleteTag = async (id: string, authorId: string): Promise<void> => {
  const tag = await kdb.selectFrom('user_tags').select(['id', 'name', 'color']).where('id', '=', id).executeTakeFirst();
  if (!tag) return;

  await kdb.deleteFrom('user_tags').where('id', '=', id).execute();
  await createUserEvent({
    author_id: authorId,
    context_id: tag.id,
    context_type: 'user_tag',
    data: { color: tag.color, name: tag.name, tag_id: tag.id },
    type: 'user_tag_deleted',
  });
};

// ─── Assignments ──────────────────────────────────────────────────────────

export const getUserTags = async (userId: string): Promise<UserTag[]> =>
  kdb
    .selectFrom('user_tag_assignments as uta')
    .innerJoin('user_tags as t', 't.id', 'uta.tag_id')
    .select(['t.id', 't.name', 't.color'])
    .where('uta.user_id', '=', userId)
    .orderBy((eb) => eb.fn<string>('lower', ['t.name']))
    .execute();

/** All assignments grouped by user, for the admin list (avoids N+1). */
export const getAllUserTags = async (): Promise<Record<string, UserTag[]>> => {
  const rows = await kdb
    .selectFrom('user_tag_assignments as uta')
    .innerJoin('user_tags as t', 't.id', 'uta.tag_id')
    .select(['uta.user_id', 't.id', 't.name', 't.color'])
    .orderBy((eb) => eb.fn<string>('lower', ['t.name']))
    .execute();

  return rows.reduce<Record<string, UserTag[]>>((grouped, row) => {
    (grouped[row.user_id] ??= []).push({ color: row.color, id: row.id, name: row.name });
    return grouped;
  }, {});
};

/**
 * Replaces all of a user's tags. Emits a `user_updated_by_admin` event with the diff
 * (added / removed names) only when something actually changed.
 */
export const setUserTags = async (userId: string, tagIds: string[], authorId: string): Promise<void> => {
  const uniqueTagIds = [...new Set(tagIds)];

  const catalog = await listTags();
  const catalogById = new Map(catalog.map((tag) => [tag.id, tag]));
  const unknownIds = uniqueTagIds.filter((tagId) => !catalogById.has(tagId));
  if (unknownIds.length > 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Étiquette inconnue' });
  }

  const oldTags = await getUserTags(userId);

  await kdb.transaction().execute(async (tx) => {
    await tx.deleteFrom('user_tag_assignments').where('user_id', '=', userId).execute();
    if (uniqueTagIds.length > 0) {
      await tx
        .insertInto('user_tag_assignments')
        .values(uniqueTagIds.map((tagId) => ({ tag_id: tagId, user_id: userId })))
        .execute();
    }
  });

  const oldIds = new Set(oldTags.map((tag) => tag.id));
  const newIds = new Set(uniqueTagIds);
  const addedNames = uniqueTagIds
    .filter((tagId) => !oldIds.has(tagId))
    .flatMap((tagId) => {
      const tag = catalogById.get(tagId);
      return tag ? [tag.name] : [];
    });
  const removedNames = oldTags.filter((tag) => !newIds.has(tag.id)).map((tag) => tag.name);

  if (addedNames.length > 0 || removedNames.length > 0) {
    const targetUser = await kdb.selectFrom('users').select('email').where('id', '=', userId).executeTakeFirstOrThrow();
    await createUserEvent({
      author_id: authorId,
      context_id: userId,
      context_type: 'user',
      data: { changes: { tags: { added: addedNames, removed: removedNames } }, user_email: targetUser.email },
      type: 'user_updated_by_admin',
    });
  }
};

export type BulkAddTagsResult = {
  /** Number of users matched by email. */
  matchedUserCount: number;
  /** Normalized emails with no matching user (nothing was created for them). */
  notFoundEmails: string[];
  /** Number of (user, tag) rows actually inserted (excludes already-assigned pairs). */
  assignmentsAdded: number;
};

/**
 * Adds catalog tags to every user matched by email (case-insensitive), leaving their existing
 * tags untouched. Already-assigned pairs are skipped via ON CONFLICT DO NOTHING, so the returned
 * rows are exactly the new assignments. Emits one `user_updated_by_admin` event per user that
 * gained at least one tag.
 */
export const addTagsToUsersByEmail = async (tagIds: string[], emails: string[], authorId: string): Promise<BulkAddTagsResult> => {
  const uniqueTagIds = [...new Set(tagIds)];

  const catalog = await listTags();
  const catalogById = new Map(catalog.map((tag) => [tag.id, tag]));
  const unknownIds = uniqueTagIds.filter((tagId) => !catalogById.has(tagId));
  if (unknownIds.length > 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Étiquette inconnue' });
  }

  const normalizedEmails = [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
  if (normalizedEmails.length === 0 || uniqueTagIds.length === 0) {
    return { assignmentsAdded: 0, matchedUserCount: 0, notFoundEmails: normalizedEmails };
  }

  const users = await kdb
    .selectFrom('users')
    .select(['id', 'email'])
    .where((eb) => eb(eb.fn<string>('lower', ['email']), 'in', normalizedEmails))
    .execute();

  const matchedEmails = new Set(users.map((user) => user.email.toLowerCase()));
  const notFoundEmails = normalizedEmails.filter((email) => !matchedEmails.has(email));
  if (users.length === 0) {
    return { assignmentsAdded: 0, matchedUserCount: 0, notFoundEmails };
  }

  const pairs = users.flatMap((user) => uniqueTagIds.map((tagId) => ({ tag_id: tagId, user_id: user.id })));
  const inserted = await kdb
    .insertInto('user_tag_assignments')
    .values(pairs)
    .onConflict((oc) => oc.doNothing())
    .returning(['user_id', 'tag_id'])
    .execute();

  // Group the freshly inserted pairs by user to emit a per-user audit event with the added names.
  const addedNamesByUser: Record<string, string[]> = {};
  for (const row of inserted) {
    const tag = catalogById.get(row.tag_id);
    if (!tag) continue;
    (addedNamesByUser[row.user_id] ??= []).push(tag.name);
  }

  const userById = new Map(users.map((user) => [user.id, user]));
  for (const [userId, addedNames] of Object.entries(addedNamesByUser)) {
    const user = userById.get(userId);
    if (!user) continue;
    await createUserEvent({
      author_id: authorId,
      context_id: userId,
      context_type: 'user',
      data: { changes: { tags: { added: addedNames } }, user_email: user.email },
      type: 'user_updated_by_admin',
    });
  }

  return { assignmentsAdded: inserted.length, matchedUserCount: users.length, notFoundEmails };
};
