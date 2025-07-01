import { generateGeoJSONFromTable, importGeoJSONToTable, importGeoJSONWithTipeeCanoe } from './utils';

export abstract class BaseAdapter {
  abstract readonly databaseName: string;
  public zoomMin: number = 5;
  public zoomMax: number = 14;
  public tilesGenerationMethod: 'legacy' | 'compressed' = 'compressed';
  public tippeCanoeArgs?: string;

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
}
