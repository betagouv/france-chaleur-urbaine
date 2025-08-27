import EtudeEnCoursAdapter from './adapters/etudes-en-cours';
import TestsAdressesLegacyAdapter from './adapters/tests-adresses-legacy';
import ZonesOpportuniteFortFroidAdapter from './adapters/zones-opportunite-fort-froid';
import ZonesOpportuniteFroidAdapter from './adapters/zones-opportunite-froid';

export const dataImportAdapters = {
  'etudes-en-cours': EtudeEnCoursAdapter,
  'tests-adresses-legacy': TestsAdressesLegacyAdapter,
  'zones-opportunite-froid': ZonesOpportuniteFroidAdapter,
  'zones-opportunite-fort-froid': ZonesOpportuniteFortFroidAdapter,
};

export type DataImportName = keyof typeof dataImportAdapters;

const selectAdapter = (adapterName: DataImportName) => {
  return new dataImportAdapters[adapterName]();
};

export default selectAdapter;
