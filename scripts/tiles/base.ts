import { generateGeoJSONFromTable, importGeoJSONToTable, importGeoJSONWithTipeeCanoe } from './utils';

export abstract class BaseAdapter {
  abstract readonly databaseName: string;
  public zoomMin: number = 5;
  public zoomMax: number = 14;
  public tilesGenerationMethod: 'legacy' | 'compressed' = 'compressed';

  async generateGeoJSON(filepath?: string) {
    return generateGeoJSONFromTable(filepath || `${this.databaseName}.geojson`, this.databaseName);
  }

  async importGeoJSON(filepath: string) {
    const tilesDatabaseName = `${this.databaseName}_tiles`;
    const importFn = this.tilesGenerationMethod === 'legacy' ? importGeoJSONToTable : importGeoJSONWithTipeeCanoe;
    await importFn(filepath, tilesDatabaseName, this.zoomMin, this.zoomMax);
    return tilesDatabaseName;
  }
}
