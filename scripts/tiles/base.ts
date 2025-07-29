import { writeFile } from 'node:fs/promises';

import { parentLogger } from '@/server/helpers/logger';

import { generateGeoJSONFromTable, importGeoJSONToTable, importGeoJSONWithTipeeCanoe } from './utils';

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

  async generateGeoJSON(filepath?: string) {
    return generateGeoJSONFromTable(filepath || `${this.databaseName}.geojson`, this.databaseName);
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
}
