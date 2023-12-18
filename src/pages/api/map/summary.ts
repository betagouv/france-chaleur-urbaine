import {
  exportPolygonSummary,
  getLineSummary,
  getPolygonSummary,
} from '@core/infrastructure/repository/dataSummary';
import { handleRouteErrors } from '@helpers/server';
import turfArea from '@turf/area';
import { lineString, polygon } from '@turf/helpers';
import turfLength from '@turf/length';
import { NextApiRequest, NextApiResponse } from 'next';
import { SUMMARY_AREA_SIZE_LIMIT } from 'src/config';
import { withCors } from 'src/services/api/cors';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { z } from 'zod';

const polygonSummary = async (
  coordinates: number[][],
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const size = turfArea(polygon([coordinates])) / 1_000_000;
  if (size > SUMMARY_AREA_SIZE_LIMIT) {
    return res
      .status(400)
      .send(
        `Cannot compute stats on area bigger than ${SUMMARY_AREA_SIZE_LIMIT} km²`
      );
  }
  if (req.method === 'GET') {
    const data = await getPolygonSummary(coordinates);
    return res.json(data);
  } else if (req.method === 'POST') {
    const format = req.query.format as EXPORT_FORMAT;
    if (!Object.values(EXPORT_FORMAT).includes(format)) {
      return res.status(400).json({
        message: `Parameter format is required and must be one of "${Object.values(
          EXPORT_FORMAT
        ).join()}"`,
        code: 'Bad Arguments',
      });
    }

    const data = await exportPolygonSummary(coordinates, format);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${data.name}`);

    return res.send(data.content);
  }

  return res.status(501);
};

const lineSummary = async (
  coordinates: number[][][],
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (req.method === 'GET') {
    const size = coordinates.reduce(
      (acc, value) => acc + turfLength(lineString(value)),
      0
    );
    const summaries = await Promise.all(
      coordinates.map((coordinate) => getLineSummary(coordinate))
    );
    const data = summaries.reduce(
      (acc, value) => {
        return {
          '10': acc['10']
            .concat(value['10'])
            .filter(
              (value, index, array) =>
                array.findIndex((v) => v.rownum === value.rownum) === index
            ),
          '50': acc['50']
            .concat(value['50'])
            .filter(
              (value, index, array) =>
                array.findIndex((v) => v.rownum === value.rownum) === index
            ),
        };
      },
      { '10': [], '50': [] } as { '10': any[]; '50': any[] }
    );
    return res.json({ size, data });
  }

  return res.status(501);
};

const summary = async (req: NextApiRequest, res: NextApiResponse) => {
  const { type, coordinates } = await z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('line'),
        coordinates: z.preprocess(
          (v) => JSON.parse(decodeURIComponent(v as string)),
          z.array(z.array(z.array(z.number())))
        ),
      }),
      z.object({
        type: z.literal('polygon'),
        coordinates: z.preprocess(
          (v) => JSON.parse(decodeURIComponent(v as string)),
          z.array(z.array(z.number()))
        ),
      }),
    ])
    .parseAsync(req.query);

  if (type === 'polygon') {
    await polygonSummary(coordinates, req, res);
  } else if (type === 'line') {
    await lineSummary(coordinates, req, res);
  }
};

export default withCors(handleRouteErrors(summary));
