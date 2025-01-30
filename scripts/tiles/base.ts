export abstract class BaseAdapter {
  abstract readonly databaseName: string;

  abstract generateTilesGeoJSON(filepath?: string): Promise<string>;
}
