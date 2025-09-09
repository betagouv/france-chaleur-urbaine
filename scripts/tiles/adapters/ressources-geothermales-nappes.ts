import { BaseAdapter } from '../base';

export default class RessourcesGeothermalesNappesAdapter extends BaseAdapter {
  public databaseName = 'ressources_geothermales_nappes';
  public zoomMax = 12;

  // Source : https://drive.google.com/file/d/1w4lLWQCW1nMoRuIyZvVO5dMLMELo-YD3/view?usp=drive_link
  async generateGeoJSON(options: { input?: string; output?: string }): Promise<string> {
    if (!options.input) {
      throw new Error('Vous devez fournir une archive source');
    }

    return this.extractZippedShapefileToGeoJSON(options.input, options.output);
  }
}
