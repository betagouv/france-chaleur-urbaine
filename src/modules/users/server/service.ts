import bcrypt from 'bcryptjs';
import type { UpdateObject } from 'kysely';

import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import { getAllPermissionsWithLabels } from '@/modules/permissions/server/search';
import { createUserAdminSchema, type UpdateProfileSchema, updateUserAdminSchema } from '@/modules/users/constants';
import type { Context } from '@/server/api/crud';
import { type DB, kdb, sql } from '@/server/db/kysely';
import { createBaseModel, type ListConfig } from '@/server/db/kysely/base-model';
import type { UserRole } from '@/types/enum/UserRole';
import { fetchJSON } from '@/utils/network';

export const tableName = 'users';

const baseModel = createBaseModel(tableName);

export const list = async () => {
  const [records, permissionsByUser] = await Promise.all([
    kdb
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
        'siret',
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
      .execute(),
    getAllPermissionsWithLabels(),
  ]);

  const items = records.map((record) => ({
    ...record,
    permissions: permissionsByUser[record.id] ?? [],
  }));

  return {
    count: items.length,
    items,
  };
};
export type User = Awaited<ReturnType<typeof list>>['items'][number];

export const create: typeof baseModel.create = async ({ optin_at, ...data }, context) => {
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(Math.random().toString(36).slice(2, 10), salt);

  const record = await baseModel.create({ ...data, optin_at: optin_at ? new Date() : null, password, status: 'valid' }, context);

  if (data.active && data.role === 'gestionnaire') {
    await sendEmailTemplate('auth.gestionnaire.ouverture-espace', { email: data.email as string, id: (record as any).id });
  }

  await createUserEvent({
    author_id: context.user.id,
    context_id: (record as any).id,
    context_type: 'user',
    data: { role: data.role as UserRole, user_email: data.email as string },
    type: 'user_created_by_admin',
  });

  return record;
};
export const update: typeof baseModel.update = async (id, data, config, context) => {
  const { optin_at, ...userUpdate } = data as UpdateObject<DB, 'users'>;

  const updated = await baseModel.update(id, { ...userUpdate, optin_at: optin_at ? new Date() : null }, config, context);

  await createUserEvent({
    author_id: context.user.id,
    context_id: id,
    context_type: 'user',
    data: { changes: data as any, user_email: (updated as any).email },
    type: 'user_updated_by_admin',
  });

  return updated;
};

/**
 * Supprime un utilisateur et toutes ses données associées en cascade.
 */
export const remove = async (id: string, config: ListConfig<typeof tableName>, context: Context) => {
  const user = await kdb.selectFrom('users').select('email').where('id', '=', id).executeTakeFirstOrThrow();
  const result = await baseModel.remove(id, config, context);

  await createUserEvent({
    author_id: context.user.id,
    context_id: id,
    context_type: 'user',
    data: { user_email: user.email },
    type: 'user_deleted_by_admin',
  });

  return result;
};

export const validation = {
  create: createUserAdminSchema,
  update: updateUserAdminSchema,
};

export const getProfile = async (userId: string) => {
  return kdb
    .selectFrom('users')
    .select(['id', 'email', 'role', 'first_name', 'last_name', 'phone', 'structure_name', 'structure_type', 'structure_other'])
    .where('id', '=', userId)
    .executeTakeFirst();
};

export const updateProfile = async (userId: string, data: UpdateProfileSchema) => {
  const result = await kdb.updateTable('users').set(data).where('id', '=', userId).executeTakeFirst();

  return result.numUpdatedRows > 0;
};

type RechercheEntreprisesResponse = {
  results: Array<{
    nom_complet: string;
    nom_raison_sociale: string;
    siege: { siret: string; adresse: string; code_postal: string; libelle_commune: string };
  }>;
};

/**
 * Looks up a SIRET via the public recherche-entreprises API.
 */
export const lookupSiret = async (siret: string) => {
  const data = await fetchJSON<RechercheEntreprisesResponse>('https://recherche-entreprises.api.gouv.fr/search', {
    params: { q: siret },
  });

  const match = data.results.find((r) => r.siege.siret === siret);
  if (!match) {
    return null;
  }

  return {
    address: match.siege.adresse,
    name: match.nom_complet,
    siret: match.siege.siret,
  };
};
