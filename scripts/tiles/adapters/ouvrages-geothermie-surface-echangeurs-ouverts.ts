import { BaseAdapter } from '../base';

export default class OuvragesGeothermieSurfaceEchangeursOuvertsAdapter extends BaseAdapter {
  public databaseName = 'ouvrages_geothermie_surface_echangeurs_ouverts'; // only used as a prefix for the tiles
  public zoomMax = 10;
  public tippeCanoeArgs = '-r1.3';

  // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
  generateGeoJSON = (options?: { input?: string; output?: string }) =>
    this.downloadGeoJSON(
      'https://data.geoscience.fr/api/geothermyInstallationPartOpenLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=ouvrage_geothermie_aquif:vue_gthsurf_diff_ouvrage_aquif&outputFormat=application/json&srsName=EPSG:4326',
      options?.output
    );
}
