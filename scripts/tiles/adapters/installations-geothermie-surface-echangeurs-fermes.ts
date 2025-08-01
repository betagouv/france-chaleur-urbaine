import { BaseAdapter } from '../base';

export default class InstallationsGeothermieSurfaceEchangeursFermesAdapter extends BaseAdapter {
  public databaseName = 'installations_geothermie_surface_echangeurs_fermes'; // only used as a prefix for the tiles
  public zoomMax = 10;
  public tippeCanoeArgs = '-r1.3';

  // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
  generateGeoJSON = (filepath?: string) =>
    this.downloadGeoJSON(
      'https://data.geoscience.fr/api/geothermyInstallationClosedLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=vue_gthsurf_diff_install_sonde:vue_gthsurf_diff_install_sonde&outputFormat=application/json&srsName=EPSG:4326',
      filepath
    );
}
