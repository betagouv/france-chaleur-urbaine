import { rename } from 'fs/promises';

import { runBash } from '../helpers/shell';

export abstract class BaseAdapter {
  abstract readonly databaseName: string;

  async generateGeoJSON(filepath?: string) {
    const filepathToExport = filepath || `${this.databaseName}.geojson`;
    await runBash(
      `docker run -it --rm --network host -v /tmp/fcu:/volume -w /volume --user $(id -u):$(id -g) ghcr.io/osgeo/gdal:alpine-normal-latest-arm64 ogr2ogr -f GeoJSON output.geojson PG:"host=localhost user=postgres dbname=postgres password=postgres_fcu" etudes_en_cours -t_srs EPSG:4326`
    );
    await rename('/tmp/fcu/output.geojson', filepathToExport);

    return filepathToExport;
  }
}
