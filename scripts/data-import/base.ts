import { parentLogger } from '@/server/helpers/logger';

export abstract class BaseAdapter {
  public name: string = 'data-import';
  public logger: ReturnType<typeof parentLogger.child>;
  abstract importData(filepath?: string): Promise<void>;

  constructor() {
    this.logger = parentLogger.child({ name: this.name });
  }
}
