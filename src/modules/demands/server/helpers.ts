import * as Sentry from '@sentry/nextjs';
import { TRPCError } from '@trpc/server';
import type { Selectable } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';

import type { Context } from '@/modules/config/server/context-builder';
import { demandStatusDefault, normalizeHeatingEnergy, normalizeHeatingType } from '@/modules/demands/constants';
import { canUserAccessDemand, type DemandForAccess, isUserResponsibleForDemand } from '@/modules/permissions/server/service';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import type { NetworkType } from '@/modules/reseaux/constants';
import { type Demands, kdb, type ProEligibilityTestsAddresses, sql } from '@/server/db/kysely';
import { userRolesWithPermissions } from '@/types/enum/UserRole';

import type { AccessCounts } from '../types';
import { getEntityFromEligibilityType } from './eligibility';

/**
 * Sous-ensemble des champs de `pro_eligibility_tests_addresses` que `buildDemandQuery` expose réellement.
 */
type DemandTestAddress = Pick<
  Selectable<ProEligibilityTestsAddresses>,
  'id' | 'ban_address' | 'ban_valid' | 'source_address' | 'eligibility_history'
>;

const loadDemandForAccessOrThrow = async (demandId: string): Promise<DemandForAccess> =>
  kdb
    .selectFrom('demands')
    .select(['network_id', 'network_type', 'validated', 'commune_code', 'epci_code', 'ept_code', 'departement_code', 'region_code'])
    .where('id', '=', demandId)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' }));

/**
 * Garantit que la demande existe ET que l'utilisateur peut la **consulter** (lecture, historique mail, etc.).
 * Lève NOT_FOUND si introuvable, FORBIDDEN si pas d'accès. Admin : NOT_FOUND uniquement (bypass auth).
 */
export const ensureUserCanAccessDemand = async (ctx: Context, demandId: string): Promise<void> => {
  const demand = await loadDemandForAccessOrThrow(demandId);
  if (ctx.user.role === 'admin') return;
  const permissions = await ctx.getPermissions();
  if (!canUserAccessDemand(ctx.user, permissions, demand)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Demande hors de votre périmètre' });
  }
};

/**
 * Garantit que la demande existe ET que l'utilisateur peut la **traiter** (statut, contact, commentaire, mail).
 * Lève NOT_FOUND si introuvable, FORBIDDEN si pas responsable. Admin : NOT_FOUND uniquement (bypass auth).
 */
export const ensureUserCanProcessDemand = async (ctx: Context, demandId: string): Promise<void> => {
  const demand = await loadDemandForAccessOrThrow(demandId);
  if (ctx.user.role === 'admin') return;
  const permissions = await ctx.getPermissions();
  if (!isUserResponsibleForDemand(ctx.user, permissions, demand)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Demande hors de votre périmètre de traitement' });
  }
};

/**
 * Requête de base pour les demandes, jointe avec le test d'adresse associé (exposé comme `testAddress`)
 * et enrichie avec les infos du réseau affecté (`network_name`, `network_sncu_id`, `network_tags`)
 * et les compteurs d'utilisateurs ayant accès à la demande (`access_counts`, par rôle, hors admin).
 *
 * Note : `is_responsible` est calculé côté JS via `isUserResponsibleForDemand` après requête, jamais en SQL.
 * Raison : `ctx.getPermissions()` retourne les permissions du JWT (impostune-aware) ; lire `user_permissions`
 * en SQL contournerait l'impostune et donnerait des résultats incohérents.
 *
 * Perf : `access_counts` est pré-agrégé via une CTE plutôt qu'un sous-select corrélé, ce qui évite
 * que PG exécute le calcul une fois par demande (et déclenche le JIT sur un cost estimé délirant).
 */
export const buildDemandQuery = () => {
  // Extraits typés des champs JSON `pending_assignment_change` (réutilisés dans plusieurs joins).
  const pendingNetworkId = sql<number>`(demands.pending_assignment_change->>'network_id')::int`;
  const pendingNetworkType = sql<'existant' | 'en_construction'>`demands.pending_assignment_change->>'network_type'`;
  const pendingAuthorId = sql<string>`(demands.pending_assignment_change->>'author_id')::uuid`;

  return kdb
    .with('access_counts_by_demand', (eb) =>
      eb
        .selectFrom('demands as d')
        .innerJoin('user_permissions as up', (j) =>
          j.on((eb) =>
            eb.or([
              eb('up.type', '=', 'national'),
              eb.and([
                eb('up.type', '=', 'reseau_existant'),
                eb('d.network_type', '=', 'existant'),
                eb('up.resource_id', '=', sql<string>`${eb.ref('d.network_id')}::text`),
              ]),
              eb.and([
                eb('up.type', '=', 'reseau_en_construction'),
                eb('d.network_type', '=', 'en_construction'),
                eb('up.resource_id', '=', sql<string>`${eb.ref('d.network_id')}::text`),
              ]),
              eb.and([eb('up.type', '=', 'commune'), eb('up.resource_id', '=', eb.ref('d.commune_code'))]),
              eb.and([eb('up.type', '=', 'epci'), eb('up.resource_id', '=', eb.ref('d.epci_code'))]),
              eb.and([eb('up.type', '=', 'ept'), eb('up.resource_id', '=', eb.ref('d.ept_code'))]),
              eb.and([eb('up.type', '=', 'departement'), eb('up.resource_id', '=', eb.ref('d.departement_code'))]),
              eb.and([eb('up.type', '=', 'region'), eb('up.resource_id', '=', eb.ref('d.region_code'))]),
            ])
          )
        )
        .innerJoin('users as u', 'u.id', 'up.user_id')
        .where('u.active', '=', true)
        .where('u.role', 'in', userRolesWithPermissions)
        .groupBy('d.id')
        .select((eb) => [
          eb.ref('d.id').as('demand_id'),
          jsonBuildObject({
            alec: eb.fn.countAll<number>().filterWhere('u.role', '=', 'alec'),
            collectivite: eb.fn.countAll<number>().filterWhere('u.role', '=', 'collectivite'),
            gestionnaire: eb.fn.countAll<number>().filterWhere('u.role', '=', 'gestionnaire'),
          }).as('access_counts'),
        ])
    )
    .selectFrom('demands')
    .innerJoin('pro_eligibility_tests_addresses', 'pro_eligibility_tests_addresses.demand_id', 'demands.id')
    .leftJoin('reseaux_de_chaleur as rdc', (j) =>
      j.onRef('rdc.id_fcu', '=', 'demands.network_id').on('demands.network_type', '=', 'existant')
    )
    .leftJoin('zones_et_reseaux_en_construction as zrc', (j) =>
      j.onRef('zrc.id_fcu', '=', 'demands.network_id').on('demands.network_type', '=', 'en_construction')
    )
    .leftJoin('reseaux_de_chaleur as pending_rdc', (j) =>
      j.on('pending_rdc.id_fcu', '=', pendingNetworkId).on(pendingNetworkType, '=', 'existant')
    )
    .leftJoin('zones_et_reseaux_en_construction as pending_zrc', (j) =>
      j.on('pending_zrc.id_fcu', '=', pendingNetworkId).on(pendingNetworkType, '=', 'en_construction')
    )
    .leftJoin('users as pending_author', (j) => j.on('pending_author.id', '=', pendingAuthorId))
    .leftJoin('access_counts_by_demand as acbd', 'acbd.demand_id', 'demands.id')
    .selectAll('demands')
    .select((eb) => [
      eb.fn.coalesce('rdc.nom_reseau', 'zrc.nom_reseau').as('network_name'),
      eb.ref('rdc.Identifiant reseau').as('network_sncu_id'),
      eb.fn.coalesce('rdc.tags', 'zrc.tags').as('network_tags'),
      eb.fn.coalesce('pending_rdc.nom_reseau', 'pending_zrc.nom_reseau').as('pending_assignment_name'),
      eb.ref('pending_rdc.Identifiant reseau').as('pending_assignment_sncu_id'),
      eb.ref('pending_author.email').as('pending_assignment_author_email'),
      jsonBuildObject({
        ban_address: eb.ref('pro_eligibility_tests_addresses.ban_address'),
        ban_valid: eb.ref('pro_eligibility_tests_addresses.ban_valid'),
        eligibility_history: eb.ref('pro_eligibility_tests_addresses.eligibility_history'),
        id: eb.ref('pro_eligibility_tests_addresses.id'),
        source_address: eb.ref('pro_eligibility_tests_addresses.source_address'),
      }).as('testAddress'),
      eb.fn
        .coalesce(
          eb.ref('acbd.access_counts'),
          jsonBuildObject({ alec: sql<number>`0`, collectivite: sql<number>`0`, gestionnaire: sql<number>`0` })
        )
        .as('access_counts'),
    ]);
};

/**
 * Récupère une demande par id avec son test d'adresse joint.
 */
export const getDemandById = async (demandId: string) => {
  return buildDemandQuery()
    .where('demands.id', '=', demandId)
    .executeTakeFirstOrThrow(() => new Error('Demande non trouvée'));
};

/**
 * Résout le nom et l'identifiant SNCU d'un réseau à partir de son type et son id_fcu.
 * Renvoie des nulls si le réseau n'existe plus (ou n'a jamais existé).
 */
export const resolveNetworkInfo = async (
  networkType: NetworkType,
  networkId: number
): Promise<{ network_name: string | null; network_sncu_id: string | null }> => {
  if (networkType === 'existant') {
    const reseau = await kdb
      .selectFrom('reseaux_de_chaleur')
      .select([sql<string | null>`"Identifiant reseau"`.as('sncu_id'), 'nom_reseau'])
      .where('id_fcu', '=', networkId)
      .executeTakeFirst();
    return { network_name: reseau?.nom_reseau ?? null, network_sncu_id: reseau?.sncu_id ?? null };
  }
  const reseau = await kdb
    .selectFrom('zones_et_reseaux_en_construction')
    .select('nom_reseau')
    .where('id_fcu', '=', networkId)
    .executeTakeFirst();
  return { network_name: reseau?.nom_reseau ?? null, network_sncu_id: null };
};

/**
 * Enrichit une demande pour l'affichage côté gestionnaire :
 * normalisation du chauffage, historique d'éligibilité augmenté, flag `haut_potentiel`.
 * `access_counts` (compteurs d'accès par rôle, fournis par `buildDemandQuery`) est passé tel quel.
 */
export const enrichDemandForGestionnaire = <T extends Selectable<Demands>>({
  demand: { legacy_values, access_counts, ...demand },
  testAddress,
}: {
  demand: T & { access_counts: AccessCounts };
  testAddress: DemandTestAddress | null;
}) => {
  const history = testAddress?.eligibility_history as ProEligibilityTestHistoryEntry[] | undefined;
  const augmentedHistory = (history || []).map((entry) => {
    return {
      ...entry,
      eligibility: {
        ...entry.eligibility,
        entity: getEntityFromEligibilityType(entry.eligibility?.type),
      },
    };
  });

  const lastEligibility = augmentedHistory?.[augmentedHistory.length - 1];
  legacy_values['en PDP'] = lastEligibility?.eligibility?.type.includes('dans_pdp') ? 'Oui' : 'Non';
  legacy_values['Prise de contact'] ??= false;
  legacy_values.Status ??= demandStatusDefault;

  const rawHeatingEnergy = legacy_values['Mode de chauffage'];
  if (rawHeatingEnergy) {
    const normalizedHeatingEnergy = normalizeHeatingEnergy(rawHeatingEnergy);
    if (normalizedHeatingEnergy) {
      legacy_values['Mode de chauffage'] = normalizedHeatingEnergy;
    } else {
      Sentry.captureMessage(`Valeur "Mode de chauffage" non reconnue: "${rawHeatingEnergy}"`, {
        extra: { demandId: demand.id, rawValue: rawHeatingEnergy },
        level: 'error',
      });
    }
  }

  const rawHeatingType = legacy_values['Type de chauffage'];
  if (rawHeatingType) {
    const normalizedHeatingType = normalizeHeatingType(rawHeatingType);
    if (normalizedHeatingType) {
      legacy_values['Type de chauffage'] = normalizedHeatingType;
    } else {
      Sentry.captureMessage(`Valeur "Type de chauffage" non reconnue: "${rawHeatingType}"`, {
        extra: { demandId: demand.id, rawValue: rawHeatingType },
        level: 'error',
      });
    }
  }

  const isParis = legacy_values.Gestionnaires?.includes('Paris');
  const distanceThreshold = isParis ? 60 : 100;
  const isHautPotentiel =
    legacy_values['Type de chauffage'] === 'Collectif' &&
    ((legacy_values['Distance au réseau'] || 10000000) < distanceThreshold ||
      (legacy_values.Logement || 0) >= 100 ||
      legacy_values.Structure === 'Tertiaire');

  return {
    access_counts,
    haut_potentiel: isHautPotentiel,
    ...legacy_values,
    ...demand,
    testAddress: {
      ...testAddress,
      eligibility: lastEligibility?.eligibility,
      eligibility_history: augmentedHistory,
    },
  };
};

/**
 * Enrichit une demande pour l'affichage côté admin :
 * idem gestionnaire + valeur par défaut sur `Relance à activer`.
 */
export const enrichDemandForAdmin = <T extends Selectable<Demands>>({
  demand,
  testAddress,
}: {
  demand: T & { access_counts: AccessCounts };
  testAddress: DemandTestAddress | null;
}) => {
  const enriched = enrichDemandForGestionnaire({ demand, testAddress });
  enriched['Relance à activer'] ??= false;
  return enriched;
};

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 10000;
};

/**
 * Anonymise un email (mode démo / anonymisation) en gardant un identifiant stable.
 */
export const anonymizeEmail = (email: string | undefined): string => {
  if (!email) return 'anonyme@example.com';
  const hash = simpleHash(email);
  return `utilisateur${hash}@exemple.fr`;
};

/**
 * Anonymise un nom ou prénom en gardant uniquement la première lettre.
 */
export const anonymizeName = (name: string | undefined): string => {
  if (!name) return '***';
  return `${name.charAt(0)}***`;
};

/**
 * Retourne un numéro de téléphone masqué (mode démo / anonymisation).
 */
export const anonymizePhone = (): string => {
  return '06 ** ** ** **';
};
