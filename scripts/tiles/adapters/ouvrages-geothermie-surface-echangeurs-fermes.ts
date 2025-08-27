import { BaseAdapter } from '../base';

export default class OuvragesGeothermieSurfaceEchangeursFermesAdapter extends BaseAdapter {
  public databaseName = 'ouvrages_geothermie_surface_echangeurs_fermes'; // only used as a prefix for the tiles
  public zoomMax = 10;
  public tippeCanoeArgs = '-r1.8';

  // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
  generateGeoJSON = (options?: { input?: string; output?: string }) =>
    this.downloadGeoJSON(
      'https://data.geoscience.fr/api/geothermyInstallationPartClosedLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=ouvrage_geothermie_sonde:vue_gthsurf_diff_ouvrage_sonde&outputFormat=application/json&srsName=EPSG:4326',
      options?.output
    );
}
