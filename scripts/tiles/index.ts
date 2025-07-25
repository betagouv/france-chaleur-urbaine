import EtudeEnCoursAdapter from './adapters/etudes-en-cours';
import InstallationsGeothermieSurfaceEchangeursFermesAdapter from './adapters/installations-geothermie-surface-echangeurs-fermes';
import InstallationsGeothermieSurfaceEchangeursOuvertsAdapter from './adapters/installations-geothermie-surface-echangeurs-ouverts';
import PerimetresGeothermieProfondeAdapter from './adapters/perimetres-geothermie-profonde';
import ReseauxDeChaleurAdapter from './adapters/reseaux-de-chaleur';
import TestsAdressesAdapter from './adapters/tests-adresses';

export const tilesAdapters = {
  'etudes-en-cours': EtudeEnCoursAdapter,
  'perimetres-geothermie-profonde': PerimetresGeothermieProfondeAdapter,
  'tests-adresses': TestsAdressesAdapter,
  'reseaux-de-chaleur': ReseauxDeChaleurAdapter,
  'installations-geothermie-surface-echangeurs-fermes': InstallationsGeothermieSurfaceEchangeursFermesAdapter,
  'installations-geothermie-surface-echangeurs-ouverts': InstallationsGeothermieSurfaceEchangeursOuvertsAdapter,
};

export type TilesName = keyof typeof tilesAdapters;

const selectAdapter = (adapterName: TilesName) => {
  return new tilesAdapters[adapterName]();
};

export default selectAdapter;
