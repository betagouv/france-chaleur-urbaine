import { BaseAdapter } from '../base';

export default class InstallationsGeothermieSurfaceEchangeursOuvertsAdapter extends BaseAdapter {
  public databaseName = 'installations_geothermie_surface_echangeurs_ouverts'; // only used as a prefix for the tiles
  public zoomMax = 10;
  public tippeCanoeArgs = '-r1.3';

  // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
  generateGeoJSON = this.buildDownloadGeoJSONFromURLStrategy(
    'https://data.geoscience.fr/api/geothermyInstallationOpenLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=installation_geothermie_aquif:vue_gthsurf_diff_install_aquif&outputFormat=application/json&srsName=EPSG:4326'
  );
}
