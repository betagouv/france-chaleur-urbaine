import { ogr2ogrImportGeoJSONToDatabaseTable } from '@/utils/ogr2ogr';

import { defineFileImportFunc } from '../import';

export const importZonesOpportuniteFortFroid = defineFileImportFunc(async ({ filepath }) => {
  await ogr2ogrImportGeoJSONToDatabaseTable(filepath, 'zone_a_potentiel_fort_froid', '-nlt MULTIPOLYGON');
});
