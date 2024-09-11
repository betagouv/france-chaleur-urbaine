export type MesureFeature = GeoJSON.Feature<GeoJSON.LineString> & {
  id: string;
  properties: {
    color: string;
    distance: number;
  };
};
