import { ogr2ogrImportGeoJSONToDatabaseTable } from '@/utils/ogr2ogr';

import { BaseAdapter } from '../base';

export default class ZonesOpportuniteFortFroidAdapter extends BaseAdapter {
  /**
   * Imports data from https://cerema.app.box.com/s/qq003y59emh2m3pht709ynb04gd29m1x/folder/268755064400
   */
  async importData(shapefilePath: string) {
    if (!shapefilePath) {
      throw new Error('Vous devez fournir un fichier shapefile');
    }
    await ogr2ogrImportGeoJSONToDatabaseTable(shapefilePath, 'zone_a_potentiel_fort_froid', ' -nlt MULTIPOLYGON');
  }
}
