import { TRPCError } from '@trpc/server';
import { sql } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import type { Logger } from 'winston';

import { sendEmailTemplate } from '@/modules/email';
import { createEvent, createUserEvent } from '@/modules/events/server/service';
import { getFileTypeGroup } from '@/modules/files/constants';
import { getFileForDownload, getFilesMetadata, renameStoredFile } from '@/modules/files/server/service';
import { processGeometry } from '@/modules/geo/server/helpers';
import { documentChangeKey, documentRemovalChangeKey } from '@/modules/network-change-requests/document-change-keys';
import { storeRequestGeometry } from '@/modules/network-change-requests/server/jobs';
import { getUsersWithNetworkPermission } from '@/modules/permissions/server/service';
import { MAX_NETWORK_DOCUMENTS, type NetworkEntityType, networkEntityToTable } from '@/modules/reseaux/constants';
import {
  addNetworkDocuments,
  assertNetworkDocumentsPublishable,
  type DocumentedNetworkType,
  listNetworkDocuments,
  removeNetworkDocument,
} from '@/modules/reseaux/server/documents';
import {
  applyNetworkGeometryDraft,
  createNetwork,
  getNetworkLabel,
  updateGeomUpdate,
  updatePerimetreDeDeveloppementPrioritaire,
  updateReseauDeChaleur,
  updateReseauDeFroid,
  updateReseauEnConstruction,
} from '@/modules/reseaux/server/service';
import { serverConfig } from '@/server/config';
import { type JsonValue, kdb } from '@/server/db/kysely';

import {
  type AcceptNetworkChangeRequestInput,
  type CreateNetworkChangeRequestInput,
  type LinkNetworkChangeRequestInput,
  type NetworkChangeRequestFileRole,
  type NetworkChangeRequestGeometryRole,
  type NetworkChangeRequestKind,
  type NetworkChangeRequestPayloads,
  networkChangeRequestFileRules,
  networkChangeRequestGeometryRoles,
  networkChangeRequestKindLabels,
  networkChangeRequestPayloadSchemas,
  notifiedNetworkChangeRequestKinds,
  type ReplaceNetworkChangeRequestGeometryFileInput,
} from '../constants';

export type NetworkChangeRequestContext = { logger: Logger; userId: string | null };

/**
 * Records a change request submitted by a public form (or later by a logged-in gestionnaire) and sends the
 * acknowledgement to the submitter. Admins see the pending requests in the admin menu and dashboard.
 */
export const createNetworkChangeRequest = async (input: CreateNetworkChangeRequestInput, context: NetworkChangeRequestContext) => {
  if (serverConfig.email.notAllowed.includes(input.contact.email)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: serverConfig.email.notAllowedMessage });
  }
  if (input.network) {
    await assertNetworkExists(input.network);
  }
  await assertRequestFilesAreValid(input);
  if (input.kind === 'fiche') {
    await assertFicheDocumentsAreConsistent(input);
  }

  const request = await kdb.transaction().execute(async (trx) => {
    const created = await trx
      .insertInto('network_change_requests')
      .values({
        contact_email: input.contact.email,
        contact_first_name: input.contact.firstName,
        contact_function: input.contact.function || null,
        contact_last_name: input.contact.lastName,
        contact_structure: input.contact.structure || null,
        contact_type: input.contact.type,
        contact_type_other: input.contact.type === 'autre' ? (input.contact.typeOther ?? null) : null,
        kind: input.kind,
        network_id: input.network?.id ?? null,
        network_label: input.networkLabel,
        network_type: input.network?.type ?? null,
        payload: JSON.stringify(input.payload),
        user_id: context.userId,
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();
    if (input.files.length > 0) {
      await trx
        .insertInto('network_change_request_files')
        .values(input.files.map((file) => ({ file_id: file.id, request_id: created.id, role: file.role })))
        .execute();
    }
    if (input.files.some((file) => (networkChangeRequestGeometryRoles as readonly string[]).includes(file.role))) {
      await trx
        .insertInto('jobs')
        .values({ data: { requestId: created.id }, status: 'pending', type: 'parse_request_geometries' })
        .execute();
    }
    return created;
  });

  const kindLabel = networkChangeRequestKindLabels[input.kind];
  const eventData = {
    kind: input.kind,
    network_id: input.network?.id ?? null,
    network_label: input.networkLabel,
    network_type: input.network?.type ?? null,
    request_id: request.id,
  };
  const event = {
    context_id: request.id,
    context_type: 'network_change_request',
    data: eventData,
    type: 'network_change_request_created' as const,
  };
  await (context.userId ? createUserEvent({ ...event, author_id: context.userId }) : createEvent(event));
  try {
    await sendEmailTemplate(
      'reseaux.demandeur.accuse-reception',
      { email: input.contact.email },
      // an « autre » request has no network: the acknowledgement does not name one
      { kind: input.kind, kindLabel, networkLabel: input.kind === 'autre' ? null : input.networkLabel }
    );
  } catch (error) {
    // the request is stored: a failed acknowledgement must not make the submitter send it again
    context.logger.error('network change request acknowledgement email failed', { error, id: request.id });
  }
  context.logger.info('network change request created', { id: request.id, kind: input.kind });
  return { id: request.id };
};

/**
 * Suggestion created by a data import (FEDENE survey values differing from the base): one pending request per network
 * and edition, refreshed on every import and removed when the discrepancy disappears. No submitter, no email.
 */
export const upsertSurveyDiscrepancyRequest = async (
  network: { id: number; type: DocumentedNetworkType; label: string },
  payload: NetworkChangeRequestPayloads['enquete']
) => {
  const hasDiscrepancy = payload.gestionnaire !== undefined || payload.maitreOuvrage !== undefined || payload.nomReseau !== undefined;
  const requests = await kdb
    .selectFrom('network_change_requests')
    .select(['id', 'payload', 'status'])
    .where('kind', '=', 'enquete')
    .where('network_type', '=', network.type)
    .where('network_id', '=', network.id)
    .execute();
  const ofEdition = requests.filter((request) => (request.payload as NetworkChangeRequestPayloads['enquete']).edition === payload.edition);
  // an admin already processed the survey values of this edition (applied or closed): do not ask again on the next import run
  if (ofEdition.some((request) => request.status === 'processed')) {
    return 'handled';
  }
  const sameEdition = ofEdition.find((request) => request.status === 'pending');
  if (!hasDiscrepancy) {
    if (sameEdition) {
      await kdb.deleteFrom('network_change_requests').where('id', '=', sameEdition.id).execute();
    }
    return sameEdition ? 'resolved' : 'none';
  }
  if (sameEdition) {
    await kdb
      .updateTable('network_change_requests')
      .set({ network_label: network.label, payload: JSON.stringify(payload), updated_at: new Date() })
      .where('id', '=', sameEdition.id)
      .execute();
    return 'updated';
  }
  const created = await kdb
    .insertInto('network_change_requests')
    .values({
      contact_type: 'autre',
      contact_type_other: `Enquête FEDENE ${payload.edition}`,
      kind: 'enquete',
      network_id: network.id,
      network_label: network.label,
      network_type: network.type,
      origin: 'import',
      payload: JSON.stringify(payload),
    })
    .returning('id')
    .executeTakeFirstOrThrow();
  await createEvent({
    context_id: created.id,
    context_type: 'network_change_request',
    data: { kind: 'enquete', network_id: network.id, network_label: network.label, network_type: network.type, request_id: created.id },
    type: 'network_change_request_created',
  });
  return 'created';
};

/** Every request with its reviewer and the metadata of its files (never their content), newest first. */
export const listNetworkChangeRequests = async () =>
  await kdb
    .selectFrom('network_change_requests as request')
    .leftJoin('users as processor', 'processor.id', 'request.processed_by')
    .select((eb) => [
      'request.id',
      'request.kind',
      'request.status',
      'request.network_type',
      'request.network_id',
      'request.network_label',
      'request.origin',
      'request.user_id',
      'request.contact_type',
      'request.contact_type_other',
      'request.contact_first_name',
      'request.contact_last_name',
      'request.contact_email',
      'request.contact_structure',
      'request.contact_function',
      'request.payload',
      'request.processed_at',
      'request.notified',
      'request.created_at',
      'request.updated_at',
      'processor.email as processed_by_email',
      jsonArrayFrom(
        eb
          .selectFrom('network_change_request_geometries as geometry')
          .select(['geometry.role', 'geometry.error', 'geometry.parsed_at'])
          .whereRef('geometry.request_id', '=', 'request.id')
          .orderBy('geometry.role')
      ).as('geometries'),
      jsonArrayFrom(
        eb
          .selectFrom('network_change_request_files as request_file')
          .innerJoin('files as file', 'file.id', 'request_file.file_id')
          .select([
            'file.id',
            'file.filename',
            'file.content_type',
            'file.size',
            'file.scan_status',
            'file.purged_at',
            'request_file.role',
            'request_file.replaced_at',
          ])
          .whereRef('request_file.request_id', '=', 'request.id')
          .orderBy('file.filename')
      ).as('files'),
    ])
    .orderBy('request.created_at', 'desc')
    .execute();

export const countPendingNetworkChangeRequests = async () => {
  const row = await kdb
    .selectFrom('network_change_requests')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .where('status', '=', 'pending')
    .executeTakeFirstOrThrow();
  return Number(row.count);
};

const isDocumentedNetworkType = (networkType: string | null): networkType is DocumentedNetworkType =>
  networkType === 'reseau_de_chaleur' || networkType === 'reseau_de_froid';

/**
 * Current values of the network targeted by a request, so the admin can compare them with the proposal.
 * `null` when the request is not attached to a heat or cold network.
 */
export const getNetworkChangeRequestReviewContext = async (requestId: string) => {
  const request = await kdb
    .selectFrom('network_change_requests')
    .select(['network_type', 'network_id', 'payload'])
    .where('id', '=', requestId)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' }));
  const referentCommercial = await describeReferentCommercial(request);
  if (!isDocumentedNetworkType(request.network_type) || request.network_id === null) {
    return { network: null, referentCommercial };
  }
  const table = networkEntityToTable[request.network_type];
  const [network, documents] = await Promise.all([
    kdb
      .selectFrom(table)
      .select((eb) => [
        eb.ref(`${table}.id_fcu`).as('id_fcu'),
        eb.ref(`${table}.Identifiant reseau`).as('identifiant_reseau'),
        eb.ref(`${table}.nom_reseau`).as('nom_reseau'),
        eb.ref(`${table}.MO`).as('maitreOuvrage'),
        eb.ref(`${table}.Gestionnaire`).as('gestionnaire'),
        eb.ref(`${table}.informationsComplementaires`).as('informationsComplementaires'),
        eb.ref(`${table}.reseaux classes`).as('reseauClasse'),
      ])
      .where(`${table}.id_fcu`, '=', request.network_id)
      .executeTakeFirst(),
    listNetworkDocuments(request.network_type, request.network_id),
  ]);
  // cold networks have no eligibility flag
  const ouvertAuxRaccordements =
    request.network_type === 'reseau_de_chaleur'
      ? ((
          await kdb
            .selectFrom('reseaux_de_chaleur')
            .select('ouvert_aux_raccordements')
            .where('id_fcu', '=', request.network_id)
            .executeTakeFirst()
        )?.ouvert_aux_raccordements ?? null)
      : null;
  return { network: network ? { ...network, documents, ouvertAuxRaccordements, type: request.network_type } : null, referentCommercial };
};

/** Whether the commercial contact proposed by a trace request already has an FCU account, and rights on the network. */
const describeReferentCommercial = async (request: {
  network_type: NetworkEntityType | null;
  network_id: number | null;
  payload: unknown;
}) => {
  const email = (request.payload as { emailReferentCommercial?: string } | null)?.emailReferentCommercial?.trim().toLowerCase();
  if (!email) {
    return null;
  }
  const user = await kdb
    .selectFrom('users')
    .select(['id', 'email', 'role', 'active'])
    .where(sql`lower(email)`, '=', email)
    .executeTakeFirst();
  if (!user) {
    return { account: null, email };
  }
  const permissionType =
    request.network_type === 'reseau_de_chaleur' || request.network_type === 'reseau_en_construction' ? request.network_type : null;
  const hasNetworkPermission =
    permissionType && request.network_id !== null
      ? (await getUsersWithNetworkPermission(permissionType, String(request.network_id))).some((holder) => holder.id === user.id)
      : false;
  return { account: { active: user.active, hasNetworkPermission, id: user.id, role: user.role }, email };
};

/** Renames a file of a pending request: the name it will carry once published on the network page. */
export const renameNetworkChangeRequestFile = async ({ fileId, filename, id }: { fileId: string; filename: string; id: string }) => {
  const attached = await kdb
    .selectFrom('network_change_request_files')
    .innerJoin('network_change_requests', 'network_change_requests.id', 'network_change_request_files.request_id')
    .select('network_change_requests.status')
    .where('network_change_request_files.request_id', '=', id)
    .where('network_change_request_files.file_id', '=', fileId)
    .executeTakeFirst();
  if (!attached) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Fichier introuvable sur cette demande' });
  }
  if (attached.status !== 'pending') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette demande a déjà été traitée' });
  }
  return { filename: await renameStoredFile(fileId, filename) };
};

/**
 * An admin replaces the files of a role by a GeoJSON converted by hand (a trace uploaded as PDF, an unreadable file): the
 * previous files stay for reference, the geometry is read from the GeoJSON right away (no conversion job).
 */
export const replaceNetworkChangeRequestGeometryFile = async ({ fileId, id, role }: ReplaceNetworkChangeRequestGeometryFileInput) => {
  const request = await kdb
    .selectFrom('network_change_requests')
    .select('status')
    .where('id', '=', id)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' }));
  if (request.status !== 'pending') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette demande a déjà été traitée' });
  }
  const [file] = await getFilesMetadata([fileId]);
  if (!file || file.request_id !== null || file.purged_at !== null || file.scan_status === 'infected' || file.scan_status === 'pending') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Fichier introuvable ou inutilisable, déposez-le à nouveau' });
  }
  if (file.content_type !== 'application/geo+json' && file.content_type !== 'application/json') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Le fichier de remplacement doit être un GeoJSON' });
  }
  const stored = await getFileForDownload(fileId);
  if (!stored?.content) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Fichier introuvable ou inutilisable, déposez-le à nouveau' });
  }
  let geometry: GeoJSON.Geometry;
  try {
    const parsed = JSON.parse(stored.content.toString('utf8')) as GeoJSON.GeoJSON;
    // a single Feature is read as a collection of one: processGeometry takes collections and bare geometries
    geometry = (await processGeometry(parsed.type === 'Feature' ? { features: [parsed], type: 'FeatureCollection' } : parsed)).geom;
  } catch (error) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `GeoJSON illisible : ${error instanceof Error ? error.message : String(error)}` });
  }
  await kdb.transaction().execute(async (trx) => {
    await trx
      .updateTable('network_change_request_files')
      .set({ replaced_at: new Date() })
      .where('request_id', '=', id)
      .where('role', '=', role)
      .where('replaced_at', 'is', null)
      .execute();
    await trx.insertInto('network_change_request_files').values({ file_id: fileId, request_id: id, role }).execute();
  });
  await storeRequestGeometry(id, role, { geometry });
};

/** Replays the conversion of the geo files of a pending request (after a GDAL failure, a scan that was still pending…). */
export const retryNetworkChangeRequestGeometryConversion = async (id: string) => {
  const request = await kdb
    .selectFrom('network_change_requests')
    .select('status')
    .where('id', '=', id)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' }));
  if (request.status !== 'pending') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette demande a déjà été traitée' });
  }
  const geoFile = await kdb
    .selectFrom('network_change_request_files')
    .select('file_id')
    .where('request_id', '=', id)
    .where('role', 'in', [...networkChangeRequestGeometryRoles])
    .where('replaced_at', 'is', null)
    .executeTakeFirst();
  if (!geoFile) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aucun fichier à convertir' });
  }
  await kdb.transaction().execute(async (trx) => {
    // the failed conversions are shown as « en cours » until the job stores its result
    await trx.deleteFrom('network_change_request_geometries').where('request_id', '=', id).where('error', 'is not', null).execute();
    await trx
      .insertInto('jobs')
      .values({ data: { requestId: id }, status: 'pending', type: 'parse_request_geometries' })
      .execute();
  });
};

export const getNetworkChangeRequestGeometry = async (requestId: string, role: NetworkChangeRequestGeometryRole) => {
  const row = await kdb
    .selectFrom('network_change_request_geometries')
    .select(['geometry'])
    .where('request_id', '=', requestId)
    .where('role', '=', role)
    .executeTakeFirst();
  return row?.geometry ?? null;
};

/** Attaches a pending request to a network of the base (or detaches it): required to accept a request of any kind but « autre ». */
export const linkNetworkChangeRequest = async (input: LinkNetworkChangeRequestInput) => {
  const request = await kdb
    .selectFrom('network_change_requests')
    .select(['id', 'status'])
    .where('id', '=', input.id)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' }));
  if (request.status !== 'pending') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette demande a déjà été traitée' });
  }
  if (input.network) {
    await assertNetworkExists(input.network);
  }
  await kdb
    .updateTable('network_change_requests')
    .set({ network_id: input.network?.id ?? null, network_type: input.network?.type ?? null, updated_at: new Date() })
    .where('id', '=', request.id)
    .execute();
};

type AcceptableRequest = {
  id: string;
  kind: NetworkChangeRequestKind;
  network_id: number | null;
  network_label: string;
  network_type: NetworkEntityType | null;
  payload: unknown;
};

type AppliedResult = {
  /** network the request ends up attached to (created by the processing for a new construction network or a perimeter) */
  network: { id: number; type: NetworkEntityType } | null;
  /** what was written, recorded in the `network_updated` event (empty: the request is closed without publishing anything) */
  changes: Record<string, JsonValue>;
  /** entities created by the processing (construction network, perimeter): a `network_created` event each */
  created?: { id: number; type: NetworkEntityType }[];
};

/**
 * Marks a pending request as processed in one conditional update: a concurrent decision (two admins, a double click)
 * gets `BAD_REQUEST` instead of applying the request twice.
 */
const claimPendingRequest = async (requestId: string, userId: string) => {
  const claimed = await kdb
    .updateTable('network_change_requests')
    .set({ processed_at: new Date(), processed_by: userId, status: 'processed', updated_at: new Date() })
    .where('id', '=', requestId)
    .where('status', '=', 'pending')
    .executeTakeFirst();
  if (Number(claimed.numUpdatedRows) === 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette demande a déjà été traitée' });
  }
};

/** Puts a claimed request back to pending when applying it failed (the network is untouched or partially updated: the error is surfaced). */
const releaseClaimedRequest = async (requestId: string) => {
  await kdb
    .updateTable('network_change_requests')
    .set({ processed_at: null, processed_by: null, status: 'pending', updated_at: new Date() })
    .where('id', '=', requestId)
    .execute();
};

/**
 * Processes a pending request: the included changes are applied to the base, per kind:
 * - `fiche`: the proposed values are written on the network (same fields as the admin edit dialog), documents published / taken down;
 * - `enquete`: the survey values replace the FCU corrections;
 * - `trace_existant`: the converted trace goes live on the network (tiles rebuilt), metadata updated, optional perimeter created;
 * - `trace_construction`: a construction network is created (or the linked one updated) with the trace, optional perimeter created;
 * - `pdp`: a priority development perimeter is created, linked to the network when known;
 * - `autre`: nothing to apply.
 * Every input (geometries, documents) is resolved and validated before the first write. A request whose geo files are PDF only is
 * closed without creating anything (the admin draws it by hand). The submitter is emailed when something was published.
 */
export const acceptNetworkChangeRequest = async (
  input: AcceptNetworkChangeRequestInput,
  context: NetworkChangeRequestContext & { userId: string }
) => {
  const request = await kdb
    .selectFrom('network_change_requests')
    .select(['id', 'kind', 'status', 'network_label', 'network_type', 'network_id', 'contact_email', 'payload', 'origin'])
    .where('id', '=', input.id)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' }));
  await claimPendingRequest(request.id, context.userId);
  const isIncluded = (key: string) => !input.included || input.included.includes(key);
  let applied: AppliedResult;
  try {
    applied = await applyRequest(request, isIncluded, context);
  } catch (error) {
    await releaseClaimedRequest(request.id);
    throw error;
  }
  if (applied.network) {
    await kdb
      .updateTable('network_change_requests')
      .set({ network_id: applied.network.id, network_type: applied.network.type })
      .where('id', '=', request.id)
      .execute();
  }

  const network =
    applied.network ??
    (request.network_type && request.network_id !== null ? { id: request.network_id, type: request.network_type } : null);
  const networkLabel = network ? await getNetworkLabel(network.id, networkEntityToTable[network.type]) : null;
  const created = applied.created ?? [];
  const isCreated = (entity: { id: number; type: NetworkEntityType }) =>
    created.some((item) => item.id === entity.id && item.type === entity.type);
  const createdLabels = await Promise.all(created.map((entity) => getNetworkLabel(entity.id, networkEntityToTable[entity.type])));
  await Promise.all([
    createUserEvent({
      author_id: context.userId,
      context_id: request.id,
      context_type: 'network_change_request',
      data: {
        applied: Object.keys(applied.changes).length > 0,
        kind: request.kind,
        network_id: network?.id ?? null,
        // the network as it is in the base (linked or created by the processing), the submitter's label otherwise
        network_label: [networkLabel?.identifiant_reseau, networkLabel?.nom_reseau].filter(Boolean).join(' - ') || request.network_label,
        network_type: network?.type ?? null,
        request_id: request.id,
      },
      type: 'network_change_request_processed',
    }),
    ...created.map((entity, index) =>
      createUserEvent({
        author_id: context.userId,
        context_id: String(entity.id),
        context_type: entity.type,
        data: {
          id: String(entity.id),
          identifiant_reseau: createdLabels[index].identifiant_reseau,
          nom_reseau: createdLabels[index].nom_reseau,
          request_id: request.id,
          request_kind: request.kind,
          type: networkEntityToTable[entity.type],
        },
        type: 'network_created',
      })
    ),
    // an existing network whose data changed (a created one has its `network_created` event)
    ...(network && !isCreated(network) && Object.keys(applied.changes).length > 0
      ? [
          createUserEvent({
            author_id: context.userId,
            context_id: String(network.id),
            context_type: network.type,
            data: {
              changes: applied.changes,
              id: network.id,
              identifiant_reseau: networkLabel?.identifiant_reseau ?? null,
              nom_reseau: networkLabel?.nom_reseau ?? null,
              request_id: request.id,
              request_kind: request.kind,
              source: 'network_change_request',
              type: networkEntityToTable[network.type],
            },
            type: 'network_updated',
          }),
        ]
      : []),
  ]);
  // the submitter is told about the publication right away, when something was published on the fiche or the map
  const published = Object.keys(applied.changes).length > 0;
  const notify =
    published && request.origin === 'form' && !!request.contact_email && notifiedNetworkChangeRequestKinds.includes(request.kind);
  if (notify) {
    await sendEmailTemplate(
      'reseaux.demandeur.demande-acceptee',
      { email: request.contact_email as string },
      {
        kind: request.kind,
        networkPageUrl:
          isDocumentedNetworkType(network?.type ?? null) && networkLabel?.identifiant_reseau
            ? `/reseaux/${networkLabel.identifiant_reseau}`
            : null,
      }
    );
    await kdb.updateTable('network_change_requests').set({ notified: true }).where('id', '=', request.id).execute();
  }
  context.logger.info('network change request processed', { id: request.id, kind: request.kind, notified: notify, published });
};

type IsIncluded = (key: string) => boolean;

/** Keeps only the entries whose key the admin included (`undefined` values are dropped too). */
const pickIncluded = <T extends Record<string, unknown>>(values: T, isIncluded: IsIncluded): Partial<T> =>
  Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== undefined && isIncluded(key))) as Partial<T>;

/** Payload keys (camelCase, as in the forms) → network columns. */
const toNetworkColumns = (changes: Partial<Record<string, string | boolean | null>>) => ({
  ...('gestionnaire' in changes ? { Gestionnaire: changes.gestionnaire as string | null } : {}),
  ...('informationsComplementaires' in changes
    ? { informationsComplementaires: changes.informationsComplementaires as string | null }
    : {}),
  ...('maitreOuvrage' in changes ? { MO: changes.maitreOuvrage as string | null } : {}),
  ...('nomReseau' in changes ? { nom_reseau: changes.nomReseau as string } : {}),
  ...('ouvertAuxRaccordements' in changes ? { ouvert_aux_raccordements: changes.ouvertAuxRaccordements as boolean } : {}),
  ...('reseauClasse' in changes ? { 'reseaux classes': changes.reseauClasse as boolean } : {}),
});

const applyRequest = async (request: AcceptableRequest, isIncluded: IsIncluded, context: { userId: string }): Promise<AppliedResult> => {
  switch (request.kind) {
    case 'fiche':
      return await applyFicheRequest(request, networkChangeRequestPayloadSchemas.fiche.parse(request.payload), isIncluded, context);
    case 'trace_existant':
      return await applyTraceExistantRequest(
        request,
        networkChangeRequestPayloadSchemas.trace_existant.parse(request.payload),
        isIncluded,
        context
      );
    case 'trace_construction':
      return await applyTraceConstructionRequest(
        request,
        networkChangeRequestPayloadSchemas.trace_construction.parse(request.payload),
        isIncluded,
        context
      );
    case 'pdp':
      return await applyPdpRequest(request, context);
    case 'enquete':
      return await applySurveyRequest(request, networkChangeRequestPayloadSchemas.enquete.parse(request.payload), isIncluded);
    case 'autre':
      return { changes: {}, network: null };
  }
};

const applySurveyRequest = async (
  request: AcceptableRequest,
  payload: NetworkChangeRequestPayloads['enquete'],
  isIncluded: IsIncluded
): Promise<AppliedResult> => {
  if (!isDocumentedNetworkType(request.network_type) || request.network_id === null) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: "Cette demande n'est rattachée à aucun réseau de chaleur ou de froid" });
  }
  const columns = toNetworkColumns(
    pickIncluded({ gestionnaire: payload.gestionnaire, maitreOuvrage: payload.maitreOuvrage, nomReseau: payload.nomReseau }, isIncluded)
  );
  await (request.network_type === 'reseau_de_chaleur'
    ? updateReseauDeChaleur(request.network_id, columns)
    : updateReseauDeFroid(request.network_id, columns));
  return { changes: columns, network: null };
};

const applyFicheRequest = async (
  request: AcceptableRequest,
  payload: NetworkChangeRequestPayloads['fiche'],
  isIncluded: IsIncluded,
  _context: { userId: string }
): Promise<AppliedResult> => {
  if (!isDocumentedNetworkType(request.network_type) || request.network_id === null) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: "Cette demande n'est rattachée à aucun réseau de chaleur ou de froid" });
  }
  const published = (await listNetworkDocuments(request.network_type, request.network_id)).map((document) => document.id);
  const removed = (payload.documentsToRemove ?? []).filter(
    (fileId) => published.includes(fileId) && isIncluded(documentRemovalChangeKey(fileId))
  );
  const added = (await listRequestFileIds(request.id, 'document')).filter((fileId) => isIncluded(documentChangeKey(fileId)));
  // a removal drops the content of the document: nothing destructive before the additions are known to be valid
  await assertNetworkDocumentsPublishable(added);
  if (published.length - removed.length + added.filter((fileId) => !published.includes(fileId)).length > MAX_NETWORK_DOCUMENTS) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `Un réseau ne peut pas avoir plus de ${MAX_NETWORK_DOCUMENTS} documents` });
  }
  for (const fileId of removed) {
    await removeNetworkDocument(request.network_type, request.network_id, fileId);
  }
  await addNetworkDocuments(request.network_type, request.network_id, added);
  const columns = toNetworkColumns(pickIncluded({ informationsComplementaires: payload.informationsComplementaires || null }, isIncluded));
  await (request.network_type === 'reseau_de_chaleur'
    ? updateReseauDeChaleur(request.network_id, columns)
    : updateReseauDeFroid(request.network_id, columns));
  return {
    changes: {
      ...columns,
      ...(added.length > 0 ? { documents_added: added } : {}),
      ...(removed.length > 0 ? { documents_removed: removed } : {}),
    },
    network: null,
  };
};

const applyTraceExistantRequest = async (
  request: AcceptableRequest,
  payload: NetworkChangeRequestPayloads['trace_existant'],
  isIncluded: IsIncluded,
  context: { userId: string }
): Promise<AppliedResult> => {
  if (!isDocumentedNetworkType(request.network_type) || request.network_id === null) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: "Rattachez d'abord la demande au réseau de chaleur ou de froid concerné" });
  }
  const table = networkEntityToTable[request.network_type];
  // every geometry is resolved (converted, or rejected) before the first write
  const trace = isIncluded('trace') ? await getRequestGeometry(request.id, 'trace') : null;
  const perimeter = isIncluded('pdp') ? await getRequestGeometry(request.id, 'pdp') : null;
  if (trace) {
    await updateGeomUpdate(request.network_id, trace, table);
    await applyNetworkGeometryDraft(table, request.network_id, context.userId);
  }
  const columns = toNetworkColumns(
    pickIncluded(
      {
        gestionnaire: payload.gestionnaire,
        maitreOuvrage: payload.maitreOuvrage,
        ...(request.network_type === 'reseau_de_chaleur' ? { ouvertAuxRaccordements: payload.ouvertAuxRaccordements } : {}),
        ...(payload.reseauClasse === null ? {} : { reseauClasse: payload.reseauClasse }),
      },
      isIncluded
    )
  );
  await (request.network_type === 'reseau_de_chaleur'
    ? updateReseauDeChaleur(request.network_id, columns)
    : updateReseauDeFroid(request.network_id, columns));
  const pdpId = await createLinkedPdp(
    perimeter,
    request.network_type === 'reseau_de_chaleur' ? { reseau_de_chaleur_ids: [request.network_id] } : {},
    context.userId
  );
  return {
    changes: { ...columns, ...(trace ? { geometry_applied: true } : {}), ...(pdpId ? { pdp_created: pdpId } : {}) },
    created: pdpId ? [{ id: pdpId, type: 'perimetre_de_developpement_prioritaire' }] : [],
    network: null,
  };
};

const applyTraceConstructionRequest = async (
  request: AcceptableRequest,
  payload: NetworkChangeRequestPayloads['trace_construction'],
  isIncluded: IsIncluded,
  context: { userId: string }
): Promise<AppliedResult> => {
  const trace = await getRequestGeometry(request.id, 'trace');
  const perimeter = isIncluded('pdp') ? await getRequestGeometry(request.id, 'pdp') : null;
  if (!trace) {
    // PDF only: the network is drawn by hand on the admin map, nothing is created nor published here
    return { changes: {}, network: null };
  }
  const picked = pickIncluded(
    {
      dateMiseEnServicePrevisionnelle: payload.dateMiseEnServicePrevisionnelle,
      gestionnaire: payload.gestionnaire,
      maitreOuvrage: payload.maitreOuvrage,
      ouvertAuxRaccordements: payload.ouvertAuxRaccordements,
    },
    isIncluded
  );
  const metadata = {
    ...('gestionnaire' in picked ? { gestionnaire: picked.gestionnaire } : {}),
    ...('dateMiseEnServicePrevisionnelle' in picked ? { mise_en_service: picked.dateMiseEnServicePrevisionnelle } : {}),
    ...('maitreOuvrage' in picked ? { MO: picked.maitreOuvrage } : {}),
    ...('ouvertAuxRaccordements' in picked ? { ouvert_aux_raccordements: picked.ouvertAuxRaccordements } : {}),
  };
  const isExistingConstructionNetwork = request.network_type === 'reseau_en_construction' && request.network_id !== null;
  const networkId = isExistingConstructionNetwork
    ? await (async () => {
        await updateGeomUpdate(request.network_id as number, trace, 'zones_et_reseaux_en_construction');
        await updateReseauEnConstruction(request.network_id as number, metadata);
        return request.network_id as number;
      })()
    : await (async () => {
        const created = await createNetwork(undefined, trace, 'zones_et_reseaux_en_construction');
        await updateReseauEnConstruction(created.id_fcu, {
          ...metadata,
          nom_reseau: request.network_label,
          // a construction request attached to a heat network is an extension of it
          reseau_de_chaleur_id: request.network_type === 'reseau_de_chaleur' ? request.network_id : null,
        });
        return created.id_fcu;
      })();
  // the trace goes live right away (tiles rebuilt in the background)
  await applyNetworkGeometryDraft('zones_et_reseaux_en_construction', networkId, context.userId);
  const pdpId = await createLinkedPdp(perimeter, { reseau_en_construction_ids: [networkId] }, context.userId);
  return {
    changes: { ...metadata, geometry_applied: true, ...(pdpId ? { pdp_created: pdpId } : {}) },
    created: [
      ...(isExistingConstructionNetwork ? [] : [{ id: networkId, type: 'reseau_en_construction' as const }]),
      ...(pdpId ? [{ id: pdpId, type: 'perimetre_de_developpement_prioritaire' as const }] : []),
    ],
    network: { id: networkId, type: 'reseau_en_construction' },
  };
};

const applyPdpRequest = async (request: AcceptableRequest, context: { userId: string }): Promise<AppliedResult> => {
  const links: { reseau_de_chaleur_ids?: number[]; reseau_en_construction_ids?: number[] } =
    request.network_type === 'reseau_de_chaleur' && request.network_id !== null
      ? { reseau_de_chaleur_ids: [request.network_id] }
      : request.network_type === 'reseau_en_construction' && request.network_id !== null
        ? { reseau_en_construction_ids: [request.network_id] }
        : {};
  const perimeter = await getRequestGeometry(request.id, 'pdp');
  if (!perimeter) {
    // PDF only: the perimeter is drawn by hand on the admin map, nothing is created nor published here
    return { changes: {}, network: null };
  }
  const created = await createNetwork(undefined, perimeter, 'zone_de_developpement_prioritaire');
  if (Object.keys(links).length > 0) {
    await updatePerimetreDeDeveloppementPrioritaire(created.id_fcu, links);
  }
  await applyNetworkGeometryDraft('zone_de_developpement_prioritaire', created.id_fcu, context.userId);
  return {
    changes: {
      geometry_applied: true,
      linked_network_ids: [...(links.reseau_de_chaleur_ids ?? []), ...(links.reseau_en_construction_ids ?? [])],
    },
    created: [{ id: created.id_fcu, type: 'perimetre_de_developpement_prioritaire' }],
    network: { id: created.id_fcu, type: 'perimetre_de_developpement_prioritaire' },
  };
};

/** Creates the perimeter of a trace request (optional « pdp » files, resolved beforehand), linked to the network; `null` when none. */
const createLinkedPdp = async (
  perimeter: GeoJSON.Geometry | null,
  links: { reseau_de_chaleur_ids?: number[]; reseau_en_construction_ids?: number[] },
  userId: string
) => {
  if (!perimeter) {
    return null;
  }
  const created = await createNetwork(undefined, perimeter, 'zone_de_developpement_prioritaire');
  await updatePerimetreDeDeveloppementPrioritaire(created.id_fcu, links);
  await applyNetworkGeometryDraft('zone_de_developpement_prioritaire', created.id_fcu, userId);
  return created.id_fcu;
};

const findRequestGeometry = async (requestId: string, role: NetworkChangeRequestGeometryRole) => {
  const row = await kdb
    .selectFrom('network_change_request_geometries')
    .select(['geometry', 'error'])
    .where('request_id', '=', requestId)
    .where('role', '=', role)
    .executeTakeFirst();
  if (row?.error) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `La conversion des fichiers (${role}) a échoué : ${row.error}` });
  }
  return row?.geometry ?? null;
};

/**
 * Converted geometry of a role, `null` when the submitter only uploaded PDF (nothing to convert: the admin draws it by hand).
 * Convertible files not converted yet block the acceptance.
 */
const getRequestGeometry = async (requestId: string, role: NetworkChangeRequestGeometryRole) => {
  const geometry = await findRequestGeometry(requestId, role);
  if (geometry) {
    return geometry;
  }
  const convertible = await kdb
    .selectFrom('network_change_request_files')
    .innerJoin('files', 'files.id', 'network_change_request_files.file_id')
    .select('files.content_type')
    .where('network_change_request_files.request_id', '=', requestId)
    .where('network_change_request_files.role', '=', role)
    .where('network_change_request_files.replaced_at', 'is', null)
    .execute();
  if (convertible.some((file) => getFileTypeGroup(file.content_type) === 'geo')) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Les fichiers (${role}) ne sont pas encore convertis en géométrie, réessayez dans quelques minutes`,
    });
  }
  return null;
};

const listRequestFileIds = async (requestId: string, role: NetworkChangeRequestFileRole) =>
  (
    await kdb
      .selectFrom('network_change_request_files')
      .select('file_id')
      .where('request_id', '=', requestId)
      .where('role', '=', role)
      .execute()
  ).map((file) => file.file_id);

const assertNetworkExists = async (network: NonNullable<CreateNetworkChangeRequestInput['network']>) => {
  const table = networkEntityToTable[network.type];
  const row = await kdb
    .selectFrom(table)
    .select(sql.lit(1).as('found'))
    .where(sql.ref(`${table}.id_fcu`), '=', network.id)
    .executeTakeFirst();
  if (!row) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Réseau introuvable' });
  }
};

/**
 * The files must exist, be unused, not be infected, and match the roles and type groups allowed for the kind of request
 * (e.g. a fiche request carries at most 3 PDF documents).
 */
/** The documents a fiche request asks to take down must be published on its network, and the resulting count must fit the cap. */
const assertFicheDocumentsAreConsistent = async (input: Extract<CreateNetworkChangeRequestInput, { kind: 'fiche' }>) => {
  const removals = input.payload.documentsToRemove ?? [];
  const added = input.files.filter((file) => file.role === 'document').length;
  if (!input.network || !isDocumentedNetworkType(input.network.type)) {
    if (removals.length > 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Les documents à retirer doivent appartenir à un réseau de la base' });
    }
    return;
  }
  const published = (await listNetworkDocuments(input.network.type, input.network.id)).map((document) => document.id);
  if (removals.some((fileId) => !published.includes(fileId))) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: "Un document à retirer n'est pas publié sur ce réseau" });
  }
  if (published.length - removals.length + added > MAX_NETWORK_DOCUMENTS) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `La fiche ne peut pas avoir plus de ${MAX_NETWORK_DOCUMENTS} documents : retirez-en ou déposez-en moins`,
    });
  }
};

const assertRequestFilesAreValid = async (input: CreateNetworkChangeRequestInput) => {
  const rules = networkChangeRequestFileRules[input.kind];
  const fileIds = input.files.map((file) => file.id);
  if (new Set(fileIds).size !== fileIds.length) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Un fichier est référencé plusieurs fois' });
  }
  const countsByRole = input.files.reduce<Partial<Record<NetworkChangeRequestFileRole, number>>>(
    (counts, file) => ({ ...counts, [file.role]: (counts[file.role] ?? 0) + 1 }),
    {}
  );
  const invalidRole = Object.entries(rules).find(([role, rule]) => {
    const count = countsByRole[role as NetworkChangeRequestFileRole] ?? 0;
    return count < rule.min || count > rule.max;
  });
  if (invalidRole || input.files.some((file) => !(file.role in rules))) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Les fichiers joints ne correspondent pas à ce type de demande' });
  }

  const files = await getFilesMetadata(fileIds);
  const isUsable = (file: (typeof files)[number]) => file.request_id === null && file.purged_at === null && file.scan_status !== 'infected';
  if (files.length !== fileIds.length || !files.every(isUsable)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Un fichier joint est introuvable ou inutilisable, veuillez le déposer à nouveau',
    });
  }
  const mismatchedFile = input.files.find((file) => {
    const metadata = files.find((candidate) => candidate.id === file.id);
    const group = metadata ? getFileTypeGroup(metadata.content_type) : undefined;
    return !group || !rules[file.role]?.groups.includes(group);
  });
  if (mismatchedFile) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: "Le type d'un fichier joint n'est pas accepté pour ce type de demande" });
  }
};
