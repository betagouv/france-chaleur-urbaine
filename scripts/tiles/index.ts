import EtudeEnCoursAdapter from './adapters/etudes-en-cours';
import ReseauxDeChaleurAdapter from './adapters/reseaux-de-chaleur';

export const tilesAdapters = {
  'etudes-en-cours': EtudeEnCoursAdapter,
  'reseaux-de-chaleur': ReseauxDeChaleurAdapter,
};

export type TilesName = keyof typeof tilesAdapters;

const selectAdapter = (adapterName: TilesName) => {
  return new tilesAdapters[adapterName]();
};

export default selectAdapter;
