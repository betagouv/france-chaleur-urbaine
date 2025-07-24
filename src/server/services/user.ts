import bcrypt from 'bcryptjs';
import { type UpdateObject } from 'kysely';

import { type DB, kdb, sql } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';
import { sendEmailTemplate } from '@/server/email';
import { createUserAdminSchema, updateUserAdminSchema } from '@/validation/user';

export const tableName = 'users';

const baseModel = createBaseModel(tableName);

export const list = async () => {
  const records = await kdb
    .selectFrom('users')
    .select([
      'id',
      'email',
      'role',
      'active',
      'status',
      'first_name',
      'last_name',
      'phone',
      'structure_name',
      'structure_type',
      'structure_other',
      'optin_at',
      'created_at',
      'last_connection',
      'gestionnaires',
      'gestionnaires_from_api',
      sql<boolean>`coalesce(receive_new_demands, false)`.as('receive_new_demands'),
      sql<boolean>`coalesce(receive_old_demands, false)`.as('receive_old_demands'),
      sql<boolean>`from_api IS NOT NULL`.as('from_api'),
    ])
    .orderBy('id')
    .execute();

  return {
    items: records,
    count: records.length,
  };
};
export type User = Awaited<ReturnType<typeof list>>['items'][number];

export const create: typeof baseModel.create = async (data, _context) => {
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(Math.random().toString(36).slice(2, 10), salt);

  const record = await baseModel.create({ ...data, password, status: 'valid' }, _context);

  if (data.active && data.role === 'gestionnaire') {
    await sendEmailTemplate('inscription', { id: (record as any).id, email: data.email as string });
  }

  return record;
};
export const update: typeof baseModel.update = async (id, data, config, _context) => {
  const { optin_at, ...userUpdate } = data as UpdateObject<DB, 'users'>;

  return baseModel.update(id, { ...userUpdate, optin_at: optin_at ? new Date() : null }, config, _context);
};
export const remove = baseModel.remove;

export const validation = {
  create: createUserAdminSchema,
  update: updateUserAdminSchema,
};
