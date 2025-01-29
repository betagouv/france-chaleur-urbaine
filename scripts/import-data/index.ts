import EtudeEnCoursAdapter from './adapters/etudes-en-cours';
import { type ImportAdapter } from './types';

const adapters = {
  'etudes-en-cours': EtudeEnCoursAdapter,
};

export type AdapterName = keyof typeof adapters;

export default class AdapterFactory {
  public name: string;
  public adapter: ImportAdapter;

  constructor(adapterName: AdapterName) {
    this.name = adapterName;
    this.adapter = new adapters[adapterName]();

    if (!this.adapter) {
      throw new Error(`unknown adapter ${adapterName}`);
    }
  }

  async importData(filepath?: string) {
    return this.adapter?.importData(filepath);
  }
}
