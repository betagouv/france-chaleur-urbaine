import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { fetchJSON } from '@/utils/network';
import { ogr2ogrImportGeoJSONToDatabaseTable } from '@/utils/ogr2ogr';

import { defineImportFunc } from '../import';

const QPV_SOURCE_URL =
  'https://static.data.gouv.fr/resources/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/20250206-161839/qp2024-france-hexagonale-outre-mer-wgs84-epsg4326.geojson';

// https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/
export const importQuartiersPrioritairesPolitiqueVille = defineImportFunc(async ({ logger }) => {
  logger.info('🚀 Début de l’import des quartiers prioritaires de la politique de la ville');

  const tempDir = await mkdtemp(join(tmpdir(), 'qpv-import-'));
  const geojsonFilePath = join(tempDir, 'qpv.geojson');

  try {
    logger.info('⬇️ Téléchargement du GeoJSON QPV');
    const geojson = await fetchJSON<Record<string, unknown>>(QPV_SOURCE_URL);
    await writeFile(geojsonFilePath, JSON.stringify(geojson));

    logger.info('📥 Import via ogr2ogr');
    await ogr2ogrImportGeoJSONToDatabaseTable(geojsonFilePath, 'quartiers_prioritaires_politique_ville', '-nlt MULTIPOLYGON -lco FID=fid');

    logger.info('🎉 Import QPV terminé');
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
});
