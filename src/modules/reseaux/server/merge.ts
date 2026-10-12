import { TRPCError } from '@trpc/server';
import { sql } from 'kysely';

import { createUserEvent } from '@/modules/events/server/service';
import { createBuildTilesJob } from '@/modules/tiles/server/service';
import { kdb } from '@/server/db/kysely';
import type { ApiContext } from '@/server/db/kysely/base-model';
import { logger } from '@/server/helpers/logger';

import {
  MAX_NETWORK_DOCUMENTS,
  type MergeableNetworkTable,
  type MergeNetworksInput,
  type NetworkEntityType,
  type NetworkMergePreviewInput,
  networkMergeFields,
} from '../constants';
import { type NetworkFieldDefinition, type NetworkFieldSource, networkFieldDefinitions } from '../field-sources';
import { applyNetworkGeometryDraft, updateReseauDeChaleur, updateReseauDeFroid, updateReseauEnConstruction } from './service';

const entityOf = {
  reseaux_de_chaleur: 'reseau_de_chaleur',
  reseaux_de_froid: 'reseau_de_froid',
  zones_et_reseaux_en_construction: 'reseau_en_construction',
} as const satisfies Record<MergeableNetworkTable, NetworkEntityType>;

const tilesNameOf = {
  reseaux_de_chaleur: 'reseaux-de-chaleur',
  reseaux_de_froid: 'reseaux-de-froid',
  zones_et_reseaux_en_construction: 'reseaux-en-construction',
} as const satisfies Record<MergeableNetworkTable, string>;

/** Values keyed by the SNCU in their source (surveys, arrêté, labels): they follow the SNCU kept by the merge. */
const sncuBoundSources: readonly NetworkFieldSource[] = ['fedene', 'sdes', 'arrete_dpe', 'ecoreseau'];
const sncuBoundColumns = (table: 'reseaux_de_chaleur' | 'reseaux_de_froid') =>
  (Object.entries(networkFieldDefinitions) as [string, NetworkFieldDefinition][])
    .filter(([, definition]) => sncuBoundSources.includes(definition.source) && (!definition.tables || definition.tables.includes(table)))
    .map(([column]) => column);

/** Everything that points to a network of an absorbed id, per absorbed network: shown to the admin before the merge. */
export type NetworkMergeImpacts = {
  /** emails of the accounts holding a permission on the network */
  permissions: string[];
  demands: number;
  change_requests: number;
  documents: number;
  reminders: number;
  extensions: number;
  pdps: number;
};

export type NetworkMergeCandidate = {
  id_fcu: number;
  identifiant_reseau: string | null;
  nom_reseau: string | null;
  has_geometry: boolean;
  is_zone: boolean | null;
  /** displayed value per merge field key (`null`: empty) */
  values: Record<string, string | null>;
  impacts: NetworkMergeImpacts;
};

type NetworkRecord = Record<string, unknown> & { id_fcu: number; organization_id: string | null; has_geometry: boolean };

const loadRecords = async (table: MergeableNetworkTable, ids: number[]): Promise<NetworkRecord[]> => {
  const rows = (await kdb
    .selectFrom(table)
    .selectAll()
    .select(sql<boolean>`geom is not null`.as('has_geometry'))
    .where('id_fcu', 'in', ids)
    .execute()) as NetworkRecord[];
  if (rows.length !== new Set(ids).size) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Réseau introuvable' });
  }
  return ids.map((id) => rows.find((row) => row.id_fcu === id) as NetworkRecord);
};

const yesNo = (value: unknown) => (value === null || value === undefined ? null : value ? 'Oui' : 'Non');
const text = (value: unknown) => (value === null || value === undefined || value === '' ? null : String(value));

/** Displayed value of each merge field of a record (organizations and parent networks resolved to their label). */
const displayValues = (
  table: MergeableNetworkTable,
  record: NetworkRecord,
  labels: { organizations: Map<string, string>; heatNetworks: Map<number, string> }
): Record<string, string | null> => {
  const organization = record.organization_id ? (labels.organizations.get(record.organization_id) ?? record.organization_id) : null;
  if (table === 'zones_et_reseaux_en_construction') {
    const parentId = record.reseau_de_chaleur_id as number | null;
    return {
      gestionnaire: text(record.gestionnaire),
      mise_en_service: text(record.mise_en_service),
      mo: text(record.MO),
      nom_reseau: text(record.nom_reseau),
      notes: text(record.notes),
      organization,
      ouvert_aux_raccordements: yesNo(record.ouvert_aux_raccordements),
      reseau_de_chaleur: parentId === null ? null : (labels.heatNetworks.get(parentId) ?? String(parentId)),
    };
  }
  return {
    gestionnaire: text(record.Gestionnaire),
    identifiant_reseau: text(record['Identifiant reseau']),
    informations_complementaires: text(record.informationsComplementaires),
    mo: text(record.MO),
    nom_reseau: text(record.nom_reseau),
    notes: text(record.notes),
    organization,
    ...(table === 'reseaux_de_chaleur' ? { ouvert_aux_raccordements: yesNo(record.ouvert_aux_raccordements) } : {}),
    reseaux_classes: yesNo(record['reseaux classes']),
    website_gestionnaire: text(record.website_gestionnaire),
  };
};

const loadLabels = async (table: MergeableNetworkTable, records: NetworkRecord[]) => {
  const organizationIds = records.map((record) => record.organization_id).filter((id): id is string => id !== null);
  const parentIds =
    table === 'zones_et_reseaux_en_construction'
      ? records.map((record) => record.reseau_de_chaleur_id as number | null).filter((id): id is number => id !== null)
      : [];
  const [organizations, heatNetworks] = await Promise.all([
    organizationIds.length === 0 ? [] : kdb.selectFrom('organizations').select(['id', 'name']).where('id', 'in', organizationIds).execute(),
    parentIds.length === 0
      ? []
      : kdb
          .selectFrom('reseaux_de_chaleur')
          .select(['id_fcu', 'nom_reseau', 'Identifiant reseau as identifiant_reseau'])
          .where('id_fcu', 'in', parentIds)
          .execute(),
  ]);
  return {
    heatNetworks: new Map(
      heatNetworks.map((network) => [
        network.id_fcu,
        [network.identifiant_reseau, network.nom_reseau ?? `Réseau #${network.id_fcu}`].filter(Boolean).join(' - '),
      ])
    ),
    organizations: new Map(organizations.map((organization) => [organization.id, organization.name])),
  };
};

/** Counts (and permission holders) of everything pointing to each network. */
const loadImpacts = async (table: MergeableNetworkTable, ids: number[]): Promise<Map<number, NetworkMergeImpacts>> => {
  const entity = entityOf[table];
  const textIds = ids.map(String);
  const countBy = async (query: Promise<{ network_id: number; count: string | number | bigint }[]>) =>
    new Map((await query).map((row) => [row.network_id, Number(row.count)]));
  const [permissions, demands, changeRequests, documents, reminders, extensions, pdps] = await Promise.all([
    entity === 'reseau_de_froid'
      ? []
      : kdb
          .selectFrom('user_permissions as permission')
          .innerJoin('users as user', 'user.id', 'permission.user_id')
          .select(['permission.resource_id', 'user.email'])
          .where('permission.type', '=', entity)
          .where('permission.resource_id', 'in', textIds)
          .orderBy('user.email')
          .execute(),
    entity === 'reseau_de_froid'
      ? new Map<number, number>()
      : countBy(
          kdb
            .selectFrom('demands')
            .select(['network_id', (eb) => eb.fn.countAll().as('count')])
            .where('network_type', '=', entity)
            .where('network_id', 'in', ids)
            .groupBy('network_id')
            .execute() as Promise<{ network_id: number; count: string | number | bigint }[]>
        ),
    countBy(
      kdb
        .selectFrom('network_change_requests')
        .select(['network_id', (eb) => eb.fn.countAll().as('count')])
        .where('network_type', '=', entity)
        .where('network_id', 'in', ids)
        .groupBy('network_id')
        .execute() as Promise<{ network_id: number; count: string | number | bigint }[]>
    ),
    countBy(
      kdb
        .selectFrom('network_files')
        .select(['network_id', (eb) => eb.fn.countAll().as('count')])
        .where('network_type', '=', entity)
        .where('network_id', 'in', ids)
        .groupBy('network_id')
        .execute()
    ),
    countBy(
      kdb
        .selectFrom('network_reminders')
        .select(['network_id', (eb) => eb.fn.countAll().as('count')])
        .where('network_type', '=', entity)
        .where('network_id', 'in', ids)
        .groupBy('network_id')
        .execute()
    ),
    table === 'reseaux_de_chaleur'
      ? countBy(
          kdb
            .selectFrom('zones_et_reseaux_en_construction')
            .select(['reseau_de_chaleur_id as network_id', (eb) => eb.fn.countAll().as('count')])
            .where('reseau_de_chaleur_id', 'in', ids)
            .groupBy('reseau_de_chaleur_id')
            .execute() as Promise<{ network_id: number; count: string | number | bigint }[]>
        )
      : new Map<number, number>(),
    table === 'reseaux_de_froid'
      ? new Map<number, number>()
      : countBy(
          sql<{ network_id: number; count: number }>`
            select linked as network_id, count(*) as count
            from zone_de_developpement_prioritaire, unnest(${sql.ref(table === 'reseaux_de_chaleur' ? 'reseau_de_chaleur_ids' : 'reseau_en_construction_ids')}) as linked
            where linked = any(${ids}::int[])
            group by linked`
            .execute(kdb)
            .then((result) => result.rows)
        ),
  ]);
  return new Map(
    ids.map((id) => [
      id,
      {
        change_requests: changeRequests.get(id) ?? 0,
        demands: demands.get(id) ?? 0,
        documents: documents.get(id) ?? 0,
        extensions: extensions.get(id) ?? 0,
        pdps: pdps.get(id) ?? 0,
        permissions: permissions.filter((row) => row.resource_id === String(id)).map((row) => row.email),
        reminders: reminders.get(id) ?? 0,
      },
    ])
  );
};

/** Problems that forbid the merge, in French for the admin. */
const mergeBlockers = (table: MergeableNetworkTable, candidates: NetworkMergeCandidate[]): string[] => {
  const blockers: string[] = [];
  const documents = candidates.reduce((total, candidate) => total + candidate.impacts.documents, 0);
  if (documents > MAX_NETWORK_DOCUMENTS) {
    blockers.push(`${documents} documents publiés au total, ${MAX_NETWORK_DOCUMENTS} maximum par réseau : retirez-en avant la fusion`);
  }
  if (table === 'zones_et_reseaux_en_construction' && new Set(candidates.map((candidate) => candidate.is_zone)).size > 1) {
    blockers.push('Une zone et un tracé en construction ne se fusionnent pas');
  }
  return blockers;
};

/**
 * The networks about to be merged, with the value each one carries for every merge field, what points to each one
 * (demands, permissions…) and what forbids the merge.
 */
export const getNetworkMergePreview = async (input: NetworkMergePreviewInput) => {
  const records = await loadRecords(input.table, input.ids);
  const [labels, impacts] = await Promise.all([loadLabels(input.table, records), loadImpacts(input.table, input.ids)]);
  const candidates: NetworkMergeCandidate[] = records.map((record) => ({
    has_geometry: record.has_geometry,
    id_fcu: record.id_fcu,
    identifiant_reseau: text(record['Identifiant reseau']),
    impacts: impacts.get(record.id_fcu) as NetworkMergeImpacts,
    is_zone: input.table === 'zones_et_reseaux_en_construction' ? (record.is_zone as boolean) : null,
    nom_reseau: text(record.nom_reseau),
    values: displayValues(input.table, record, labels),
  }));
  return { blockers: mergeBlockers(input.table, candidates), candidates, fields: networkMergeFields[input.table] };
};

/** Networks of a table matching a name, SNCU or id, to pick the ones to merge (admin). */
export const searchNetworksToMerge = async (table: MergeableNetworkTable, search: string) => {
  const pattern = `%${search}%`;
  return await kdb
    .selectFrom(table)
    .select(['id_fcu', 'nom_reseau', 'Identifiant reseau as identifiant_reseau'])
    .where((eb) =>
      eb.or([
        eb('nom_reseau', 'ilike', pattern),
        eb(sql`"Identifiant reseau"`, 'ilike', pattern),
        eb(sql<string>`"id_fcu"::TEXT`, 'like', pattern),
      ])
    )
    .orderBy('nom_reseau')
    .limit(10)
    .execute();
};

const chosenRecord = (input: MergeNetworksInput, records: NetworkRecord[], field: string) => {
  const id = input.choices[field] ?? input.keptId;
  const record = records.find((candidate) => candidate.id_fcu === id);
  if (!record) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `Le réseau choisi pour « ${field} » ne fait pas partie de la fusion` });
  }
  return record;
};

/**
 * Merges networks of one table into the kept one: the chosen values are written on it (the survey values follow the chosen
 * SNCU), everything pointing to an absorbed network is repointed (permissions deduplicated, demands with their SNCU, change
 * requests, documents, reminders, extensions, PDP links), the traces are united, the absorbed networks are deleted and the
 * tiles rebuilt. Irreversible: the admin sees the impacts first (`getNetworkMergePreview`).
 */
export const mergeNetworks = async (input: MergeNetworksInput, context: { userId: string }) => {
  const ids = [input.keptId, ...input.absorbedIds];
  if (new Set(ids).size !== ids.length) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Un réseau ne peut pas être fusionné avec lui-même' });
  }
  const unknownField = Object.keys(input.choices).find(
    (field) => !networkMergeFields[input.table].some((definition) => definition.key === field)
  );
  if (unknownField) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `Champ inconnu : ${unknownField}` });
  }
  const preview = await getNetworkMergePreview({ ids, table: input.table });
  if (preview.blockers.length > 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: preview.blockers.join(' ; ') });
  }
  const records = await loadRecords(input.table, ids);
  const kept = records[0];
  const entity = entityOf[input.table];
  const absorbed = preview.candidates.slice(1);
  const impacts: NetworkMergeImpacts = {
    change_requests: absorbed.reduce((total, candidate) => total + candidate.impacts.change_requests, 0),
    demands: absorbed.reduce((total, candidate) => total + candidate.impacts.demands, 0),
    documents: absorbed.reduce((total, candidate) => total + candidate.impacts.documents, 0),
    extensions: absorbed.reduce((total, candidate) => total + candidate.impacts.extensions, 0),
    pdps: absorbed.reduce((total, candidate) => total + candidate.impacts.pdps, 0),
    permissions: [...new Set(absorbed.flatMap((candidate) => candidate.impacts.permissions))],
    reminders: absorbed.reduce((total, candidate) => total + candidate.impacts.reminders, 0),
  };
  const choose = (field: string) => chosenRecord(input, records, field);
  const isHeatOrCold = input.table !== 'zones_et_reseaux_en_construction';
  // the SNCU written on the kept network, and the name the demands will carry
  const sncu = isHeatOrCold ? text(choose('identifiant_reseau')['Identifiant reseau']) : text(kept['Identifiant reseau']);
  const name = text(choose('nom_reseau').nom_reseau);

  await kdb.transaction().execute(async (trx) => {
    // union of the traces (localisation points left out), as a draft applied right after the transaction
    const usable = sql<boolean>`geom is not null and ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')`;
    const absorbedWithGeometry = await trx
      .selectFrom(input.table)
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('id_fcu', 'in', input.absorbedIds)
      .where(usable)
      .executeTakeFirstOrThrow();
    if (Number(absorbedWithGeometry.count) > 0) {
      await trx
        .updateTable(input.table)
        .set({
          geom_update: sql<string>`(select ST_Multi(ST_Union(geom)) from ${sql.table(input.table)} where id_fcu = any(${ids}::int[]) and ${usable})`,
        })
        .where('id_fcu', '=', kept.id_fcu)
        .execute();
    }

    // permissions: an account holding one on the kept network and on an absorbed one keeps a single permission
    if (entity !== 'reseau_de_froid') {
      const textIds = input.absorbedIds.map(String);
      await trx
        .deleteFrom('user_permissions')
        .where('type', '=', entity)
        .where('resource_id', 'in', textIds)
        .where(({ exists, selectFrom }) =>
          exists(
            selectFrom('user_permissions as kept_permission')
              .select(sql.lit(1).as('found'))
              .whereRef('kept_permission.user_id', '=', 'user_permissions.user_id')
              .where('kept_permission.type', '=', entity)
              .where('kept_permission.resource_id', '=', String(kept.id_fcu))
          )
        )
        .execute();
      await trx
        .updateTable('user_permissions')
        .set({ resource_id: String(kept.id_fcu) })
        .where('type', '=', entity)
        .where('resource_id', 'in', textIds)
        .execute();
      await trx
        .updateTable('demands')
        .set({
          legacy_values: sql`legacy_values || ${JSON.stringify({ 'Identifiant réseau': sncu, 'Nom réseau': name })}::jsonb`,
          network_id: kept.id_fcu,
          updated_at: new Date(),
        })
        .where('network_type', '=', entity)
        .where('network_id', 'in', input.absorbedIds)
        .execute();
    }
    for (const linkedTable of ['network_change_requests', 'network_files', 'network_reminders'] as const) {
      await trx
        .updateTable(linkedTable)
        .set({ network_id: kept.id_fcu })
        .where('network_type', '=', entity)
        .where('network_id', 'in', input.absorbedIds)
        .execute();
    }
    if (input.table === 'reseaux_de_chaleur') {
      await trx
        .updateTable('zones_et_reseaux_en_construction')
        .set({ reseau_de_chaleur_id: kept.id_fcu })
        .where('reseau_de_chaleur_id', 'in', input.absorbedIds)
        .execute();
    }
    if (input.table !== 'reseaux_de_froid') {
      const column = input.table === 'reseaux_de_chaleur' ? 'reseau_de_chaleur_ids' : 'reseau_en_construction_ids';
      await trx
        .updateTable('zone_de_developpement_prioritaire')
        .set({
          [column]: sql`(select array_agg(distinct case when linked = any(${input.absorbedIds}::int[]) then ${kept.id_fcu}::int else linked end) from unnest(${sql.ref(column)}) as linked)`,
        })
        .where(sql<boolean>`${sql.ref(column)} && ${input.absorbedIds}::int[]`)
        .execute();
    }
    await trx.deleteFrom(input.table).where('id_fcu', 'in', input.absorbedIds).execute();

    // after the deletion (the SNCU is unique): values keyed by the SNCU follow it, organization and notes are plain columns
    const sncuSource = isHeatOrCold ? choose('identifiant_reseau') : kept;
    const followingSncu =
      isHeatOrCold && sncuSource.id_fcu !== kept.id_fcu
        ? Object.fromEntries(
            sncuBoundColumns(input.table as 'reseaux_de_chaleur' | 'reseaux_de_froid').map((column) => [column, sncuSource[column]])
          )
        : {};
    await trx
      .updateTable(input.table)
      .set({
        ...followingSncu,
        ...(isHeatOrCold ? { 'Identifiant reseau': sncu } : {}),
        notes: choose('notes').notes as string | null,
        organization_id: choose('organization').organization_id,
      })
      .where('id_fcu', '=', kept.id_fcu)
      .execute();
  });

  // displayed values, through the regular update paths (FCU corrections against the survey values now on the kept network)
  if (input.table === 'zones_et_reseaux_en_construction') {
    await updateReseauEnConstruction(kept.id_fcu, {
      gestionnaire: text(choose('gestionnaire').gestionnaire),
      MO: text(choose('mo').MO),
      mise_en_service: text(choose('mise_en_service').mise_en_service),
      nom_reseau: name,
      ouvert_aux_raccordements: choose('ouvert_aux_raccordements').ouvert_aux_raccordements as boolean,
      reseau_de_chaleur_id: choose('reseau_de_chaleur').reseau_de_chaleur_id as number | null,
    });
  } else {
    const values = {
      Gestionnaire: text(choose('gestionnaire').Gestionnaire),
      informationsComplementaires: text(choose('informations_complementaires').informationsComplementaires),
      MO: text(choose('mo').MO),
      nom_reseau: name,
      'reseaux classes': choose('reseaux_classes')['reseaux classes'] as boolean | null,
      website_gestionnaire: text(choose('website_gestionnaire').website_gestionnaire),
    };
    await (input.table === 'reseaux_de_chaleur'
      ? updateReseauDeChaleur(kept.id_fcu, {
          ...values,
          ouvert_aux_raccordements: choose('ouvert_aux_raccordements').ouvert_aux_raccordements as boolean,
        })
      : updateReseauDeFroid(kept.id_fcu, values));
  }

  // the united trace goes live (tiles, eligibility); without a new trace the tiles still drop the absorbed networks
  const apiContext = { user: { id: context.userId } } as unknown as ApiContext;
  const applied = await applyNetworkGeometryDraft(input.table, kept.id_fcu, context.userId);
  if (applied.total === 0) {
    await createBuildTilesJob({ name: tilesNameOf[input.table] }, apiContext, { replace: true });
  }

  const keptLabel = { id: kept.id_fcu, identifiant_reseau: sncu, nom_reseau: name, type: input.table };
  await createUserEvent({
    author_id: context.userId,
    context_id: String(kept.id_fcu),
    context_type: entity,
    data: {
      ...keptLabel,
      absorbed: absorbed.map((candidate) => ({
        id: candidate.id_fcu,
        identifiant_reseau: candidate.identifiant_reseau,
        nom_reseau: candidate.nom_reseau,
      })),
      impacts: { ...impacts, permissions: impacts.permissions.length },
    },
    type: 'network_merged',
  });
  await Promise.all(
    absorbed.map((candidate) =>
      createUserEvent({
        author_id: context.userId,
        context_id: String(candidate.id_fcu),
        context_type: entity,
        data: {
          id: candidate.id_fcu,
          identifiant_reseau: candidate.identifiant_reseau,
          nom_reseau: candidate.nom_reseau,
          type: input.table,
        },
        type: 'network_deleted',
      })
    )
  );
  logger.info('networks merged', { absorbed: input.absorbedIds, impacts, kept: kept.id_fcu, table: input.table });
  return impacts;
};
