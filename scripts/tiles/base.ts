import { generateGeoJSON } from './utils';

export abstract class BaseAdapter {
  abstract readonly databaseName: string;

  async generateGeoJSON(filepath?: string) {
    return generateGeoJSON(filepath || `${this.databaseName}.geojson`);
  }
}
