import type { NextApiRequest } from 'next';
import pLimit from 'p-limit';
import { z } from 'zod';

import { getEligilityStatus } from '@core/infrastructure/repository/addresseInformation';
import { logger } from '@helpers/logger';
import { BadRequestError, handleRouteErrors, requirePostMethod } from '@helpers/server';
import { latitudeColumnNameCandidates, longitudeColumnNameCandidates } from 'src/shared/bulk-eligibility-coordinates';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

const zBulkEligibilityCoordinates = z.union([
  z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .passthrough(),
  z
    .object({
      lon: z.number(),
      lat: z.number(),
    })
    .passthrough(),
  z
    .object({
      longitude: z.number(),
      latitude: z.number(),
    })
    .passthrough(),
]);

const QUERY_PARALLELISM = 30; // max queries in //
const limit = pLimit(QUERY_PARALLELISM);

export type BulkEligibilityCoordinates = z.infer<typeof zBulkEligibilityCoordinates>;

export default handleRouteErrors(
  async (req: NextApiRequest) => {
    requirePostMethod(req);
    const coordinatesArray = await z.array(zBulkEligibilityCoordinates).parseAsync(req.body);
    logger.info('bulk-eligibility-coordinates', {
      count: coordinatesArray.length,
    });

    // detect coordinates columns
    const coords = coordinatesArray[0];
    const longitudeColumnName = findLongitudeColumnName(coords);
    const latitudeColumnName = findLatitudeColumnName(coords);

    // process in parallel to avoid database timeouts
    const results = await Promise.all(
      coordinatesArray.map((coordinates) =>
        limit(async () => ({
          ...coordinates,
          ...(await getEligilityStatus((coordinates as any)[latitudeColumnName], (coordinates as any)[longitudeColumnName])),
        }))
      )
    );
    return results;
  },
  {
    requireAuthentication: ['admin'],
  }
);

export function findLongitudeColumnName(obj: Record<string, any>): (typeof longitudeColumnNameCandidates)[number] {
  const foundProperty = longitudeColumnNameCandidates.find((prop) => prop in obj);
  if (!foundProperty) {
    throw new BadRequestError(
      `Did not find the longitude property. Please use one of the following: ${longitudeColumnNameCandidates.join(', ')}`
    );
  }
  return foundProperty;
}

export function findLatitudeColumnName(obj: Record<string, any>): (typeof latitudeColumnNameCandidates)[number] {
  const foundProperty = latitudeColumnNameCandidates.find((prop) => prop in obj);
  if (!foundProperty) {
    throw new BadRequestError(
      `Did not find the latitude property. Please use one of the following: ${latitudeColumnNameCandidates.join(', ')}`
    );
  }
  return foundProperty;
}
