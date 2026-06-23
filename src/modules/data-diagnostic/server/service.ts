import { sql } from 'kysely';

import { findAttachedNetworksNotMatchingPatterns, findUnattachedNetworksMatchingPatterns } from '@/modules/organizations/server/service';
import { kdb } from '@/server/db/kysely';

import { MAX_ITEMS_PER_ISSUE } from '../constants';
import type { DataDiagnosticResult, Issue, IssueItem } from '../types';

type IssueBuilder = () => Promise<Issue | null>;

const userHref = (userId: string, email: string) => `/admin/users?userId=${userId}&users_search=${encodeURIComponent(email)}`;

// La page /admin/demandes ne sait pas ouvrir une demande via l'URL — on désactive les presets
// (demands_filters=[]) et on pré-remplit la recherche avec l'adresse pour que la ligne remonte.
const demandHref = (address: string | null) => {
  const params = new URLSearchParams({ demands_filters: '[]' });
  if (address) {
    params.set('demands_search', address);
  }
  return `/admin/demandes?${params.toString()}`;
};

const fullName = (firstName: string | null, lastName: string | null) => [firstName, lastName].filter(Boolean).join(' ') || null;

const truncate = <T>(rows: T[], toItem: (row: T) => IssueItem) => {
  const totalCount = rows.length;
  const truncated = totalCount > MAX_ITEMS_PER_ISSUE;
  const items = (truncated ? rows.slice(0, MAX_ITEMS_PER_ISSUE) : rows).map(toItem);
  return { items, totalCount, truncated };
};

/**
 * Utilisateurs actifs avec un rôle qui devrait porter des permissions, mais qui n'en a aucune.
 */
const checkUserNoPermission: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('users as u')
    .leftJoin('user_permissions as up', 'up.user_id', 'u.id')
    .select(['u.id', 'u.email', 'u.first_name', 'u.last_name', 'u.role'])
    .where('u.active', '=', true)
    .where('u.role', 'in', ['gestionnaire', 'collectivite', 'alec', 'ccrt'])
    .groupBy(['u.id', 'u.email', 'u.first_name', 'u.last_name', 'u.role'])
    .having((eb) => eb.fn.count('up.id'), '=', 0)
    .orderBy('u.email')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: [row.role, fullName(row.first_name, row.last_name)].filter(Boolean).join(' — '),
    href: userHref(row.id, row.email),
    label: row.email,
  }));

  return {
    description:
      'Ces utilisateurs ont un rôle qui suppose une portée (gestionnaire, collectivité, ALEC, CCRT) mais aucune permission attribuée. Ils ne voient aucune demande.',
    items,
    severity: 'error',
    title: 'Compte actif sans aucune permission',
    totalCount,
    truncated,
    type: 'user.no_permission',
  };
};

/**
 * Gestionnaires avec une permission territoriale (devraient n'avoir que des permissions réseau).
 */
const checkGestionnaireWithTerritory: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('users as u')
    .innerJoin('user_permissions as up', 'up.user_id', 'u.id')
    .select(['u.id', 'u.email', 'u.first_name', 'u.last_name'])
    .where('u.role', '=', 'gestionnaire')
    .where('up.type', 'in', ['commune', 'epci', 'ept', 'departement', 'region', 'national'])
    .distinct()
    .orderBy('u.email')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: fullName(row.first_name, row.last_name) ?? undefined,
    href: userHref(row.id, row.email),
    label: row.email,
  }));

  return {
    description:
      'Un gestionnaire ne doit porter que des permissions sur des réseaux. Les permissions territoriales (commune, EPCI, EPT, département, région, national) sont réservées aux collectivités, ALEC et CCRT.',
    items,
    severity: 'error',
    title: 'Gestionnaire avec une permission territoriale',
    totalCount,
    truncated,
    type: 'user.gestionnaire_with_territory',
  };
};

/**
 * Rôles sans permissions (admin / particulier / professionnel) ayant tout de même une permission.
 */
const checkPermissionOnRoleWithoutPermissions: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('users as u')
    .innerJoin('user_permissions as up', 'up.user_id', 'u.id')
    .select(['u.id', 'u.email', 'u.role'])
    .where('u.role', 'in', ['admin', 'particulier', 'professionnel'])
    .distinct()
    .orderBy('u.role')
    .orderBy('u.email')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: row.role,
    href: userHref(row.id, row.email),
    label: row.email,
  }));

  return {
    description:
      'Les rôles admin, particulier et professionnel ne doivent jamais avoir de permissions attribuées. Ces lignes sont probablement des résidus à supprimer.',
    items,
    severity: 'error',
    title: 'Permission sur un rôle qui n’en porte pas',
    totalCount,
    truncated,
    type: 'user.role_without_permissions_has_permission',
  };
};

/**
 * Comptes ayant la même adresse mail (insensible à la casse).
 */
const checkDuplicateEmail: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('users')
    .select([
      sql<string>`lower(email)`.as('lower_email'),
      sql<string[]>`array_agg(id)`.as('ids'),
      sql<string[]>`array_agg(email)`.as('emails'),
    ])
    .groupBy(sql`lower(email)`)
    .having((eb) => eb.fn.count('id'), '>', 1)
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: `${row.ids.length} comptes : ${row.emails.join(', ')}`,
    href: userHref(row.ids[0], row.lower_email),
    label: row.lower_email,
  }));

  return {
    description:
      'Plusieurs comptes utilisent la même adresse mail (ignorant la casse). Cela génère des collisions à la connexion et lors des notifications.',
    items,
    severity: 'error',
    title: 'Adresses email en doublon',
    totalCount,
    truncated,
    type: 'user.duplicate_email',
  };
};

/**
 * Permissions dont la ressource cible n'existe plus (réseau supprimé, commune renommée, EPCI fusionné, etc.).
 */
const checkOrphanPermissions: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('user_permissions as up')
    .innerJoin('users as u', 'u.id', 'up.user_id')
    .select(['up.type', 'up.resource_id', 'u.id as user_id', 'u.email'])
    .where((eb) =>
      eb.or([
        eb.and([
          eb('up.type', '=', 'reseau_de_chaleur'),
          eb.not(
            eb.exists(eb.selectFrom('reseaux_de_chaleur').select('id_fcu').whereRef(sql<string>`id_fcu::text`, '=', 'up.resource_id'))
          ),
        ]),
        eb.and([
          eb('up.type', '=', 'reseau_en_construction'),
          eb.not(
            eb.exists(
              eb.selectFrom('zones_et_reseaux_en_construction').select('id_fcu').whereRef(sql<string>`id_fcu::text`, '=', 'up.resource_id')
            )
          ),
        ]),
        eb.and([
          eb('up.type', '=', 'commune'),
          eb.not(eb.exists(eb.selectFrom('ign_communes').select('insee_com').whereRef('insee_com', '=', 'up.resource_id'))),
        ]),
        eb.and([
          eb('up.type', '=', 'epci'),
          eb.not(eb.exists(eb.selectFrom('epci').select('code').whereRef('code', '=', 'up.resource_id'))),
        ]),
        eb.and([eb('up.type', '=', 'ept'), eb.not(eb.exists(eb.selectFrom('ept').select('code').whereRef('code', '=', 'up.resource_id')))]),
        eb.and([
          eb('up.type', '=', 'departement'),
          eb.not(eb.exists(eb.selectFrom('ign_departements').select('insee_dep').whereRef('insee_dep', '=', 'up.resource_id'))),
        ]),
        eb.and([
          eb('up.type', '=', 'region'),
          eb.not(eb.exists(eb.selectFrom('ign_regions').select('insee_reg').whereRef('insee_reg', '=', 'up.resource_id'))),
        ]),
      ])
    )
    .orderBy('u.email')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: row.email,
    href: userHref(row.user_id, row.email),
    label: `${row.type} #${row.resource_id ?? '∅'}`,
  }));

  return {
    description:
      'Le réseau, la commune, l’EPCI, l’EPT, le département ou la région ciblé(e) n’existe plus en base. La permission ne donne plus accès à rien et doit être supprimée ou réaffectée.',
    items,
    severity: 'error',
    title: 'Permission pointant vers une ressource supprimée',
    totalCount,
    truncated,
    type: 'permission.orphan_resource',
  };
};

/**
 * Comptes actifs sans connexion depuis plus d'un an (hors admin).
 */
const checkDormantAccounts: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('users')
    .select(['id', 'email', 'role', 'last_connection'])
    .where('active', '=', true)
    .where('role', '<>', 'admin')
    .where('last_connection', '<', sql<Date>`now() - interval '1 year'`)
    .orderBy('last_connection')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: `${row.role} — dernière connexion ${row.last_connection ? formatDate(row.last_connection) : 'jamais'}`,
    href: userHref(row.id, row.email),
    label: row.email,
  }));

  return {
    description:
      'Ces utilisateurs ne se sont pas connectés depuis plus d’un an mais leur compte est toujours actif. À auditer pour suppression ou désactivation.',
    items,
    severity: 'warning',
    title: 'Compte actif sans connexion depuis plus d’un an',
    totalCount,
    truncated,
    type: 'user.dormant',
  };
};

/**
 * Demandes sans coordonnées GPS (lat/lon manquantes dans legacy_values).
 */
const checkDemandMissingCoordinates: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('demands')
    .select([
      'id',
      'created_at',
      sql<string | null>`legacy_values->>'Adresse'`.as('adresse'),
      sql<string | null>`legacy_values->>'Latitude'`.as('latitude'),
      sql<string | null>`legacy_values->>'Longitude'`.as('longitude'),
    ])
    .where('deleted_at', 'is', null)
    .where((eb) =>
      eb.or([
        eb(sql<string | null>`legacy_values->>'Latitude'`, 'is', null),
        eb(sql<string | null>`legacy_values->>'Longitude'`, 'is', null),
      ])
    )
    .orderBy('created_at', 'desc')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: `créée le ${formatDate(row.created_at)}`,
    href: demandHref(row.adresse),
    label: row.adresse ?? '(adresse absente)',
  }));

  return {
    description:
      'La latitude ou la longitude est absente dans les valeurs Airtable. La demande ne peut pas être affichée sur la carte et ne sera pas géoréférencée correctement.',
    items,
    severity: 'warning',
    title: 'Demande sans coordonnées GPS',
    totalCount,
    truncated,
    type: 'demand.missing_coordinates',
  };
};

/**
 * Demandes avec network_id sans network_type, ou network_type sans network_id.
 */
const checkDemandNetworkMismatch: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('demands')
    .select(['id', 'network_id', 'network_type', sql<string | null>`legacy_values->>'Adresse'`.as('adresse')])
    .where('deleted_at', 'is', null)
    .where((eb) =>
      eb.or([
        eb.and([eb('network_id', 'is not', null), eb('network_type', 'is', null)]),
        eb.and([eb('network_id', 'is', null), eb('network_type', 'is not', null)]),
      ])
    )
    .orderBy('id')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: `network_id=${row.network_id ?? '∅'} / network_type=${row.network_type ?? '∅'}`,
    href: demandHref(row.adresse),
    label: row.adresse ?? '(adresse absente)',
  }));

  return {
    description:
      '`network_id` et `network_type` doivent être renseignés ensemble ou tous les deux vides. L’un sans l’autre indique une affectation cassée.',
    items,
    severity: 'error',
    title: 'Demande avec affectation réseau incohérente',
    totalCount,
    truncated,
    type: 'demand.network_id_type_mismatch',
  };
};

/**
 * Demandes dont le network_id pointe vers un réseau qui n'existe plus.
 */
const checkDemandOrphanNetwork: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('demands as d')
    .select(['d.id', 'd.network_id', 'd.network_type', sql<string | null>`d.legacy_values->>'Adresse'`.as('adresse')])
    .where('d.deleted_at', 'is', null)
    .where('d.network_id', 'is not', null)
    .where('d.network_type', 'is not', null)
    .where((eb) =>
      eb.or([
        eb.and([
          eb('d.network_type', '=', 'reseau_de_chaleur'),
          eb.not(eb.exists(eb.selectFrom('reseaux_de_chaleur').select('id_fcu').whereRef('id_fcu', '=', 'd.network_id'))),
        ]),
        eb.and([
          eb('d.network_type', '=', 'reseau_en_construction'),
          eb.not(eb.exists(eb.selectFrom('zones_et_reseaux_en_construction').select('id_fcu').whereRef('id_fcu', '=', 'd.network_id'))),
        ]),
      ])
    )
    .orderBy('d.id')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: `${row.network_type} #${row.network_id}`,
    href: demandHref(row.adresse),
    label: row.adresse ?? '(adresse absente)',
  }));

  return {
    description: 'Le réseau référencé n’existe plus en base. La demande n’a plus de gestionnaire effectif et doit être réaffectée.',
    items,
    severity: 'error',
    title: 'Demande affectée à un réseau supprimé',
    totalCount,
    truncated,
    type: 'demand.orphan_network',
  };
};

/**
 * PDP référençant un réseau absent de la base, via `reseau_de_chaleur_ids`, `reseau_en_construction_ids`
 * ou l'identifiant SNCU (`Identifiant reseau`). Casse la résolution PDP → réseau et donc l'affectation
 * des demandes situées dans ces PDP.
 */
const checkPdpOrphanNetwork: IssueBuilder = async () => {
  // Sous-requête typée calculant, par PDP, si chaque type de lien référence un réseau inexistant.
  // `arr <@ ARRAY(...)` = tous les ids du PDP existent ; on inverse pour détecter les liens cassés.
  const flagged = kdb
    .selectFrom('zone_de_developpement_prioritaire as p')
    .select((eb) => [
      'p.id_fcu',
      'p.reseau_de_chaleur_ids',
      'p.reseau_en_construction_ids',
      eb.ref('p.Identifiant reseau').as('sncu'),
      eb
        .not(eb('p.reseau_de_chaleur_ids', '<@', sql<number[]>`ARRAY(${eb.selectFrom('reseaux_de_chaleur').select('id_fcu')})::int[]`))
        .as('broken_rdc'),
      eb
        .not(
          eb(
            'p.reseau_en_construction_ids',
            '<@',
            sql<number[]>`ARRAY(${eb.selectFrom('zones_et_reseaux_en_construction').select('id_fcu')})::int[]`
          )
        )
        .as('broken_zrc'),
      eb
        .and([
          eb('p.Identifiant reseau', 'is not', null),
          eb('p.Identifiant reseau', '!=', ''),
          eb.not(
            eb.exists(
              eb.selectFrom('reseaux_de_chaleur as r').select('r.id_fcu').whereRef('r.Identifiant reseau', '=', 'p.Identifiant reseau')
            )
          ),
        ])
        .as('sncu_missing'),
    ])
    .as('pdp');

  const rows = await kdb
    .selectFrom(flagged)
    .selectAll()
    .where((eb) => eb.or([eb('pdp.broken_rdc', '=', true), eb('pdp.broken_zrc', '=', true), eb('pdp.sncu_missing', '=', true)]))
    .orderBy('pdp.id_fcu')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: [
      row.broken_rdc ? `réseaux de chaleur ${row.reseau_de_chaleur_ids.join(', ')}` : null,
      row.broken_zrc ? `réseaux en construction ${row.reseau_en_construction_ids.join(', ')}` : null,
      row.sncu_missing ? `SNCU ${row.sncu} introuvable` : null,
    ]
      .filter(Boolean)
      .join(' / '),
    label: `PDP #${row.id_fcu}${row.sncu ? ` (${row.sncu})` : ''}`,
  }));

  return {
    description:
      'Ces PDP référencent un réseau (de chaleur, en construction, ou via l’identifiant SNCU) absent de la base. La résolution PDP → réseau échoue, donc les demandes situées dans ces PDP ne sont pas affectées au bon réseau.',
    items,
    severity: 'error',
    title: 'PDP lié à un réseau inexistant',
    totalCount,
    truncated,
    type: 'pdp.orphan_network',
  };
};

/**
 * Demandes non validées depuis plus de 30 jours.
 */
const checkDemandUnvalidatedOld: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('demands')
    .select(['id', 'created_at', sql<string | null>`legacy_values->>'Adresse'`.as('adresse')])
    .where('deleted_at', 'is', null)
    .where('validated', '=', false)
    .where('created_at', '<', sql<Date>`now() - interval '30 days'`)
    .orderBy('created_at')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: `créée le ${formatDate(row.created_at)}`,
    href: demandHref(row.adresse),
    label: row.adresse ?? '(adresse absente)',
  }));

  return {
    description: 'Ces demandes sont en attente de validation depuis plus de 30 jours. À traiter ou à clôturer.',
    items,
    severity: 'warning',
    title: 'Demande non validée depuis plus de 30 jours',
    totalCount,
    truncated,
    type: 'demand.unvalidated_old',
  };
};

/**
 * Demandes avec une demande de réaffectation en attente depuis plus de 14 jours.
 */
const checkDemandPendingAssignmentStale: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('demands')
    .select([
      'id',
      sql<string | null>`legacy_values->>'Adresse'`.as('adresse'),
      sql<Date>`(pending_assignment_change->>'requested_at')::timestamptz`.as('requested_at'),
    ])
    .where('deleted_at', 'is', null)
    .where('pending_assignment_change', 'is not', null)
    .where(sql<Date>`(pending_assignment_change->>'requested_at')::timestamptz`, '<', sql<Date>`now() - interval '14 days'`)
    .orderBy(sql<Date>`(pending_assignment_change->>'requested_at')::timestamptz`)
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: `demande de réaffectation depuis le ${formatDate(row.requested_at)}`,
    href: demandHref(row.adresse),
    label: row.adresse ?? '(adresse absente)',
  }));

  return {
    description: 'Un changement d’affectation a été demandé il y a plus de 14 jours et n’a toujours pas été traité par un admin.',
    items,
    severity: 'warning',
    title: 'Demande de réaffectation en attente depuis plus de 14 jours',
    totalCount,
    truncated,
    type: 'demand.pending_assignment_stale',
  };
};

/**
 * Organisations sans aucun réseau rattaché (chaleur / froid / en construction).
 * Un token API rattaché donnerait alors accès à zéro demande.
 */
const checkOrganizationWithoutNetworks: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('organizations as o')
    .select((eb) => [
      'o.id',
      'o.name',
      eb
        .exists(
          eb
            .selectFrom('organization_api_credentials as c')
            .select('c.id')
            .whereRef('c.organization_id', '=', 'o.id')
            .where('c.revoked_at', 'is', null)
        )
        .as('has_active_credential'),
    ])
    .where((eb) =>
      eb.not(eb.exists(eb.selectFrom('reseaux_de_chaleur as r').select('r.id_fcu').whereRef('r.organization_id', '=', 'o.id')))
    )
    .where((eb) => eb.not(eb.exists(eb.selectFrom('reseaux_de_froid as r').select('r.id_fcu').whereRef('r.organization_id', '=', 'o.id'))))
    .where((eb) =>
      eb.not(
        eb.exists(eb.selectFrom('zones_et_reseaux_en_construction as z').select('z.id_fcu').whereRef('z.organization_id', '=', 'o.id'))
      )
    )
    .orderBy('o.name')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: row.has_active_credential ? 'token API actif — portée vide' : undefined,
    href: '/admin/organizations',
    label: row.name,
  }));

  return {
    description:
      'Ces organisations n’ont aucun réseau rattaché. Une éventuelle clé d’API donnerait accès à zéro demande. Rattacher des réseaux depuis l’écran d’administration de l’organisation, ou supprimer l’organisation.',
    items,
    severity: 'warning',
    title: 'Organisation sans réseau rattaché',
    totalCount,
    truncated,
    type: 'organization.without_networks',
  };
};

const NATIONAL_CANDIDATE_MIN_NETWORKS = 50;

/**
 * Comptes actifs portant beaucoup de permissions réseau énumérées et sans organisation : candidats à un
 * accès national (à migrer vers une portée d'organisation plutôt que N permissions par-utilisateur).
 */
const checkNationalCandidateUnmigrated: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('users as u')
    .innerJoin('user_permissions as up', 'up.user_id', 'u.id')
    .select((eb) => ['u.id', 'u.email', 'u.first_name', 'u.last_name', eb.fn.count('up.id').as('network_perms')])
    .where('u.active', '=', true)
    .where((eb) =>
      eb.not(
        eb.exists(
          eb.selectFrom('user_permissions as op').select('op.id').whereRef('op.user_id', '=', 'u.id').where('op.type', '=', 'organization')
        )
      )
    )
    .where('up.type', 'in', ['reseau_de_chaleur', 'reseau_en_construction'])
    .groupBy(['u.id', 'u.email', 'u.first_name', 'u.last_name'])
    .having((eb) => eb.fn.count('up.id'), '>=', NATIONAL_CANDIDATE_MIN_NETWORKS)
    .orderBy((eb) => eb.fn.count('up.id'), 'desc')
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: `${row.network_perms} permissions réseau — ${fullName(row.first_name, row.last_name) ?? 'sans nom'}`,
    href: userHref(row.id, row.email),
    label: row.email,
  }));

  return {
    description: `Ces comptes actifs portent au moins ${NATIONAL_CANDIDATE_MIN_NETWORKS} permissions réseau énumérées et ne sont rattachés à aucune organisation. Ce sont des candidats à un accès national : créer/rattacher une organisation et remplacer ces permissions par une portée d’organisation.`,
    items,
    severity: 'warning',
    title: 'Candidat à un accès national non rattaché à une organisation',
    totalCount,
    truncated,
    type: 'user.national_candidate_unmigrated',
  };
};

/**
 * Une même valeur de `Gestionnaire` rattachée à plusieurs organisations : incohérence de curation
 * (un opérateur ne doit correspondre qu'à une organisation).
 */
const checkGestionnaireSplitAcrossOrganizations: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('reseaux_de_chaleur as r')
    .innerJoin('organizations as o', 'o.id', 'r.organization_id')
    .select((eb) => [
      eb.ref('r.Gestionnaire').as('gestionnaire'),
      eb.fn.count('r.organization_id').distinct().as('org_count'),
      sql<string[]>`array_agg(distinct o.name)`.as('org_names'),
    ])
    .where('r.organization_id', 'is not', null)
    .where('r.Gestionnaire', 'is not', null)
    .groupBy('r.Gestionnaire')
    .having((eb) => eb.fn.count('r.organization_id').distinct(), '>', 1)
    .execute();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: `${row.org_count} organisations : ${row.org_names.join(', ')}`,
    href: '/admin/organizations',
    label: row.gestionnaire ?? '(gestionnaire vide)',
  }));

  return {
    description:
      'Une même valeur de « Gestionnaire » est rattachée à plusieurs organisations différentes. L’affectation réseau → organisation est incohérente : un opérateur ne devrait correspondre qu’à une seule organisation.',
    items,
    severity: 'warning',
    title: 'Gestionnaire rattaché à plusieurs organisations',
    totalCount,
    truncated,
    type: 'network.gestionnaire_split_across_organizations',
  };
};

/**
 * Réseaux (chaleur + construction) matchant un motif gestionnaire déclaré par une org mais non rattachés (à rattacher).
 */
const checkNetworkMatchingPatternUnattached: IssueBuilder = async () => {
  const rows = await findUnattachedNetworksMatchingPatterns();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: `devrait être rattaché à ${row.organization_name}${row.gestionnaire ? ` — ${row.gestionnaire}` : ''}`,
    href: '/admin/organizations',
    label: row.nom_reseau ?? `Réseau #${row.id_fcu}`,
  }));

  return {
    description:
      'Ces réseaux correspondent au motif gestionnaire déclaré par une organisation mais ne lui sont pas rattachés. Les rattacher via le bouton Rattacher du dialog Réseaux de cette organisation.',
    items,
    severity: 'warning',
    title: 'Réseau matchant un motif mais non rattaché',
    totalCount,
    truncated,
    type: 'organization.network_matching_pattern_unattached',
  };
};

/**
 * Réseaux rattachés à une org dont le `Gestionnaire` ne matche aucun de ses motifs déclarés (anomalie).
 */
const checkNetworkAttachedNotMatchingPattern: IssueBuilder = async () => {
  const rows = await findAttachedNetworksNotMatchingPatterns();

  if (rows.length === 0) return null;

  const { items, totalCount, truncated } = truncate(rows, (row) => ({
    context: `rattaché à ${row.organization_name} — gestionnaire : ${row.gestionnaire ?? '(vide)'}`,
    href: '/admin/organizations',
    label: row.nom_reseau ?? `Réseau #${row.id_fcu}`,
  }));

  return {
    description:
      'Ces réseaux sont rattachés à une organisation alors que leur gestionnaire ne correspond à aucun motif déclaré. Rattachement manuel à vérifier, ou motif à ajuster.',
    items,
    severity: 'warning',
    title: 'Réseau rattaché hors motif gestionnaire',
    totalCount,
    truncated,
    type: 'organization.network_attached_not_matching_pattern',
  };
};

const formatDate = (value: Date | string | null): string => {
  if (value === null) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString('fr-FR');
};

const checks: IssueBuilder[] = [
  checkUserNoPermission,
  checkGestionnaireWithTerritory,
  checkPermissionOnRoleWithoutPermissions,
  checkDuplicateEmail,
  checkOrphanPermissions,
  checkDormantAccounts,
  checkDemandMissingCoordinates,
  checkDemandNetworkMismatch,
  checkDemandOrphanNetwork,
  checkPdpOrphanNetwork,
  checkDemandUnvalidatedOld,
  checkDemandPendingAssignmentStale,
  checkOrganizationWithoutNetworks,
  checkNationalCandidateUnmigrated,
  checkGestionnaireSplitAcrossOrganizations,
  checkNetworkMatchingPatternUnattached,
  checkNetworkAttachedNotMatchingPattern,
];

const severityWeight = { error: 0, warning: 1 } as const;

export const runDataDiagnostic = async (): Promise<DataDiagnosticResult> => {
  const results = await Promise.all(checks.map((check) => check()));
  const issues = results
    .filter((issue): issue is Issue => issue !== null)
    .sort((a, b) => severityWeight[a.severity] - severityWeight[b.severity] || b.totalCount - a.totalCount);

  return {
    generatedAt: new Date().toISOString(),
    issues,
  };
};
