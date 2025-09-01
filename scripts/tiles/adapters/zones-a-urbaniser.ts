import { BaseAdapter } from '../base';

export default class ZonesAUrbaniserAdapter extends BaseAdapter {
  public databaseName = 'zone_a_urbaniser';
  public zoomMax = 12;

  // Source : https://cerema.app.box.com/s/0jiohobsodkj2lnoplfoziz7hn5wgc0z
  async generateGeoJSON(options: { input?: string; output?: string }): Promise<string> {
    if (!options.input) {
      throw new Error('Vous devez fournir une archive source');
    }

    return this.extractZippedShapefileToGeoJSON(options.input, options.output);
  }
}
