import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parentLogger } from '@/server/helpers/logger';

import { generateGeoJSONFromTable, importGeoJSONToTable, importGeoJSONWithTipeeCanoe } from './utils';
import { runBash, unlinkFileIfExists } from '../helpers/shell';

export abstract class BaseAdapter {
  abstract readonly databaseName: string;
  public name: string = 'tiles';
  public logger: ReturnType<typeof parentLogger.child>;
  public zoomMin: number = 5;
  public zoomMax: number = 14;
  public tilesGenerationMethod: 'legacy' | 'compressed' = 'compressed';
  public tippeCanoeArgs?: string;

  constructor() {
    this.logger = parentLogger.child({ name: this.name });
  }

  async generateGeoJSON(options?: { input?: string; output?: string }) {
    return generateGeoJSONFromTable(options?.output || `${this.databaseName}.geojson`, this.databaseName);
  }

  async importGeoJSON(filepath: string) {
    const tilesDatabaseName = `${this.databaseName}_tiles`;

    if (this.tilesGenerationMethod === 'legacy') {
      await importGeoJSONToTable(filepath, tilesDatabaseName, this.zoomMin, this.zoomMax);
    } else {
      await importGeoJSONWithTipeeCanoe(filepath, tilesDatabaseName, this.zoomMin, this.zoomMax, this.tippeCanoeArgs);
    }
    return tilesDatabaseName;
  }

  async downloadGeoJSON(url: string, filepath = `/tmp/${this.databaseName}.geojson`) {
    const response = await fetch(url);
    const geojson = await response.json();
    const featuresCount = geojson.features?.length || 0;
    this.logger.info(`Features downloaded`, { count: featuresCount });
    geojson.features.forEach((feature: any) => {
      delete feature.id; // remove string id so that tippecanoe can generate a unique numeric id
    });
    await writeFile(filepath, JSON.stringify(geojson));
    return filepath;
  }

  async extractZippedShapefileToGeoJSON(zipFilePath: string, outputFilePath?: string): Promise<string> {
    const outputPath = outputFilePath || `/tmp/${this.databaseName}.geojson`;

    const tempDir = await mkdtemp(join(tmpdir(), 'zip-extract-'));

    try {
      this.logger.info('Extraction du fichier ZIP', { zipFilePath, tempDir });

      await runBash(`unzip -o "${zipFilePath}" -d "${tempDir}"`);

      const findShapefile = async (dir: string): Promise<string | null> => {
        const files = await readdir(dir, { withFileTypes: true });

        // search in current directory
        const shpFile = files.find((file) => !file.isDirectory() && file.name.endsWith('.shp'));
        if (shpFile) {
          return join(dir, shpFile.name);
        }

        // search in subdirectories
        for (const file of files) {
          if (file.isDirectory()) {
            const result = await findShapefile(join(dir, file.name));
            if (result) return result;
          }
        }

        return null;
      };

      const shapefilePath = await findShapefile(tempDir);

      if (!shapefilePath) {
        throw new Error('Aucun fichier shapefile (.shp) trouvé dans le ZIP');
      }

      this.logger.info('Conversion du shapefile en GeoJSON', {
        shapefile: shapefilePath,
        output: outputPath,
      });

      await unlinkFileIfExists(outputPath);

      await runBash(`ogr2ogr -f GeoJSON -t_srs EPSG:4326 "${outputPath}" "${shapefilePath}"`);

      this.logger.info('Conversion terminée', { outputPath });

      return outputPath;
    } finally {
      // Nettoie le répertoire temporaire
      await runBash(`rm -rf "${tempDir}"`).catch((err) => {
        this.logger.warn('Erreur lors du nettoyage du répertoire temporaire', { tempDir, error: err });
      });
    }
  }
}
