import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./geometry-conversion', () => ({
  convertGeoFilesToGeometry: vi.fn(),
}));

import { kdb } from '@/server/db/kysely';
import { cleanDatabase } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';

import { convertGeoFilesToGeometry } from './geometry-conversion';
import { processParseRequestGeometriesJob } from './jobs';

const lineGeometry: GeoJSON.Geometry = {
  coordinates: [
    [2.35, 48.85],
    [2.36, 48.86],
  ],
  type: 'LineString',
};

const seedRequest = async (id: string) => {
  await kdb
    .insertInto('network_change_requests')
    .values({
      contact_email: 'a@test.local',
      contact_first_name: 'A',
      contact_last_name: 'B',
      contact_type: 'exploitant',
      id,
      kind: 'trace_existant',
      network_label: 'Réseau',
      payload: JSON.stringify({}),
    })
    .execute();
};

const seedFile = async (
  id: string,
  requestId: string,
  role: 'trace' | 'pdp',
  overrides: { content_type?: string; scan_status?: 'pending' | 'clean' | 'infected' | 'skipped' } = {}
) => {
  await kdb
    .insertInto('files')
    .values({
      content: Buffer.from('{"type":"FeatureCollection","features":[]}'),
      content_type: 'application/geo+json',
      filename: `trace-${id.slice(-2)}.geojson`,
      id,
      scan_status: 'skipped',
      sha256: id,
      size: 40,
      ...overrides,
    })
    .execute();
  await kdb.insertInto('network_change_request_files').values({ file_id: id, request_id: requestId, role }).execute();
};

const job = (requestId: string) => ({
  created_at: new Date(),
  data: { requestId },
  entity_id: null,
  id: uuid(1),
  result: null,
  status: 'processing' as const,
  type: 'parse_request_geometries' as const,
  updated_at: new Date(),
  user_id: null,
});

const listGeometries = (requestId: string) =>
  kdb
    .selectFrom('network_change_request_geometries')
    .select(['role', 'geometry', 'error'])
    .where('request_id', '=', requestId)
    .orderBy('role')
    .execute();

describe('parse_request_geometries job', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.mocked(convertGeoFilesToGeometry).mockReset();
    await seedRequest(uuid(10));
  });

  it('stores one geometry per role and keeps the converted files', async () => {
    await seedFile(uuid(20), uuid(10), 'trace');
    await seedFile(uuid(21), uuid(10), 'pdp');
    vi.mocked(convertGeoFilesToGeometry).mockResolvedValue(lineGeometry);

    const outcomes = await processParseRequestGeometriesJob(job(uuid(10)), { info: vi.fn(), warn: vi.fn() } as any);

    expect(outcomes).toStrictEqual([
      { role: 'trace', status: 'parsed' },
      { role: 'pdp', status: 'parsed' },
    ]);
    expect(await listGeometries(uuid(10))).toStrictEqual([
      { error: null, geometry: lineGeometry, role: 'pdp' },
      { error: null, geometry: lineGeometry, role: 'trace' },
    ]);
    // the originals stay downloadable for the admin (purged with the request by the retention rule)
    expect(
      (await kdb.selectFrom('files').select(['id', 'content']).orderBy('id').execute()).map((file) => file.content !== null)
    ).toStrictEqual([true, true]);
    expect(vi.mocked(convertGeoFilesToGeometry).mock.calls.map(([files]) => files.map((file) => file.filename))).toStrictEqual([
      [`trace-${uuid(20).slice(-2)}.geojson`],
      [`trace-${uuid(21).slice(-2)}.geojson`],
    ]);
  });

  it('records the conversion error and keeps the file content', async () => {
    await seedFile(uuid(20), uuid(10), 'trace');
    vi.mocked(convertGeoFilesToGeometry).mockRejectedValue(new Error('Aucune géométrie trouvée dans les fichiers transmis'));

    const outcomes = await processParseRequestGeometriesJob(job(uuid(10)), { info: vi.fn(), warn: vi.fn() } as any);

    expect(outcomes).toStrictEqual([{ error: 'Aucune géométrie trouvée dans les fichiers transmis', role: 'trace', status: 'error' }]);
    expect(await listGeometries(uuid(10))).toStrictEqual([
      { error: 'Aucune géométrie trouvée dans les fichiers transmis', geometry: null, role: 'trace' },
    ]);
    expect(await kdb.selectFrom('files').select('content').where('id', '=', uuid(20)).executeTakeFirstOrThrow()).not.toStrictEqual({
      content: null,
    });
  });

  it('records a conversion error (to replay) while a file is still waiting for its antivirus scan', async () => {
    await seedFile(uuid(20), uuid(10), 'trace', { scan_status: 'pending' });

    const outcomes = await processParseRequestGeometriesJob(job(uuid(10)), { info: vi.fn(), warn: vi.fn() } as any);

    const error = "Analyse antivirus en attente : relancez la conversion une fois l'analyse terminée";
    expect(outcomes).toStrictEqual([{ error, role: 'trace', status: 'error' }]);
    expect(await listGeometries(uuid(10))).toStrictEqual([{ error, geometry: null, role: 'trace' }]);
  });

  it('ignores PDF files and infected files are reported as an error', async () => {
    await seedFile(uuid(20), uuid(10), 'trace', { content_type: 'application/pdf' });
    await seedFile(uuid(21), uuid(10), 'pdp', { scan_status: 'infected' });

    const outcomes = await processParseRequestGeometriesJob(job(uuid(10)), { info: vi.fn(), warn: vi.fn() } as any);

    expect(outcomes).toStrictEqual([
      { error: `Fichier « trace-${uuid(21).slice(-2)}.geojson » infecté ou non analysable`, role: 'pdp', status: 'error' },
    ]);
    expect(vi.mocked(convertGeoFilesToGeometry)).not.toHaveBeenCalled();
  });
});
