import { ogr2ogrImportGeoJSONToDatabaseTable } from '@/utils/ogr2ogr';
import { defineImportFunc } from '../import-config';

export const importZonesOpportuniteFroid = defineImportFunc(async ({ filepath }) => {
  await ogr2ogrImportGeoJSONToDatabaseTable(filepath, 'zone_a_potentiel_froid', '-nlt MULTIPOLYGON');
});
