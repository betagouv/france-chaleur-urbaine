import { TypeLayerDisplay } from 'src/services/Map/param';

export type TypeGroupLegend = {
  id: LegendGroupId;
  subLegend?: string;
  entries: TypeLegendEntry[];
  type?: string;
  subGroup?: boolean;
  linkto?: (keyof TypeLayerDisplay)[];
};
