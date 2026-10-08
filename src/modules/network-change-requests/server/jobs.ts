import type { Selectable } from 'kysely';
import type { Logger } from 'winston';

import { getFileTypeGroup } from '@/modules/files/constants';
import { type Jobs, kdb } from '@/server/db/kysely';

import { type NetworkChangeRequestGeometryRole, networkChangeRequestGeometryRoles } from '../constants';
import { convertGeoFilesToGeometry } from './geometry-conversion';

export type ParseRequestGeometriesJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'parse_request_geometries';
  data: {
    requestId: string;
  };
};

type ParseOutcome = { role: NetworkChangeRequestGeometryRole; status: 'parsed' | 'error'; error?: string };

/**
 * Extracts a geometry from the geo files of a change request, per role, so admins never open the uploaded files:
 * the result (or the conversion error) is stored on the request; the files stay (downloadable, purged with the request).
 * A file still waiting for its antivirus scan is recorded as a conversion error: the admin replays the conversion once scanned.
 */
export async function processParseRequestGeometriesJob(job: ParseRequestGeometriesJob, logger: Logger): Promise<ParseOutcome[]> {
  const files = await kdb
    .selectFrom('network_change_request_files as request_file')
    .innerJoin('files as file', 'file.id', 'request_file.file_id')
    .select(['file.id', 'file.filename', 'file.content', 'file.content_type', 'file.scan_status', 'request_file.role'])
    .where('request_file.request_id', '=', job.data.requestId)
    .where('request_file.role', 'in', [...networkChangeRequestGeometryRoles])
    // a file replaced by the admin (converted GeoJSON) no longer counts
    .where('request_file.replaced_at', 'is', null)
    .execute();

  const outcomes: ParseOutcome[] = [];
  for (const role of networkChangeRequestGeometryRoles) {
    const roleFiles = files.filter((file) => file.role === role && getFileTypeGroup(file.content_type) === 'geo');
    if (roleFiles.length === 0) {
      continue;
    }
    if (roleFiles.some((file) => file.scan_status === 'pending')) {
      outcomes.push(
        await storeRequestGeometry(job.data.requestId, role, {
          error: "Analyse antivirus en attente : relancez la conversion une fois l'analyse terminée",
        })
      );
      continue;
    }
    const blockingStatus = roleFiles.find((file) => file.scan_status === 'infected' || file.scan_status === 'error');
    if (blockingStatus) {
      outcomes.push(
        await storeRequestGeometry(job.data.requestId, role, { error: `Fichier « ${blockingStatus.filename} » infecté ou non analysable` })
      );
      continue;
    }
    if (roleFiles.some((file) => file.content === null)) {
      outcomes.push(await storeRequestGeometry(job.data.requestId, role, { error: 'Le contenu des fichiers a déjà été supprimé' }));
      continue;
    }
    try {
      const geometry = await convertGeoFilesToGeometry(
        roleFiles.map((file) => ({ content: file.content as Buffer, filename: file.filename }))
      );
      outcomes.push(await storeRequestGeometry(job.data.requestId, role, { geometry }));
    } catch (error) {
      logger.warn('geometry conversion failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: job.data.requestId,
        role,
      });
      outcomes.push(
        await storeRequestGeometry(job.data.requestId, role, { error: error instanceof Error ? error.message : 'Conversion impossible' })
      );
    }
  }
  logger.info('request geometries parsed', { outcomes, requestId: job.data.requestId });
  return outcomes;
}

/** Stores the converted geometry (or the conversion error) of a role, replacing the previous one. */
export const storeRequestGeometry = async (
  requestId: string,
  role: NetworkChangeRequestGeometryRole,
  result: { geometry: GeoJSON.Geometry } | { error: string }
): Promise<ParseOutcome> => {
  const row = {
    error: 'error' in result ? result.error : null,
    geometry: 'geometry' in result ? JSON.stringify(result.geometry) : null,
    parsed_at: new Date(),
  };
  await kdb
    .insertInto('network_change_request_geometries')
    .values({ ...row, request_id: requestId, role })
    .onConflict((conflict) => conflict.columns(['request_id', 'role']).doUpdateSet(row))
    .execute();
  return 'error' in result ? { error: result.error, role, status: 'error' } : { role, status: 'parsed' };
};
