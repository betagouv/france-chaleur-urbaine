import bcrypt from 'bcryptjs';
import type { UpdateObject } from 'kysely';

import { buildRubriques, ROLE_TYPE_ORGANISME } from '@/modules/ademe-connect/constants';
import { createContact, updateContact } from '@/modules/ademe-connect/server/client';
import { sendEmailTemplate } from '@/modules/email';
import {
  createUserAdminSchema,
  type StructureType,
  structureTypesLabels,
  type UpdateProfileSchema,
  updateUserAdminSchema,
} from '@/modules/users/constants';
import { type DB, kdb, sql, type Users } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';
import { logger } from '@/server/helpers/logger';
import { isOneOf } from '@/utils/array';

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
    count: records.length,
    items: records,
  };
};
export type User = Awaited<ReturnType<typeof list>>['items'][number];

export const create: typeof baseModel.create = async ({ optin_at, ...data }, _context) => {
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(Math.random().toString(36).slice(2, 10), salt);

  const record = await baseModel.create({ ...data, optin_at: optin_at ? new Date() : null, password, status: 'valid' }, _context);

  if (data.active && data.role === 'gestionnaire') {
    await sendEmailTemplate('auth.inscription', { email: data.email as string, id: (record as any).id });
  }

  if (isOneOf(data.role, ['gestionnaire', 'particulier', 'professionnel'] as const)) {
    createContact({
      abonnementNewsletter: false,
      acceptationRGPD: false,
      email: data.email as string,
      nom: (data.last_name as string) || '',
      prenom: (data.first_name as string) || '',
      rubriques: buildRubriques(data.role, data.structure_type && structureTypesLabels[data.structure_type as StructureType]),
      telephone: (data.phone as string) || undefined,
      typeOrganisme: ROLE_TYPE_ORGANISME[data.role],
    }).catch((error) => logger.error('ademe-connect createContact failed on user.invite', { error, user_id: record.id }));
  }

  return record;
};
export const update: typeof baseModel.update = async (id, data, config, _context) => {
  const { optin_at, ...userUpdate } = data as UpdateObject<DB, 'users'>;

  return baseModel.update(id, { ...userUpdate, optin_at: optin_at ? new Date() : null }, config, _context);
};

/**
 * Supprime un utilisateur et toutes ses données associées en cascade.
 * Marque le contact comme inactif dans ADEME Connect.
 */
export const remove: typeof baseModel.remove = async (id, config, context) => {
  const record = await baseModel.remove(id, config, context);
  updateContact((record as Users).email, { actif: false }).catch((error) =>
    logger.error('ademe-connect updateContact failed on user delete', { error, user_id: id })
  );
  return record;
};

export const validation = {
  create: createUserAdminSchema,
  update: updateUserAdminSchema,
};

export const getProfile = async (userId: string) => {
  return kdb
    .selectFrom('users')
    .select(['id', 'email', 'role', 'first_name', 'last_name', 'phone', 'structure_name', 'structure_type', 'structure_other', 'optin_at'])
    .where('id', '=', userId)
    .executeTakeFirst();
};

export const updateProfile = async (userId: string, data: UpdateProfileSchema) => {
  const result = await kdb.updateTable('users').set(data).where('id', '=', userId).executeTakeFirst();

  return result.numUpdatedRows > 0;
};

export const updateNewsletterSubscription = async (userId: string, optin: boolean) => {
  await kdb
    .updateTable('users')
    .set({ optin_at: optin ? new Date() : null })
    .where('id', '=', userId)
    .executeTakeFirstOrThrow();
};
