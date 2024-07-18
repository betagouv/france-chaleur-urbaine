import turfArea from '@turf/area';
import { lineString, polygon } from '@turf/helpers';
import turfLength from '@turf/length';
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { exportPolygonSummary, getLineSummary, getPolygonSummary } from '@core/infrastructure/repository/dataSummary';
import { handleRouteErrors, invalidRouteError, requireGetMethod, validateObjectSchema } from '@helpers/server';
import { clientConfig } from 'src/client-config';
import { withCors } from 'src/services/api/cors';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';

const polygonSummary = async (coordinates: number[][], req: NextApiRequest, res: NextApiResponse) => {
  const size = turfArea(polygon([coordinates])) / 1_000_000;
  if (size > clientConfig.summaryAreaSizeLimit) {
    return res.status(400).send(`Cannot compute stats on area bigger than ${clientConfig.summaryAreaSizeLimit} km²`);
  }
  if (req.method === 'GET') {
    const summary = await getPolygonSummary(coordinates);
    res.json(summary);
    return;
  } else if (req.method === 'POST') {
    const { format } = await validateObjectSchema(
      { format: req.query.format },
      {
        format: z.nativeEnum(EXPORT_FORMAT),
      }
    );

    const file = await exportPolygonSummary(coordinates, format);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${file.name}`);

    res.send(file.content);
    return;
  }

  throw invalidRouteError;
};

const lineSummary = async (coordinates: number[][][], req: NextApiRequest, res: NextApiResponse) => {
  requireGetMethod(req);
  const size = coordinates.reduce((acc, value) => acc + turfLength(lineString(value)), 0);
  const summaries = await Promise.all(coordinates.map((coordinate) => getLineSummary(coordinate)));
  const data = summaries.reduce(
    (acc, value) => {
      return {
        '10': acc['10'].concat(value['10']).filter((value, index, array) => array.findIndex((v) => v.rownum === value.rownum) === index),
        '50': acc['50'].concat(value['50']).filter((value, index, array) => array.findIndex((v) => v.rownum === value.rownum) === index),
      };
    },
    { '10': [], '50': [] } as { '10': any[]; '50': any[] }
  );
  res.json({ size, data });
};

const summary = handleRouteErrors(async (req: NextApiRequest, res: NextApiResponse) => {
  const { type, coordinates } = await z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('line'),
        coordinates: z.preprocess((v) => JSON.parse(decodeURIComponent(v as string)), z.array(z.array(z.array(z.number())))),
      }),
      z.object({
        type: z.literal('polygon'),
        coordinates: z.preprocess((v) => JSON.parse(decodeURIComponent(v as string)), z.array(z.array(z.number()))),
      }),
    ])
    .parseAsync(req.query);

  if (type === 'polygon') {
    await polygonSummary(coordinates, req, res);
  } else if (type === 'line') {
    await lineSummary(coordinates, req, res);
  }
});

export default withCors(summary);
