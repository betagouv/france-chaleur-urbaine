import type { ExpressionBuilder, Insertable } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

import { createUserEvent } from '@/modules/events/server/service';
import { type ReminderNetworkType, type ReminderType, reminderNetworkTypeToTable } from '@/modules/reseaux/constants';
import { type DB, kdb, type NetworkReminders } from '@/server/db/kysely';

type ReminderOuterTable = (typeof reminderNetworkTypeToTable)[ReminderNetworkType];

export type NetworkReminderListItem = {
  id: string;
  author_email: string | null;
  note: string | null;
  created_at: string;
};

/**
 * Correlated subquery that aggregates reminders for the parent network table and reminder type
 * into a typed JSON array, ordered most-recent first. Use inside a `.select((eb) => [...])` block.
 */
export function reminderJsonAggSQL(
  eb: ExpressionBuilder<DB, ReminderOuterTable>,
  parentTable: ReminderOuterTable,
  networkType: ReminderNetworkType,
  reminderType: ReminderType
) {
  return jsonArrayFrom(
    eb
      .selectFrom('network_reminders as nr')
      .leftJoin('users as u', 'u.id', 'nr.author_id')
      .select(['nr.id', 'u.email as author_email', 'nr.note', 'nr.created_at'])
      .whereRef('nr.network_id', '=', `${parentTable}.id_fcu`)
      .where('nr.network_type', '=', networkType)
      .where('nr.type', '=', reminderType)
      .orderBy('nr.created_at', 'desc')
  );
}

export async function createNetworkReminder(
  params: Pick<Insertable<NetworkReminders>, 'author_id' | 'created_at' | 'network_id' | 'network_type' | 'note' | 'type'>
) {
  const { created_at, ...rest } = params;
  const values = created_at ? { ...rest, created_at } : rest;
  const reminder = await kdb.insertInto('network_reminders').values(values).returning(['id', 'created_at']).executeTakeFirstOrThrow();

  await createUserEvent({
    author_id: params.author_id!,
    context_id: String(params.network_id),
    context_type: 'network',
    data: {
      network_id: params.network_id,
      network_type: params.network_type,
      note: params.note ?? null,
      reminder_id: reminder.id,
      type: params.type,
    },
    type: 'network_reminder_created',
  });

  return reminder;
}

export async function updateNetworkReminder(id: string, changes: { note?: string | null; created_at?: Date }, actorId: string) {
  const existing = await kdb
    .selectFrom('network_reminders')
    .select(['id', 'network_id', 'network_type', 'type', 'note', 'created_at'])
    .where('id', '=', id)
    .executeTakeFirstOrThrow();

  const eventChanges: Partial<{ note: string | null; created_at: string }> = {};
  if ('note' in changes && changes.note !== existing.note) {
    eventChanges.note = changes.note ?? null;
  }
  if (changes.created_at && changes.created_at.toISOString() !== new Date(existing.created_at).toISOString()) {
    eventChanges.created_at = changes.created_at.toISOString();
  }

  if (Object.keys(eventChanges).length === 0) {
    return existing;
  }

  await kdb.updateTable('network_reminders').set(changes).where('id', '=', id).execute();

  await createUserEvent({
    author_id: actorId,
    context_id: String(existing.network_id),
    context_type: 'network',
    data: {
      changes: eventChanges,
      network_id: existing.network_id,
      network_type: existing.network_type,
      reminder_id: existing.id,
      type: existing.type,
    },
    type: 'network_reminder_updated',
  });

  return existing;
}

export async function deleteNetworkReminder(id: string, actorId: string) {
  const existing = await kdb
    .selectFrom('network_reminders')
    .select(['id', 'network_id', 'network_type', 'type', 'note', 'created_at'])
    .where('id', '=', id)
    .executeTakeFirstOrThrow();

  await kdb.deleteFrom('network_reminders').where('id', '=', id).execute();

  await createUserEvent({
    author_id: actorId,
    context_id: String(existing.network_id),
    context_type: 'network',
    data: {
      created_at: new Date(existing.created_at).toISOString(),
      network_id: existing.network_id,
      network_type: existing.network_type,
      note: existing.note,
      reminder_id: existing.id,
      type: existing.type,
    },
    type: 'network_reminder_deleted',
  });
}

export async function updateNetworkNotes(networkId: number, networkType: ReminderNetworkType, notes: string | null) {
  const table = reminderNetworkTypeToTable[networkType];
  await kdb.updateTable(table).set({ notes }).where('id_fcu', '=', networkId).execute();
}
