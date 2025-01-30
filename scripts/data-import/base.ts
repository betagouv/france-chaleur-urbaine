export abstract class BaseAdapter {
  abstract importData(filepath?: string): Promise<any>;
}
