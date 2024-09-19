export type MeasureFeature = GeoJSON.Feature<GeoJSON.LineString> & {
  id: string;
  properties: {
    color: string;
    distance: number;
  };
};

export type MeasureLabelFeature = GeoJSON.Feature<GeoJSON.Point> & {
  id: string;
  properties: {
    color: string;
    distanceLabel: string;
  };
};
