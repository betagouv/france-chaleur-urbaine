import EtudeEnCoursAdapter from './adapters/etudes-en-cours';
import ReseauxDeChaleurAdapter from './adapters/reseaux-de-chaleur';
import TestsAdressesAdapter from './adapters/tests-adresses';

export const tilesAdapters = {
  'etudes-en-cours': EtudeEnCoursAdapter,
  'tests-adresses': TestsAdressesAdapter,
  'reseaux-de-chaleur': ReseauxDeChaleurAdapter,
};

export type TilesName = keyof typeof tilesAdapters;

const selectAdapter = (adapterName: TilesName) => {
  return new tilesAdapters[adapterName]();
};

export default selectAdapter;
