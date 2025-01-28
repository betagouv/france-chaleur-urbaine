import { readdirSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

import { type ImportAdapter } from './types';

function getAdapterFiles(folderPath: string): string[] {
  return readdirSync(join(__dirname, folderPath))
    .filter((file) => file.endsWith('.ts'))
    .map((file) => file.replace('.ts', ''));
}

/**
 * Asynchronously loads adapter classes from a given folder.
 * @param folderPath - The folder to scan for adapter files.
 */
async function loadAdapters(folderPath: string): Promise<Record<string, new () => ImportAdapter>> {
  const adapters: Record<string, new () => ImportAdapter> = {};

  try {
    const files = await readdir(folderPath);

    for (const file of files) {
      if (file.endsWith('.ts')) {
        const moduleName = file.replace('.ts', '');
        const rootModule = await import(join(folderPath, moduleName));

        const className =
          moduleName
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join('') + 'Adapter';

        if (rootModule[className]) {
          adapters[moduleName] = rootModule[className];
        }
      }
    }
  } catch (error) {
    console.error(`Error loading adapters from ${folderPath}:`, error);
  }

  return adapters;
}

export default class AdapterFactory {
  public static adapterNames = getAdapterFiles('adapters');
  public name: string | undefined;
  public adapter: ImportAdapter | undefined;
  public adapters: Record<string, new () => ImportAdapter> | undefined;

  constructor(adapterName: string) {
    this.name = adapterName;
  }

  async getInstance() {
    if (!this.adapters) {
      this.adapters = await loadAdapters(join(__dirname, 'adapters'));
    }
    if (!this.adapter) {
      this.adapter = new this.adapters[this.name as string]();
    }
    return this;
  }

  async importData(filepath?: string) {
    return this.adapter?.importData(filepath);
  }
}
