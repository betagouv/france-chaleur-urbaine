import EtudeEnCoursAdapter from './adapters/etudes-en-cours';
import { type ImportDataAdapter } from './types';

const adapters = {
  'etudes-en-cours': EtudeEnCoursAdapter,
};

export type ImportDataName = keyof typeof adapters;

export default class ImportDataManager {
  public name: string;
  public adapter: ImportDataAdapter;

  constructor(adapterName: ImportDataName) {
    this.name = adapterName;
    this.adapter = new adapters[adapterName]();

    if (!this.adapter) {
      throw new Error(`unknown adapter ${adapterName}`);
    }
  }

  async importData(filepath?: string) {
    return this.adapter?.importData(filepath);
  }

  static getAdapterNames() {
    return Object.keys(adapters) as ImportDataName[];
  }
}
