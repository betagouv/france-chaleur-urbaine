import { TypeLayerDisplay } from 'src/services/Map/param';

export type TypeGroupLegend = {
  id: string;
  subLegend?: string;
  entries: TypeLegendEntry[];
  type?: string;
  subGroup?: boolean;
  linkto?: (keyof TypeLayerDisplay)[];
};
