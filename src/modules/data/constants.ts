import { z } from 'zod';

const zPolygonCoordinates = z.array(z.array(z.number())).min(3);
const zLineCoordinates = z.array(z.array(z.array(z.number())).min(2));

export const exportFormats = ['xlsx', 'csv'] as const;
export type ExportFormat = (typeof exportFormats)[number];

export const zGetPolygonSummaryInput = z.object({
  coordinates: zPolygonCoordinates,
});

export const zExportPolygonSummaryInput = z.object({
  coordinates: zPolygonCoordinates,
  format: z.enum(exportFormats),
});

export const zGetDensiteThermiqueLineaireInput = z.object({
  coordinates: zLineCoordinates,
});

export type LinearHeatDensity = {
  longueurTotale: number;
  consommationGaz: {
    cumul: {
      '10m': string;
      '50m': string;
    };
    densitéThermiqueLinéaire: {
      '10m': string;
      '50m': string;
    };
  };
  besoinsEnChaleur: {
    cumul: {
      '10m': string;
      '50m': string;
    };
    densitéThermiqueLinéaire: {
      '10m': string;
      '50m': string;
    };
  };
};
