import { randomBytes } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import type { Kysely, Selectable } from 'kysely';
import type { z } from 'zod';

import { ALL_FCU_RUBRIQUES, buildRubriques, isSyncedRole, ROLE_TYPE_ORGANISME } from '@/modules/ademe-connect/constants';
import { createContact, updateContact } from '@/modules/ademe-connect/server/client';
import { sendEmailTemplate } from '@/modules/email';
import { anonymizeAccountsInEvents, createUserEvent } from '@/modules/events/server/service';
import { getAllPermissionsWithLabels } from '@/modules/permissions/server/search';
import { customTerritoryPermissionType, territoryPermissionResourceTypes } from '@/modules/permissions/types';
import { networkTypes } from '@/modules/reseaux/constants';
import {
  createUserAdminSchema,
  defaultUserPreferences,
  type Entreprise,
  type NotificationScope,
  parseUserPreferences,
  type StructureType,
  type UpdateProfileSchema,
  type UpdateUserPreferences,
  type UserPreferences,
  updateUserAdminSchema,
} from '@/modules/users/constants';
import { getAllUserTags } from '@/modules/users/server/tags-service';
import type { Context } from '@/server/api/crud';
import { serverConfig } from '@/server/config';
import { type DB, kdb, sql } from '@/server/db/kysely';
import { createBaseModel, type ListConfig } from '@/server/db/kysely/base-model';
import { logger } from '@/server/helpers/logger';
import { fetchJSON } from '@/utils/network';

/** Champs validés par le formulaire admin + champs internes acceptés (ex. provenance posée par les sync API). */
type CreateUserInput = z.infer<typeof createUserAdminSchema> & {
  from_organization_id?: string | null;
};
type UpdateUserInput = z.infer<typeof updateUserAdminSchema>;

export const tableName = 'users';

const baseModel = createBaseModel(tableName);

export const list = async () => {
  const [records, permissionsByUser, tagsByUser] = await Promise.all([
    kdb
      .selectFrom('users')
      .leftJoin('email_blocked_contacts as ebc', (join) => join.on((eb) => eb('ebc.email', '=', eb.fn<string>('lower', ['users.email']))))
      .select([
        'users.id',
        'users.email',
        'role',
        'active',
        'status',
        'accepted_cgu_at',
        'first_name',
        'last_name',
        'phone',
        'structure_name',
        'structure_type',
        'structure_other',
        'entreprise',
        'created_at',
        'last_connection',
        'from_organization_id',
        'preferences',
        'totp_enrolled_at',
        'ebc.reason_code as email_blocked_reason',
      ])
      .where('users.deleted_at', 'is', null)
      .orderBy('users.id')
      .execute(),
    getAllPermissionsWithLabels(),
    getAllUserTags(),
  ]);

  const items = records.map((record) => ({
    ...record,
    permissions: permissionsByUser[record.id] ?? [],
    preferences: parseUserPreferences(record.preferences),
    tags: tagsByUser[record.id] ?? [],
  }));

  return {
    count: items.length,
    items,
  };
};
export type User = Awaited<ReturnType<typeof list>>['items'][number];

export const create = async (data: CreateUserInput, context: Context): Promise<DB['users']> => {
  const { entreprise, notifications, ...rest } = data;

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
      password,
      preferences: JSON.stringify({ ...defaultUserPreferences, notifications } satisfies UserPreferences),
      status: 'valid',
    },
    context
  );

  if (data.active && data.role === 'gestionnaire') {
    await sendEmailTemplate('auth.gestionnaire.ouverture-espace', { email: data.email, id: (record as any).id });
  }
  if (data.active && data.role === 'ccrt') {
    // The legacy base model returns a table definition type rather than its selectable row type.
    await sendEmailTemplate('auth.ccrt.ouverture-espace', { email: data.email, id: (record as unknown as Selectable<DB['users']>).id });
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

  if (isSyncedRole(data.role)) {
    createContact({
      acceptationRGPD: false,
      email: data.email,
      nom: data.last_name || undefined,
      prenom: data.first_name || undefined,
      rubriques: buildRubriques(data.role, data.structure_type as StructureType | null | undefined),
      siret: entreprise?.siret,
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
  const { entreprise, notifications, ...userUpdate } = data;

  // The CRM contact is keyed by email: keep the one known before the update (an email change is not propagated).
  const previous = await kdb
    .selectFrom('users')
    .select('email')
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .executeTakeFirstOrThrow();

  const updated = await baseModel.update(
    id,
    {
      ...userUpdate,
      // Clé absente du payload → on ne touche pas. Présente avec null → on efface. Présente avec un objet → on re-fetch via SIRET.
      ...('entreprise' in data
        ? { entreprise: entreprise ? toEntrepriseJsonb(await findEtablissementBySiret(entreprise.siret)) : null }
        : {}),
      // Clé absente du payload → on ne touche pas. Présente → remplace le bloc notifications, le reste des préférences est conservé.
      ...(notifications ? { preferences: sql`preferences || ${JSON.stringify({ notifications })}::jsonb` } : {}),
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

  syncContactAfterAdminUpdate(id, previous.email).catch((error) =>
    logger.error('ademe-connect updateContact failed on user.update', { error, user_id: id })
  );

  return updated;
};

/** Resync of the CRM contact from the stored row: identity, phone, SIRET and rubriques (never `actif` nor the newsletter subscription). */
const syncContactAfterAdminUpdate = async (id: string, previousEmail: string) => {
  const user = await kdb
    .selectFrom('users')
    .select(['role', 'first_name', 'last_name', 'phone', 'structure_type', 'entreprise'])
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
  if (!isSyncedRole(user.role)) {
    return;
  }
  await updateContact(previousEmail, {
    nom: user.last_name ?? undefined,
    prenom: user.first_name ?? undefined,
    rubriques: buildRubriques(user.role, user.structure_type),
    rubriquesASupprimer: ALL_FCU_RUBRIQUES,
    siret: user.entreprise?.siret,
    telephone: user.phone ?? undefined,
    typeOrganisme: ROLE_TYPE_ORGANISME[user.role],
  });
};

/**
 * Adresse d'un compte supprimé : anonymisée, elle garde le domaine lisible et ne peut jamais recevoir de courrier
 * (`.invalid` est un domaine réservé).
 */
const getDeletedAccountEmail = (user: { id: string; email: string }) => {
  const domain = user.email.split('@')[1];
  // un compte déjà anonymisé par la règle de conservation porte déjà un domaine en `.invalid`
  return `supprime-${user.id}@${domain.endsWith('.invalid') ? domain : `${domain}.invalid`}`;
};

/**
 * Supprime un compte : la ligne reste dans `users` (`deleted_at`, email anonymisé, identité effacée) pour conserver
 * ses événements d'audit, ses données liées sont supprimées et ses demandes détachées.
 */
export const remove = async (id: string, _config: ListConfig<typeof tableName>, context: Context): Promise<DB['users']> => {
  const user = await kdb
    .selectFrom('users')
    .select(['id', 'email'])
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .executeTakeFirstOrThrow();
  const email = getDeletedAccountEmail(user);
  // mot de passe aléatoire inconnu : plus personne ne peut se connecter
  const unusablePassword = await bcrypt.hash(randomBytes(32).toString('hex'), await bcrypt.genSalt(10));

  const deleted = await kdb.transaction().execute(async (trx) => {
    // la ligne reste : ce que les clés étrangères supprimaient en cascade avec elle est supprimé ici
    await trx.deleteFrom('pro_eligibility_tests').where('user_id', '=', id).execute();
    await trx.deleteFrom('pro_comparateur_configurations').where('user_id', '=', id).execute();
    await trx.deleteFrom('jobs').where('user_id', '=', id).execute();
    await trx.deleteFrom('email_templates').where('user_id', '=', id).execute();
    await trx.deleteFrom('user_permissions').where('user_id', '=', id).execute();
    await trx.deleteFrom('user_tag_assignments').where('user_id', '=', id).execute();
    // détachées comme avant : un nouveau compte sur le même email les retrouve (`linkDemandsByEmail`)
    await trx.updateTable('demands').set({ user_id: null }).where('user_id', '=', id).execute();
    const row = await trx
      .updateTable('users')
      .set({
        activation_token: null,
        active: false,
        deleted_at: new Date(),
        email,
        entreprise: null,
        first_name: null,
        from_organization_id: null,
        last_name: null,
        newsletter_optin_at: null,
        password: unusablePassword,
        phone: null,
        preferences: sql`preferences || '{"email_signature": null}'::jsonb`,
        reset_token: null,
        structure_name: null,
        structure_other: null,
        totp_enrolled_at: null,
        totp_secret: null,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
    await anonymizeAccountsInEvents([id], trx);
    return row;
  });

  await createUserEvent({
    author_id: context.user.id,
    context_id: id,
    context_type: 'user',
    data: { user_email: email },
    type: 'user_deleted_by_admin',
  });

  // même contrat que le modèle générique, qui type les lignes renvoyées comme la table
  return deleted as unknown as DB['users'];
};

export const validation = {
  create: createUserAdminSchema,
  update: updateUserAdminSchema,
};

export const getProfile = async (userId: string) => {
  const user = await kdb
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
      'preferences',
    ])
    // the demand notifications only apply to accounts holding a network permission (classic demands)
    // or, for a CCRT, a territorial permission (renewable heat demands)
    .select((eb) =>
      eb
        .exists(
          eb
            .selectFrom('user_permissions as up')
            .select(sql`1`.as('one'))
            .whereRef('up.user_id', '=', 'users.id')
            .where('up.type', 'in', [...networkTypes])
        )
        .as('has_network_permission')
    )
    .select((eb) =>
      eb
        .exists(
          eb
            .selectFrom('user_permissions as up')
            .select(sql`1`.as('one'))
            .whereRef('up.user_id', '=', 'users.id')
            .where('up.type', 'in', [...territoryPermissionResourceTypes, customTerritoryPermissionType])
        )
        .as('has_territory_permission')
    )
    .where('id', '=', userId)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur non trouvé' }));
  const { has_network_permission, has_territory_permission, ...profile } = user;
  const notification_scope: NotificationScope | null =
    profile.role === 'ccrt' && has_territory_permission ? 'ccrt' : has_network_permission ? 'network' : null;
  return { ...profile, notification_scope, preferences: parseUserPreferences(user.preferences) };
};

export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  const row = await kdb.selectFrom('users').select('preferences').where('id', '=', userId).executeTakeFirstOrThrow();
  return parseUserPreferences(row.preferences);
};

/**
 * Fusionne une mise à jour partielle dans `users.preferences` (validée en objet complet) et trace l'événement.
 * Retourne les préférences résultantes.
 */
export const updateUserPreferences = async (
  userId: string,
  changes: UpdateUserPreferences,
  database: Kysely<DB> = kdb
): Promise<UserPreferences> => {
  if (!database.isTransaction) {
    return database.transaction().execute((transaction) => updateUserPreferences(userId, changes, transaction));
  }
  const row = await database.selectFrom('users').select('preferences').where('id', '=', userId).forUpdate().executeTakeFirstOrThrow();
  const current = parseUserPreferences(row.preferences);
  const preferences = parseUserPreferences({
    ...current,
    ...changes,
    notifications: { ...current.notifications, ...changes.notifications },
  });

  await database
    .updateTable('users')
    .set({ preferences: JSON.stringify(preferences) })
    .where('id', '=', userId)
    .executeTakeFirstOrThrow();

  await createUserEvent(
    {
      author_id: userId,
      context_id: userId,
      context_type: 'user',
      data: { changes },
      type: 'user_preferences_updated',
    },
    database
  );

  return preferences;
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
