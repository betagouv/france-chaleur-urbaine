import { writeFile } from 'fs/promises';

import { BaseAdapter } from '../base';

export default class OuvragesGeothermieSurfaceEchangeursFermesAdapter extends BaseAdapter {
  public databaseName = 'ouvrages_geothermie_surface_echangeurs_fermes'; // only used as a prefix for the tiles
  public zoomMax = 10;
  public tippeCanoeArgs = '-r1.8';

  async generateGeoJSON(filepath: string = `/tmp/${this.databaseName}.geojson`) {
    // https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm

    const response = await fetch(
      'https://data.geoscience.fr/api/geothermyInstallationPartClosedLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=ouvrage_geothermie_sonde:vue_gthsurf_diff_ouvrage_sonde&outputFormat=application/json&srsName=EPSG:4326'
    );
    const geojson = await response.json();
    const featuresCount = geojson.features?.length || 0;
    this.logger.info(`Features downloaded`, { count: featuresCount });
    geojson.features.forEach((feature: any) => {
      delete feature.id; // remove string id so that tippecanoe can generate a unique numeric id
    });
    await writeFile(filepath, JSON.stringify(geojson));
    return filepath;
  }
}
