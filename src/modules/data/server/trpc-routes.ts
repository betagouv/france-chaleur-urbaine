import { route, router } from '@/modules/trpc/server';

import { zExportPolygonSummaryInput, zGetDensiteThermiqueLineaireInput, zGetPolygonSummaryInput } from '../constants';
import * as dataService from './service';

export const dataRouter = router({
  exportPolygonSummary: route.input(zExportPolygonSummaryInput).query(async ({ input }) => {
    return await dataService.exportPolygonSummary(input.coordinates, input.format);
  }),
  getDensiteThermiqueLineaire: route.input(zGetDensiteThermiqueLineaireInput).query(async ({ input }) => {
    return await dataService.getDensiteThermiqueLineaire(input.coordinates);
  }),
  getPolygonSummary: route.input(zGetPolygonSummaryInput).query(async ({ input }) => {
    return await dataService.getPolygonSummary(input.coordinates);
  }),
});
