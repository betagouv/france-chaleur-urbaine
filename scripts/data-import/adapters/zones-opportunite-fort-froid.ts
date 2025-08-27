import { runBash } from '@cli/helpers/shell';

import { BaseAdapter } from '../base';

export default class ZonesOpportuniteFortFroidAdapter extends BaseAdapter {
  /**
   * Imports data from https://cerema.app.box.com/s/qq003y59emh2m3pht709ynb04gd29m1x/folder/268755064400
   */
  async importData(shapefilePath: string) {
    if (!shapefilePath) {
      throw new Error('Vous devez fournir un fichier shapefile');
    }
    await runBash(
      `ogr2ogr -f "PostgreSQL" PG:"host=localhost user=postgres dbname=postgres password=postgres_fcu" ${shapefilePath} -nln zone_a_potentiel_fort_froid -lco GEOMETRY_NAME=geom -nlt MULTIPOLYGON -t_srs EPSG:2154 -overwrite`
    );
  }
}
