export abstract class BaseAdapter {
  abstract importData(filepath?: string): Promise<void>;
}
