import { type Expression, type ExpressionBuilder, sql } from 'kysely';

import type { TerritoryRef } from '@/modules/custom-territories/constants';
import { findCustomTerritoriesWithOrphanRefs, findStaleCustomTerritories } from '@/modules/custom-territories/server/service';
import { permissionTypeLabels } from '@/modules/permissions/constants';
import { linkedGestionnairesSQL, linkedMaitresOuvrageSQL } from '@/modules/reseaux/server/linked-fields-sync';
import { type DB, kdb } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import {
  type DiagnosticCheckType,
  diagnosticChecks,
  MAX_ITEMS_PER_ISSUE,
  NATIONAL_CANDIDATE_MIN_NETWORKS,
  type RunDataDiagnosticInput,
} from '../constants';
import type { Issue, IssueItem, IssueSeverity } from '../types';

/** The items of a check; its title, description, severity and theme live in `diagnosticChecks`. `null` when nothing is wrong. */
type IssueBuilder = () => Promise<Pick<Issue, 'items' | 'totalCount' | 'truncated'> | null>;

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

// Page des événements filtrée sur la demande, période custom démarrant avant toute donnée = tout l'historique.
const demandEventsHref = (demandId: string) => `/admin/events?contextType=demand&contextId=${demandId}&preset=custom&dateFrom=2025-01-01`;

// `reseauId` selects the row and scrolls to it (AdminReseauxPage).
const pdpHref = (idFcu: number) => `/admin/reseaux?reseauxTab=perimetres-de-developpement-prioritaire&reseauId=${idFcu}`;
const pdpLabel = (idFcu: number, sncu: string | null) => `PDP #${idFcu}${sncu ? ` (${sncu})` : ''}`;
const networkLabel = (idFcu: number, nom: string | null, suffix: string | null) =>
  `${idFcu} ${nom ?? '(sans nom)'}${suffix ? ` (${suffix})` : ''}`;

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

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: [row.role, fullName(row.first_name, row.last_name)].filter(Boolean).join(' — '),
    href: userHref(row.id, row.email),
    label: row.email,
  }));
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
    .where('up.type', 'in', ['commune', 'epci', 'ept', 'departement', 'region'])
    .distinct()
    .orderBy('u.email')
    .execute();

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: fullName(row.first_name, row.last_name) ?? undefined,
    href: userHref(row.id, row.email),
    label: row.email,
  }));
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

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: row.role,
    href: userHref(row.id, row.email),
    label: row.email,
  }));
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

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: row.email,
    href: userHref(row.user_id, row.email),
    label: `${row.type} #${row.resource_id ?? '∅'}`,
  }));
};

/**
 * Territoires personnalisés dont les communes enregistrées ne correspondent plus à la recette : le référentiel
 * (communes IGN, EPT) a changé depuis leur dernier enregistrement et le recalcul CLI n'a pas été lancé.
 */
const checkCustomTerritoryStaleCommunes: IssueBuilder = async () => {
  const rows = await findStaleCustomTerritories();

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: `${row.added_count} commune(s) à ajouter, ${row.removed_count} à retirer`,
    href: '/admin/territoires',
    label: row.name,
  }));
};

/**
 * Territoires personnalisés dont la recette référence un territoire qui ne correspond plus à aucune commune du
 * référentiel (commune absorbée, EPCI ou EPT dissous). Le recalcul CLI ne corrige pas ce cas : la recette est à modifier.
 */
const checkCustomTerritoryOrphanRecipeRef: IssueBuilder = async () => {
  const rows = await findCustomTerritoriesWithOrphanRefs();

  if (rows.length === 0) {
    return null;
  }

  const describeRefs = (prefix: string, refs: TerritoryRef[]) =>
    refs.length > 0 ? `${prefix} : ${refs.map((ref) => `${permissionTypeLabels[ref.type]} ${ref.code}`).join(', ')}` : null;
  return truncate(rows, (row) => ({
    context: [describeRefs('inclus', row.include), describeRefs('exclu', row.exclude)].filter(Boolean).join(' ; '),
    href: '/admin/territoires',
    label: row.name,
  }));
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

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: `créée le ${formatDate(row.created_at)}`,
    href: demandHref(row.adresse),
    label: row.adresse ?? '(adresse absente)',
  }));
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

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: `${row.network_type} #${row.network_id}`,
    href: demandHref(row.adresse),
    label: row.adresse ?? '(adresse absente)',
  }));
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

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: [
      row.broken_rdc ? `réseaux de chaleur ${row.reseau_de_chaleur_ids.join(', ')}` : null,
      row.broken_zrc ? `réseaux en construction ${row.reseau_en_construction_ids.join(', ')}` : null,
      row.sncu_missing ? `SNCU ${row.sncu} introuvable` : null,
    ]
      .filter(Boolean)
      .join(' / '),
    href: pdpHref(row.id_fcu),
    label: pdpLabel(row.id_fcu, row.sncu),
  }));
};

/**
 * PDP dont le gestionnaire ou le MO est vide alors que plusieurs réseaux liés portent des valeurs
 * distinctes : la synchronisation automatique ne peut pas trancher, un admin doit choisir la valeur.
 */
const checkPdpAmbiguousOperator: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('zone_de_developpement_prioritaire as pdp')
    .select((eb) => [
      'pdp.id_fcu',
      eb.ref('pdp.Identifiant reseau').as('sncu'),
      'pdp.Gestionnaire',
      'pdp.MO',
      linkedGestionnairesSQL(eb).as('linked_gestionnaires'),
      linkedMaitresOuvrageSQL(eb).as('linked_maitres_ouvrage'),
    ])
    .where((eb) =>
      eb.or([eb('pdp.Gestionnaire', 'is', null), eb('pdp.Gestionnaire', '=', ''), eb('pdp.MO', 'is', null), eb('pdp.MO', '=', '')])
    )
    .orderBy('pdp.id_fcu')
    .execute();

  const ambiguousRows = rows.filter(
    (row) => (!row.Gestionnaire && row.linked_gestionnaires.length > 1) || (!row.MO && row.linked_maitres_ouvrage.length > 1)
  );

  if (ambiguousRows.length === 0) {
    return null;
  }

  return truncate(ambiguousRows, (row) => ({
    context: [
      !row.Gestionnaire && row.linked_gestionnaires.length > 1 ? `gestionnaires liés : ${row.linked_gestionnaires.join(' / ')}` : null,
      !row.MO && row.linked_maitres_ouvrage.length > 1 ? `MO liés : ${row.linked_maitres_ouvrage.join(' / ')}` : null,
    ]
      .filter(Boolean)
      .join(' — '),
    href: pdpHref(row.id_fcu),
    label: pdpLabel(row.id_fcu, row.sncu),
  }));
};

/**
 * `ST_Intersects(network, pdp)` evaluated trace part by trace part, stopping at the first part that touches the perimeter.
 * On whole geometries (a network is up to 18 000 parts, a perimeter up to 135 000 points) the GEOS of production (3.11)
 * needs up to several seconds per pair: 19 s for the linked pairs, about 1 s this way. A local database (GEOS 3.13) does
 * not show it, whole geometries are even faster there (0.3 s): measure on an old GEOS before going back.
 */
const networkCrossesPdp = (network: Expression<unknown>, pdp: Expression<unknown>) =>
  sql<boolean>`EXISTS (SELECT 1 FROM ST_Dump(${network}) AS part WHERE part.geom && ${pdp} AND ST_Intersects(part.geom, ${pdp}))`;

/** Regroupe des paires (PDP, réseau) par PDP pour produire un item par PDP. */
const groupNetworksByPdp = (
  rdcRows: { id_fcu: number; sncu: string | null; network: string }[],
  zrcRows: { id_fcu: number; sncu: string | null; network: string }[]
) => {
  const byPdp = new Map<number, { sncu: string | null; rdc: string[]; zrc: string[] }>();
  const entry = (row: { id_fcu: number; sncu: string | null }) => {
    let value = byPdp.get(row.id_fcu);
    if (!value) {
      value = { rdc: [], sncu: row.sncu, zrc: [] };
      byPdp.set(row.id_fcu, value);
    }
    return value;
  };
  for (const row of rdcRows) {
    entry(row).rdc.push(row.network);
  }
  for (const row of zrcRows) {
    entry(row).zrc.push(row.network);
  }

  return [...byPdp.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id_fcu, { sncu, rdc, zrc }]) => ({
      context: [
        rdc.length > 0 ? `réseaux de chaleur : ${rdc.join(', ')}` : null,
        zrc.length > 0 ? `en construction : ${zrc.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' / '),
      href: pdpHref(id_fcu),
      label: pdpLabel(id_fcu, sncu),
    }));
};

/**
 * Réseaux qui traversent le polygone d'un PDP sans lui être liés : réseaux de chaleur classés et ouverts
 * aux raccordements (vert foncé sur la carte), réseaux et zones en construction ouverts aux raccordements.
 * Le lien (`reseau_de_chaleur_ids`, `reseau_en_construction_ids` ou SNCU) est ce qui fait remonter le
 * réseau dans la résolution PDP → réseau ; un lien manquant est donc probablement un oubli d'affectation.
 */
const checkPdpMissingNetworkLink: IssueBuilder = async () => {
  const [rdcRows, zrcRows] = await Promise.all([
    kdb
      .selectFrom('zone_de_developpement_prioritaire as p')
      .innerJoin('reseaux_de_chaleur as r', (join) => join.on((eb) => sql<boolean>`${eb.ref('r.geom')} && ${eb.ref('p.geom')}`))
      .select((eb) => [
        'p.id_fcu',
        eb.ref('p.Identifiant reseau').as('sncu'),
        'r.id_fcu as network_id',
        'r.nom_reseau',
        eb.ref('r.Identifiant reseau').as('network_sncu'),
      ])
      .where('r.ouvert_aux_raccordements', '=', true)
      .where('r.reseaux classes', '=', true)
      .where((eb) => eb.not(eb('r.id_fcu', '=', sql<number>`ANY(${eb.ref('p.reseau_de_chaleur_ids')})`)))
      .where((eb) =>
        eb.or([
          eb('p.Identifiant reseau', 'is', null),
          eb('p.Identifiant reseau', '=', ''),
          eb('r.Identifiant reseau', 'is distinct from', eb.ref('p.Identifiant reseau')),
        ])
      )
      .where((eb) => networkCrossesPdp(eb.ref('r.geom'), eb.ref('p.geom')))
      .orderBy('p.id_fcu')
      .orderBy('r.id_fcu')
      .execute(),
    kdb
      .selectFrom('zone_de_developpement_prioritaire as p')
      // whole geometries here: zones are polygons, the part by part test is slower on them (0.85 s against 0.54 s)
      .innerJoin('zones_et_reseaux_en_construction as c', (join) =>
        join.on(
          (eb) => sql<boolean>`${eb.ref('c.geom')} && ${eb.ref('p.geom')} AND ST_Intersects(${eb.ref('c.geom')}, ${eb.ref('p.geom')})`
        )
      )
      .select((eb) => ['p.id_fcu', eb.ref('p.Identifiant reseau').as('sncu'), 'c.id_fcu as network_id', 'c.nom_reseau', 'c.is_zone'])
      .where('c.ouvert_aux_raccordements', '=', true)
      .where((eb) => eb.not(eb('c.id_fcu', '=', sql<number>`ANY(${eb.ref('p.reseau_en_construction_ids')})`)))
      .orderBy('p.id_fcu')
      .orderBy('c.id_fcu')
      .execute(),
  ]);

  if (rdcRows.length === 0 && zrcRows.length === 0) {
    return null;
  }

  const grouped = groupNetworksByPdp(
    rdcRows.map((row) => ({ ...row, network: networkLabel(row.network_id, row.nom_reseau, row.network_sncu) })),
    zrcRows.map((row) => ({ ...row, network: networkLabel(row.network_id, row.nom_reseau, row.is_zone ? 'zone' : null) }))
  );
  return truncate(grouped, (item) => item);
};

/**
 * Réseaux liés à un PDP (ids ou SNCU) dont le tracé ne touche pas le polygone du PDP : lien erroné,
 * périmètre mal placé ou tracé incomplet. Les réseaux sans tracé sont ignorés (rien à comparer).
 */
const checkPdpLinkWithoutIntersection: IssueBuilder = async () => {
  const rdcLinkedByIds = kdb
    .selectFrom('zone_de_developpement_prioritaire as p')
    .innerJoin('reseaux_de_chaleur as r', (join) =>
      join.on((eb) => eb('r.id_fcu', '=', sql<number>`ANY(${eb.ref('p.reseau_de_chaleur_ids')})`))
    )
    .select((eb) => [
      'p.id_fcu',
      eb.ref('p.Identifiant reseau').as('sncu'),
      'r.id_fcu as network_id',
      'r.nom_reseau',
      eb.ref('r.Identifiant reseau').as('network_sncu'),
    ])
    .where('p.geom', 'is not', null)
    .where('r.geom', 'is not', null)
    .where((eb) => eb.not(networkCrossesPdp(eb.ref('r.geom'), eb.ref('p.geom'))));

  const rdcLinkedBySncu = kdb
    .selectFrom('zone_de_developpement_prioritaire as p')
    .innerJoin('reseaux_de_chaleur as r', (join) => join.onRef('r.Identifiant reseau', '=', 'p.Identifiant reseau'))
    .select((eb) => [
      'p.id_fcu',
      eb.ref('p.Identifiant reseau').as('sncu'),
      'r.id_fcu as network_id',
      'r.nom_reseau',
      eb.ref('r.Identifiant reseau').as('network_sncu'),
    ])
    .where('p.Identifiant reseau', '!=', '')
    .where('p.geom', 'is not', null)
    .where('r.geom', 'is not', null)
    .where((eb) => eb.not(networkCrossesPdp(eb.ref('r.geom'), eb.ref('p.geom'))));

  const [rdcRows, zrcRows] = await Promise.all([
    rdcLinkedByIds.union(rdcLinkedBySncu).orderBy('id_fcu').orderBy('network_id').execute(),
    kdb
      .selectFrom('zone_de_developpement_prioritaire as p')
      .innerJoin('zones_et_reseaux_en_construction as c', (join) =>
        join.on((eb) => eb('c.id_fcu', '=', sql<number>`ANY(${eb.ref('p.reseau_en_construction_ids')})`))
      )
      .select((eb) => ['p.id_fcu', eb.ref('p.Identifiant reseau').as('sncu'), 'c.id_fcu as network_id', 'c.nom_reseau', 'c.is_zone'])
      .where('p.geom', 'is not', null)
      .where('c.geom', 'is not', null)
      .where((eb) => eb.not(networkCrossesPdp(eb.ref('c.geom'), eb.ref('p.geom'))))
      .orderBy('p.id_fcu')
      .orderBy('c.id_fcu')
      .execute(),
  ]);

  if (rdcRows.length === 0 && zrcRows.length === 0) {
    return null;
  }

  const grouped = groupNetworksByPdp(
    rdcRows.map((row) => ({ ...row, network: networkLabel(row.network_id, row.nom_reseau, row.network_sncu) })),
    zrcRows.map((row) => ({ ...row, network: networkLabel(row.network_id, row.nom_reseau, row.is_zone ? 'zone' : null) }))
  );
  return truncate(grouped, (item) => item);
};

/**
 * Statuts qui impliquent que le demandeur a été contacté par le gestionnaire.
 * Exclut « Non réalisable » et « Projet abandonné par le prospect », qui peuvent être posés sans contact.
 */
const CONTACT_IMPLYING_STATUSES = [
  DEMANDE_STATUS.RECONTACTED,
  DEMANDE_STATUS.COMMERCIAL_PROPOSAL,
  DEMANDE_STATUS.VOTED,
  DEMANDE_STATUS.WORK_IN_PROGRESS,
  DEMANDE_STATUS.DONE,
];

type DemandsEb = ExpressionBuilder<DB, 'demands'>;

// Date de la dernière réponse du demandeur à l'enquête de satisfaction (null si aucune réponse tracée par event).
const lastSatisfactionAt = (eb: DemandsEb) =>
  eb
    .selectFrom('events as e')
    .select((seb) => seb.fn.max('e.created_at').as('last_satisfaction_at'))
    .where('e.context_type', '=', 'demand')
    .where('e.context_id', '=', sql<string>`${eb.ref('demands.id')}::text`)
    .where('e.type', '=', 'demand_satisfaction_submitted');

// Date du dernier vrai changement de statut, tous canaux confondus (UI, système, API partenaire).
// Les events de la migration fusion_statuts sont exclus : ce sont des renommages de données,
// pas des actions gestionnaire — les dater fausserait la chronologie.
const lastStatusChangeAt = (eb: DemandsEb) =>
  eb
    .selectFrom('events as e')
    .select((seb) => seb.fn.max('e.created_at').as('last_status_change_at'))
    .where('e.context_type', '=', 'demand')
    .where('e.context_id', '=', sql<string>`${eb.ref('demands.id')}::text`)
    .where((seb) =>
      seb.or([
        seb.and([seb('e.type', '=', 'demand_updated'), sql<boolean>`${seb.ref('e.data')} ? 'Status'`]),
        seb.and([
          seb('e.type', '=', 'demand_updated_by_system'),
          sql<boolean>`${seb.ref('e.data')} -> 'changes' ? 'Status'`,
          sql<boolean>`${seb.ref('e.data')} ->> 'reason' IS DISTINCT FROM 'fusion_statuts'`,
        ]),
        seb.and([seb('e.type', '=', 'api_demand_updated'), sql<boolean>`${seb.ref('e.data')} ? 'statut'`]),
      ])
    );

/**
 * Demandes prises en charge par le gestionnaire (statut impliquant un contact) alors que le demandeur
 * a répondu « Non » à l'enquête de satisfaction APRÈS le dernier changement de statut.
 * La chronologie est reconstituée via les events : `demand_satisfaction_submitted` d'un côté,
 * events portant un changement de `Status` de l'autre.
 */
const checkDemandRecontactMismatch: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('demands')
    .select((eb) => [
      'demands.id',
      eb.ref('demands.legacy_values', '->>').key('Adresse').as('adresse'),
      eb.ref('demands.legacy_values', '->>').key('Status').as('status'),
      lastSatisfactionAt(eb).as('satisfaction_at'),
    ])
    .where('demands.deleted_at', 'is', null)
    .where((eb) => eb(eb.ref('demands.legacy_values', '->>').key('Recontacté par le gestionnaire'), '=', 'Non'))
    .where((eb) => eb(eb.ref('demands.legacy_values', '->>').key('Status'), 'in', CONTACT_IMPLYING_STATUSES))
    // '-infinity' si aucun event de changement de statut (statut posé avant le système d'events) :
    // une réponse « Non » datée est alors forcément postérieure.
    .where((eb) => eb(lastSatisfactionAt(eb), '>', eb.fn.coalesce(lastStatusChangeAt(eb), sql<Date>`'-infinity'::timestamptz`)))
    .orderBy((eb) => lastSatisfactionAt(eb), 'desc')
    .execute();

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: `statut « ${row.status} » — « Non » répondu le ${formatDate(row.satisfaction_at)}`,
    href: demandHref(row.adresse),
    label: row.adresse ?? '(adresse absente)',
    links: [{ href: demandEventsHref(row.id), label: 'Voir les événements' }],
  }));
};

/**
 * Variante legacy du check précédent : le demandeur a répondu « Non » mais AVANT la mise en place
 * des events (aucun event satisfaction daté), et aucun vrai changement de statut n'est tracé non plus.
 * Impossible de savoir si le « Non » précède ou suit la prise en charge : à trancher manuellement.
 * Population figée : toute nouvelle réponse crée un event, donc cette liste ne peut que décroître.
 */
const checkDemandRecontactMismatchLegacy: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('demands')
    .select((eb) => [
      'demands.id',
      'demands.created_at',
      eb.ref('demands.legacy_values', '->>').key('Adresse').as('adresse'),
      eb.ref('demands.legacy_values', '->>').key('Status').as('status'),
    ])
    .where('demands.deleted_at', 'is', null)
    .where((eb) => eb(eb.ref('demands.legacy_values', '->>').key('Recontacté par le gestionnaire'), '=', 'Non'))
    .where((eb) => eb(eb.ref('demands.legacy_values', '->>').key('Status'), 'in', CONTACT_IMPLYING_STATUSES))
    .where((eb) => eb(lastSatisfactionAt(eb), 'is', null))
    .where((eb) => eb(lastStatusChangeAt(eb), 'is', null))
    .orderBy('demands.created_at', 'desc')
    .execute();

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: `statut « ${row.status} » — créée le ${formatDate(row.created_at)}`,
    href: demandHref(row.adresse),
    label: row.adresse ?? '(adresse absente)',
    links: [{ href: demandEventsHref(row.id), label: 'Voir les événements' }],
  }));
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

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: row.has_active_credential ? 'token API actif — portée vide' : undefined,
    href: '/admin/organizations',
    label: row.name,
  }));
};

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

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: `${row.network_perms} permissions réseau — ${fullName(row.first_name, row.last_name) ?? 'sans nom'}`,
    href: userHref(row.id, row.email),
    label: row.email,
  }));
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

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    context: `${row.org_count} organisations : ${row.org_names.join(', ')}`,
    href: '/admin/organizations',
    label: row.gestionnaire ?? '(gestionnaire vide)',
  }));
};

const formatDate = (value: Date | string | null): string => {
  if (value === null) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString('fr-FR');
};

/** Corrections made by FCU on a network that still differ from the FEDENE survey: only present after the yearly import. */
const checkSurveyDiscrepancies: IssueBuilder = async () => {
  const rows = await kdb
    .selectFrom('network_change_requests')
    .select(['id', 'network_label'])
    .where('kind', '=', 'enquete')
    .where('status', '=', 'pending')
    .orderBy('network_label')
    .execute();

  if (rows.length === 0) {
    return null;
  }

  return truncate(rows, (row) => ({
    href: '/admin/enquete-fedene',
    label: row.network_label,
  }));
};

const builders: Record<DiagnosticCheckType, IssueBuilder> = {
  'custom_territory.orphan_recipe_ref': checkCustomTerritoryOrphanRecipeRef,
  'custom_territory.stale_communes': checkCustomTerritoryStaleCommunes,
  'demand.missing_coordinates': checkDemandMissingCoordinates,
  'demand.orphan_network': checkDemandOrphanNetwork,
  'demand.recontact_mismatch': checkDemandRecontactMismatch,
  'demand.recontact_mismatch_legacy': checkDemandRecontactMismatchLegacy,
  'network.gestionnaire_split_across_organizations': checkGestionnaireSplitAcrossOrganizations,
  'network.survey_discrepancy': checkSurveyDiscrepancies,
  'organization.without_networks': checkOrganizationWithoutNetworks,
  'pdp.ambiguous_operator': checkPdpAmbiguousOperator,
  'pdp.link_without_intersection': checkPdpLinkWithoutIntersection,
  'pdp.missing_network_link': checkPdpMissingNetworkLink,
  'pdp.orphan_network': checkPdpOrphanNetwork,
  'permission.orphan_resource': checkOrphanPermissions,
  'user.gestionnaire_with_territory': checkGestionnaireWithTerritory,
  'user.national_candidate_unmigrated': checkNationalCandidateUnmigrated,
  'user.no_permission': checkUserNoPermission,
  'user.role_without_permissions_has_permission': checkPermissionOnRoleWithoutPermissions,
};

const severityWeight = { error: 0, warning: 1 } as const satisfies Record<IssueSeverity, number>;

/**
 * Data anomalies, errors first then by number of items: the checks run at every display of the dashboard,
 * or the on-demand ones (too slow or too rarely useful for that).
 */
export const runDataDiagnostic = async ({ onDemand }: RunDataDiagnosticInput): Promise<Issue[]> => {
  const issues = await Promise.all(
    diagnosticChecks
      .filter((check) => check.onDemand === onDemand)
      .map(async (check) => {
        const rows = await builders[check.type]();
        return (
          rows && {
            description: check.description,
            severity: check.severity,
            theme: check.theme,
            title: check.title,
            type: check.type,
            ...rows,
          }
        );
      })
  );
  return issues
    .filter((issue) => issue !== null)
    .sort((first, second) => severityWeight[first.severity] - severityWeight[second.severity] || second.totalCount - first.totalCount);
};
