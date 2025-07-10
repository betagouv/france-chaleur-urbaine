import EtudeEnCoursAdapter from './adapters/etudes-en-cours';
import TestsAdressesLegacyAdapter from './adapters/tests-adresses-legacy';

export const dataImportAdapters = {
  'etudes-en-cours': EtudeEnCoursAdapter,
  'tests-adresses-legacy': TestsAdressesLegacyAdapter,
};

export type DataImportName = keyof typeof dataImportAdapters;

const selectAdapter = (adapterName: DataImportName) => {
  return new dataImportAdapters[adapterName]();
};

export default selectAdapter;
