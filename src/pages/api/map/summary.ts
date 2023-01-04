import {
  exportPolygonSummary,
  getLineSummary,
  getPolygonSummary,
} from '@core/infrastructure/repository/dataSummary';
import turfArea from '@turf/area';
import { lineString, polygon } from '@turf/helpers';
import turfLength from '@turf/length';
import { NextApiRequest, NextApiResponse } from 'next';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';

const polygonSummary = async (
  coordinates: number[][],
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const size = turfArea(polygon([coordinates]));
  if (size > 5_000_000) {
    return res
      .status(400)
      .send('Cannot compute stats on area bigger than 5 km²');
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
  coordinates: number[][],
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (req.method === 'GET') {
    const size = turfLength(lineString(coordinates));
    const data = await getLineSummary(coordinates);
    return res.json({ size, data });
  }

  return res.status(501);
};

export default async function summary(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const coordinates = JSON.parse(
      decodeURIComponent((req.query as Record<string, string>).coordinates)
    ) as number[][];

    const type = req.query.type as string;

    if (!coordinates || !type) {
      return res.status(400).json({
        message: 'Parameters coordinates and type are required',
        code: 'Bad Arguments',
      });
    }
    if (type === 'polygon') {
      await polygonSummary(coordinates, req, res);
    } else if (type === 'line') {
      await lineSummary(coordinates, req, res);
    } else {
      return res.status(400).json({
        message: 'Invalid type, should be line or polygon',
        code: 'Bad Arguments',
      });
    }
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    return res.json({
      message: 'internal server error',
      code: 'Internal Server Error',
    });
  }
}
