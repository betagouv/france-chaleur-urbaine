import { BaseAdapter } from '../base';

export default class PerimetresGeothermieProfondeAdapter extends BaseAdapter {
  // Attention, il faut avoir corrigé le format du fichier au préalable
  // sed -i 's/tableauFeature/Feature/g' gelules_geoth.geojson
  public databaseName = 'perimetres_geothermie_profonde'; // only used as a prefix for the tiles
  public zoomMax = 11;
}
