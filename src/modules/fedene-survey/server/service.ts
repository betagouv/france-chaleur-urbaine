import { TRPCError } from '@trpc/server';

import {
  FedeneFileError,
  type FiliereResult,
  importFedeneRows,
  loadFedeneRows,
} from '@/modules/data/server/imports/donnees-reseaux-bibliotheque-fedene';
import { createUserEvent } from '@/modules/events/server/service';
import { allowedFileTypes } from '@/modules/files/constants';
import { getFileForDownload } from '@/modules/files/server/service';
import { type NetworkChangeRequestPayloads, networkChangeRequestPayloadSchemas } from '@/modules/network-change-requests/constants';
import { syncLinkedNetworkFields } from '@/modules/reseaux/server/linked-fields-sync';
import { getNetworkLabel } from '@/modules/reseaux/server/service';
import { createBuildTilesJob } from '@/modules/tiles/server/service';
import { kdb } from '@/server/db/kysely';
import type { ApiContext } from '@/server/db/kysely/base-model';
import { parentLogger } from '@/server/helpers/logger';

import {
  type ImportFedeneInput,
  type ResolveSurveyDiscrepancyInput,
  type SurveyDiscrepancyField,
  surveyDiscrepancyFcuColumns,
  surveyDiscrepancyFields,
} from '../constants';

const tablesByNetworkType = { reseau_de_chaleur: 'reseaux_de_chaleur', reseau_de_froid: 'reseaux_de_froid' } as const;
const tilesByTable = {
  reseaux_de_chaleur: 'reseaux-de-chaleur',
  reseaux_de_froid: 'reseaux-de-froid',
  zones_et_reseaux_en_construction: 'reseaux-en-construction',
} as const;

// the survey changes the name and gestionnaire of the networks, shown on the map: rebuilt once, a pending rebuild is replaced
const rebuildNetworkTiles = async (tables: (keyof typeof tilesByTable)[], userId: string) => {
  const context = { user: { id: userId } } as unknown as ApiContext;
  for (const table of tables) {
    await createBuildTilesJob({ name: tilesByTable[table] }, context, { replace: true });
  }
};

/** A heat network changed name, gestionnaire or MO: its extensions copy them (`syncLinkedNetworkFields`) and their tiles follow. */
const propagateHeatNetworkChanges = async (userId: string) => {
  await syncLinkedNetworkFields();
  await rebuildNetworkTiles(['reseaux_de_chaleur', 'zones_et_reseaux_en_construction'], userId);
};

const toFiliereReport = (result: FiliereResult) => ({
  /** networks whose survey values changed */
  changed: result.changes.filter((change) => change.type === 'UPDATE').length,
  clearedCorrections: result.clearedCorrections,
  created: result.created,
  discrepancyFields: result.discrepancyFields,
  discrepancyNetworks: result.discrepancyNetworks,
  missing: result.missingFromExcel,
  updated: result.updatedCount,
});
export type FedeneImportReport = Awaited<ReturnType<typeof importFedeneFile>>;

/**
 * Imports the FEDENE library uploaded by the admin (synchronous: a few seconds for the whole file). In simulation nothing is
 * written and the report shows what the import would do: updated and created networks, FCU corrections dropped (matched by
 * the survey) and survey discrepancies to decide.
 */
export const importFedeneFile = async ({ fileId }: ImportFedeneInput, { dryRun, userId }: { dryRun: boolean; userId: string }) => {
  const file = await getFileForDownload(fileId);
  if (!file?.content || file.content_type !== allowedFileTypes['.xlsx'].contentType) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Fichier introuvable ou qui n’est pas un fichier Excel, déposez-le à nouveau' });
  }
  if (file.scan_status === 'pending') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Analyse antivirus en cours : relancez la simulation dans quelques secondes' });
  }
  if (file.scan_status !== 'clean' && file.scan_status !== 'skipped') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Le fichier n’a pas passé l’analyse antivirus' });
  }
  const logger = parentLogger.child({ dryRun, fileId, module: 'fedene-survey' });
  let rows: ReturnType<typeof loadFedeneRows>;
  let results: Awaited<ReturnType<typeof importFedeneRows>>;
  try {
    rows = loadFedeneRows(file.content);
    results = await importFedeneRows(rows, { dryRun, logger });
  } catch (error) {
    if (error instanceof FedeneFileError) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: error.message });
    }
    throw error;
  }
  const report = {
    chaleur: toFiliereReport(results.chaleur),
    dryRun,
    filename: file.filename,
    froid: toFiliereReport(results.froid),
    /** rows whose « ID EARCF » is not a SNCU id (C or F): skipped */
    ignoredRows: results.ignoredRows,
    rows: rows.length,
  };
  if (!dryRun) {
    await createUserEvent({
      author_id: userId,
      context_id: fileId,
      context_type: 'file',
      data: {
        cleared_corrections: report.chaleur.clearedCorrections + report.froid.clearedCorrections,
        created: report.chaleur.created.length + report.froid.created.length,
        discrepancies: report.chaleur.discrepancyNetworks + report.froid.discrepancyNetworks,
        filename: file.filename,
        updated: report.chaleur.updated + report.froid.updated,
      },
      type: 'fedene_survey_imported',
    });
    // `importFedeneRows` already synced the extensions: their tiles follow with the networks' ones
    await rebuildNetworkTiles(['reseaux_de_chaleur', 'reseaux_de_froid', 'zones_et_reseaux_en_construction'], userId);
  }
  return report;
};

/**
 * The pending survey discrepancies, one per network, with the fields still to decide: the FCU correction (read on the
 * network) against the survey value.
 */
export const listSurveyDiscrepancies = async () => {
  const requests = await kdb
    .selectFrom('network_change_requests')
    .select(['id', 'payload', 'network_type', 'network_id', 'network_label'])
    .where('kind', '=', 'enquete')
    .where('status', '=', 'pending')
    .execute();
  const loadNetworks = async (type: keyof typeof tablesByNetworkType) => {
    const ids = requests.flatMap((request) => (request.network_type === type && request.network_id !== null ? [request.network_id] : []));
    return ids.length === 0
      ? []
      : await kdb
          .selectFrom(tablesByNetworkType[type])
          .select(['id_fcu', 'Identifiant reseau as sncu', 'nom_reseau', 'gestionnaire_fcu', 'mo_fcu', 'nom_reseau_fcu'])
          .where('id_fcu', 'in', ids)
          .execute();
  };
  const [heatNetworks, coldNetworks] = await Promise.all([loadNetworks('reseau_de_chaleur'), loadNetworks('reseau_de_froid')]);
  const findNetwork = (type: string | null, id: number | null) =>
    (type === 'reseau_de_chaleur' ? heatNetworks : type === 'reseau_de_froid' ? coldNetworks : []).find((network) => network.id_fcu === id);

  return requests
    .map((request) => {
      const payload = request.payload as NetworkChangeRequestPayloads['enquete'];
      const network = findNetwork(request.network_type, request.network_id);
      return {
        fields: surveyDiscrepancyFields
          .filter((field) => payload[field] !== undefined && !payload.decisions?.[field])
          .map((field) => ({
            fcuValue: network?.[surveyDiscrepancyFcuColumns[field]] ?? null,
            fedeneValue: payload[field] as string,
            field,
          })),
        networkId: request.network_id,
        networkName: network?.nom_reseau ?? request.network_label,
        networkType: request.network_type,
        requestId: request.id,
        sncu: network?.sncu ?? null,
      };
    })
    .filter((discrepancy) => discrepancy.fields.length > 0)
    .sort((a, b) => (a.sncu ?? '').localeCompare(b.sncu ?? ''));
};
export type SurveyDiscrepancy = Awaited<ReturnType<typeof listSurveyDiscrepancies>>[number];

/**
 * Deletes every pending survey discrepancy (e.g. after an import of the wrong file): the next import creates them again.
 * The decisions already taken on them are lost; the processed discrepancies stay.
 */
export const clearSurveyDiscrepancies = async ({ userId }: { userId: string }) => {
  const deleted = await kdb
    .deleteFrom('network_change_requests')
    .where('kind', '=', 'enquete')
    .where('status', '=', 'pending')
    .executeTakeFirst();
  const count = Number(deleted.numDeletedRows);
  await createUserEvent({
    author_id: userId,
    context_id: 'enquete',
    context_type: 'network_change_request',
    data: { count },
    type: 'fedene_survey_discrepancies_cleared',
  });
  return { count };
};

/**
 * Decides one field of a survey discrepancy, right away. « Conserver la correction FCU » changes nothing on the network;
 * « Restaurer la valeur FEDENE » drops the correction (the survey value is displayed). The request is processed once every
 * field has a decision: a kept correction is not proposed again while the survey reports the same value.
 */
export const resolveSurveyDiscrepancy = async (
  { decision, field, requestId }: ResolveSurveyDiscrepancyInput,
  { userId }: { userId: string }
) => {
  const resolved = await kdb.transaction().execute(async (trx) => {
    // locked: two admins deciding the fields of the same network do not overwrite each other's decisions
    const request = await trx
      .selectFrom('network_change_requests')
      .select(['id', 'kind', 'status', 'payload', 'network_type', 'network_id', 'network_label'])
      .where('id', '=', requestId)
      .forUpdate()
      .executeTakeFirst();
    if (request?.kind !== 'enquete') {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Écart introuvable' });
    }
    const payload = networkChangeRequestPayloadSchemas.enquete.parse(request.payload);
    if (request.status !== 'pending' || payload[field] === undefined || payload.decisions?.[field]) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cet écart a déjà été traité' });
    }
    if ((request.network_type !== 'reseau_de_chaleur' && request.network_type !== 'reseau_de_froid') || request.network_id === null) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: "Cet écart n'est rattaché à aucun réseau de chaleur ou de froid" });
    }
    const table = tablesByNetworkType[request.network_type];
    if (decision === 'restore_fedene') {
      await trx
        .updateTable(table)
        .set({ [surveyDiscrepancyFcuColumns[field]]: null })
        .where('id_fcu', '=', request.network_id)
        .execute();
    }
    const decisions = { ...payload.decisions, [field]: decision };
    const processed = surveyDiscrepancyFields.every((other: SurveyDiscrepancyField) => payload[other] === undefined || decisions[other]);
    await trx
      .updateTable('network_change_requests')
      .set({
        payload: JSON.stringify({ ...payload, decisions }),
        ...(processed ? { processed_at: new Date(), processed_by: userId, status: 'processed' as const } : {}),
        updated_at: new Date(),
      })
      .where('id', '=', request.id)
      .execute();
    return { decisions, network: { id: request.network_id, type: request.network_type }, processed, request, table };
  });

  const { decisions, network, processed, request, table } = resolved;
  const label = await getNetworkLabel(network.id, table);
  if (decision === 'restore_fedene') {
    await createUserEvent({
      author_id: userId,
      context_id: String(network.id),
      context_type: network.type,
      data: {
        changes: { [surveyDiscrepancyFcuColumns[field]]: null },
        id: network.id,
        identifiant_reseau: label.identifiant_reseau,
        nom_reseau: label.nom_reseau,
        request_id: request.id,
        request_kind: 'enquete',
        source: 'network_change_request',
        type: table,
      },
      type: 'network_updated',
    });
    await (table === 'reseaux_de_chaleur' ? propagateHeatNetworkChanges(userId) : rebuildNetworkTiles([table], userId));
  }
  if (processed) {
    await createUserEvent({
      author_id: userId,
      context_id: request.id,
      context_type: 'network_change_request',
      data: {
        applied: Object.values(decisions).includes('restore_fedene'),
        kind: 'enquete',
        network_id: network.id,
        network_label: [label.identifiant_reseau, label.nom_reseau].filter(Boolean).join(' - ') || request.network_label,
        network_type: network.type,
        request_id: request.id,
      },
      type: 'network_change_request_processed',
    });
  }
  parentLogger.info('survey discrepancy resolved', { decision, field, processed, requestId });
  return { processed };
};
