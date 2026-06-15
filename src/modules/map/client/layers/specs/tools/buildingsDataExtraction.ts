import type { MapSourceLayersSpecification } from '../../../core/common';

export const buildingsDataExtractionPolygonsSourceId = 'buildings-data-extraction-polygons';
/** Added imperatively by the tool to render the in-progress polygon. */
export const buildingsDataExtractionDrawHotLayerId = 'buildings-data-extraction-first-linestring';

export type AreaSummaryFeature = GeoJSON.Feature<GeoJSON.Polygon> & {
  id: string;
  properties: {
    isValid: boolean;
    areaSize: number;
    areaHasSelfIntersections: boolean;
  };
};

export const buildingsDataExtractionLayersSpec = [
  {
    layers: [
      {
        id: 'buildings-data-extraction-fill',
        isVisible: (config) => config.extractionDonneesBatiment,
        paint: { 'fill-color': ['case', ['get', 'isValid'], '#0000911A', '#f538381A'] },
        type: 'fill',
        unselectable: true,
      },
      {
        id: 'buildings-data-extraction-outline',
        isVisible: (config) => config.extractionDonneesBatiment,
        paint: { 'line-color': ['case', ['get', 'isValid'], '#000091', '#f53838'], 'line-width': 4 },
        type: 'line',
        unselectable: true,
      },
    ],
    source: { data: { features: [], type: 'FeatureCollection' }, type: 'geojson' },
    sourceId: buildingsDataExtractionPolygonsSourceId,
  },
] as const satisfies readonly MapSourceLayersSpecification[];
