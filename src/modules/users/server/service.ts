import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import type { z } from 'zod';

import { buildRubriques, ROLE_TYPE_ORGANISME } from '@/modules/ademe-connect/constants';
import { createContact } from '@/modules/ademe-connect/server/client';
import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import { getAllPermissionsWithLabels } from '@/modules/permissions/server/search';
import {
  createUserAdminSchema,
  type Entreprise,
  type StructureType,
  type UpdateProfileSchema,
  updateUserAdminSchema,
} from '@/modules/users/constants';
import type { Context } from '@/server/api/crud';
import { serverConfig } from '@/server/config';
import { type DB, kdb, sql } from '@/server/db/kysely';
import { createBaseModel, type ListConfig } from '@/server/db/kysely/base-model';
import { logger } from '@/server/helpers/logger';
import { isOneOf } from '@/utils/array';
import { fetchJSON } from '@/utils/network';

/** Champs validés par le formulaire admin + champs internes acceptés (ex. provenance posée par les sync API). */
type CreateUserInput = z.infer<typeof createUserAdminSchema> & {
  from_organization_id?: string | null;
};
type UpdateUserInput = z.infer<typeof updateUserAdminSchema>;

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
        'entreprise',
        'optin_at',
        'created_at',
        'last_connection',
        'from_organization_id',
        sql<boolean>`coalesce(receive_new_demands, false)`.as('receive_new_demands'),
        sql<boolean>`coalesce(receive_old_demands, false)`.as('receive_old_demands'),
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

export const create = async (data: CreateUserInput, context: Context): Promise<DB['users']> => {
  const { optin_at, entreprise, ...rest } = data;

  const existingUser = await kdb.selectFrom('users').select('id').where('email', '=', data.email).executeTakeFirst();
  if (existingUser) {
    throw new TRPCError({ code: 'CONFLICT', message: `L'utilisateur associé à l'email '${data.email}' existe déjà.` });
  }

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(Math.random().toString(36).slice(2, 10), salt);

  const record = await baseModel.create(
    {
      ...rest,
      entreprise: entreprise ? toEntrepriseJsonb(await findEtablissementBySiret(entreprise.siret)) : null,
      optin_at: optin_at ? new Date() : null,
      password,
      status: 'valid',
    },
    context
  );

  if (data.active && data.role === 'gestionnaire') {
    await sendEmailTemplate('auth.gestionnaire.ouverture-espace', { email: data.email, id: (record as any).id });
  }

  // Hors contexte utilisateur (ex. sync API), le caller émet son propre événement.
  if (context.user?.id) {
    await createUserEvent({
      author_id: context.user.id,
      context_id: (record as any).id,
      context_type: 'user',
      data: { role: data.role, user_email: data.email },
      type: 'user_created_by_admin',
    });
  }

  if (isOneOf(data.role, ['gestionnaire', 'particulier', 'professionnel'] as const)) {
    createContact({
      abonnementNewsletter: false,
      acceptationRGPD: false,
      email: data.email,
      nom: data.last_name || undefined,
      prenom: data.first_name || undefined,
      rubriques: buildRubriques(data.role, data.structure_type as StructureType | null | undefined),
      telephone: data.phone || undefined,
      typeOrganisme: ROLE_TYPE_ORGANISME[data.role],
    }).catch((error) => logger.error('ademe-connect createContact failed on user.invite', { error, user_id: record.id }));
  }

  return record;
};

export const update = async (
  id: string,
  data: UpdateUserInput,
  config: ListConfig<typeof tableName>,
  context: Context
): Promise<DB['users']> => {
  const { optin_at, entreprise, ...userUpdate } = data;

  const updated = await baseModel.update(
    id,
    {
      ...userUpdate,
      optin_at: optin_at ? new Date() : null,
      // Clé absente du payload → on ne touche pas. Présente avec null → on efface. Présente avec un objet → on re-fetch via SIRET.
      ...('entreprise' in data
        ? { entreprise: entreprise ? toEntrepriseJsonb(await findEtablissementBySiret(entreprise.siret)) : null }
        : {}),
    },
    config,
    context
  );

  await createUserEvent({
    author_id: context.user.id,
    context_id: id,
    context_type: 'user',
    data: { changes: data, user_email: (updated as any).email },
    type: 'user_updated_by_admin',
  });

  return updated;
};

/**
 * Supprime un utilisateur et toutes ses données associées en cascade.
 * Marque le contact comme inactif dans ADEME Connect.
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
    .select([
      'id',
      'email',
      'role',
      'first_name',
      'last_name',
      'phone',
      'structure_name',
      'structure_type',
      'structure_other',
      'entreprise',
      'optin_at',
    ])
    .where('id', '=', userId)
    .executeTakeFirst();
};

export const updateProfile = async (userId: string, data: UpdateProfileSchema) => {
  const { entreprise, ...rest } = data;
  const result = await kdb
    .updateTable('users')
    .set({
      ...rest,
      // Clé absente du payload → on ne touche pas. Présente avec null → on efface. Présente avec un objet → on re-fetch via SIRET.
      ...('entreprise' in data
        ? { entreprise: entreprise ? toEntrepriseJsonb(await findEtablissementBySiret(entreprise.siret)) : null }
        : {}),
    })
    .where('id', '=', userId)
    .executeTakeFirst();

  return result.numUpdatedRows > 0;
};

type RechercheEntreprisesResponse = {
  results: Array<{
    nom_complet: string;
    matching_etablissements: Array<{ siret: string; adresse: string }>;
  }>;
};

/**
 * Cherche l'établissement correspondant au SIRET via l'API publique recherche-entreprises.
 * Throw si aucun établissement ne matche. Le caller doit passer un SIRET non-null.
 */
export const findEtablissementBySiret = async (siret: string): Promise<Entreprise> => {
  const data = await fetchJSON<RechercheEntreprisesResponse>(`${serverConfig.rechercheEntreprisesApiUrl}/search`, {
    params: { q: siret },
  });

  const etablissement = data.results
    .flatMap((entreprise) =>
      entreprise.matching_etablissements.map((etablissement) => ({ ...etablissement, nom_complet: entreprise.nom_complet }))
    )
    .find((etablissement) => etablissement.siret === siret);

  if (!etablissement) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'SIRET introuvable' });
  }

  return {
    adresse: etablissement.adresse,
    nom_complet: etablissement.nom_complet,
    siret: etablissement.siret,
  };
};

/** Sérialise une `Entreprise` en expression JSONB pour insert/update. */
const toEntrepriseJsonb = (e: Entreprise | null) => (e ? sql<string | null>`${JSON.stringify(e)}::jsonb` : null);

export const updateNewsletterSubscription = async (userId: string, optin: boolean) => {
  await kdb
    .updateTable('users')
    .set({ optin_at: optin ? new Date() : null })
    .where('id', '=', userId)
    .executeTakeFirstOrThrow();
};
