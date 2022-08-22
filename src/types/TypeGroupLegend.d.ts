export type TypeGroupLegend = {
  id: string;
  subLegend?: string;
  subLegendTxt?: string;
  entries: TypeLegendEntry[];
  type?: string;
  subGroup?: boolean;
  linkto?: string[];
};
