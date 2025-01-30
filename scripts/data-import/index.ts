import EtudeEnCoursAdapter from './adapters/etudes-en-cours';

export const dataImportAdapters = {
  'etudes-en-cours': EtudeEnCoursAdapter,
};

export type DataImportName = keyof typeof dataImportAdapters;

const selectAdapter = (adapterName: DataImportName) => {
  return new dataImportAdapters[adapterName]();
};

export default selectAdapter;
