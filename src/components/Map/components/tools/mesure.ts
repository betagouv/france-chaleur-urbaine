export type MesureFeature = GeoJSON.Feature<GeoJSON.LineString> & {
  id: string;
  properties: {
    color: string;
    distance: number;
  };
};

export type MesureLabelFeature = GeoJSON.Feature<GeoJSON.Point> & {
  id: string;
  properties: {
    color: string;
    distanceLabel: string;
  };
};
