import { TypeLayerDisplay } from 'src/services/Map/param';
import { LegendGroupId } from './enum/LegendGroupId';

export type TypeGroupLegend = {
  id: LegendGroupId;
  subLegend?: string;
  entries: TypeLegendEntry[];
  type?: string;
  subGroup?: boolean;
  linkto?: (keyof TypeLayerDisplay)[];
};
