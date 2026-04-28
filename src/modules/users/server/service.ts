import bcrypt from 'bcryptjs';
import type { UpdateObject } from 'kysely';

import { sendEmailTemplate } from '@/modules/email';
import { getAllPermissionsWithLabels } from '@/modules/permissions/server/search';
import { createUserAdminSchema, type UpdateProfileSchema, updateUserAdminSchema } from '@/modules/users/constants';
import { type DB, kdb, sql } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';

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

export const create: typeof baseModel.create = async ({ optin_at, ...data }, _context) => {
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(Math.random().toString(36).slice(2, 10), salt);

  const record = await baseModel.create({ ...data, optin_at: optin_at ? new Date() : null, password, status: 'valid' }, _context);

  if (data.active && data.role === 'gestionnaire') {
    await sendEmailTemplate('auth.inscription', { email: data.email as string, id: (record as any).id });
  }

  return record;
};
export const update: typeof baseModel.update = async (id, data, config, _context) => {
  const { optin_at, ...userUpdate } = data as UpdateObject<DB, 'users'>;

  return baseModel.update(id, { ...userUpdate, optin_at: optin_at ? new Date() : null }, config, _context);
};

/**
 * Supprime un utilisateur et toutes ses données associées en cascade.
 */
export const remove = baseModel.remove;

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

/**
 * Looks up a SIRET via the public recherche-entreprises API.
 * Returns company info for visual validation in the admin UI.
 */
export const lookupSiret = async (siret: string) => {
  const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(siret)}&mtm_campaign=fcu`);

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    results: Array<{
      nom_complet: string;
      nom_raison_sociale: string;
      siege: { siret: string; adresse: string; code_postal: string; libelle_commune: string };
      nature_juridique: string;
      tranche_effectif_salarie: string;
    }>;
  };

  const match = data.results.find((r) => r.siege.siret === siret);
  if (!match) {
    return null;
  }

  return {
    address: `${match.siege.adresse}, ${match.siege.code_postal} ${match.siege.libelle_commune}`,
    name: match.nom_complet,
    siret: match.siege.siret,
  };
};
