import { ogr2ogrImportGeoJSONToDatabaseTable } from '@/utils/ogr2ogr';
import { defineImportFunc } from '../import-config';

export const importZonesOpportuniteFortFroid = defineImportFunc(async ({ filepath }) => {
  await ogr2ogrImportGeoJSONToDatabaseTable(filepath, 'zone_a_potentiel_fort_froid', '-nlt MULTIPOLYGON');
});
