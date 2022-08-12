import {
  exportDataSummary,
  getDataSummary,
} from '@core/infrastructure/repository/dataSummary';
import { NextApiRequest, NextApiResponse } from 'next';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { ErrorResponse } from 'src/types/ErrorResponse';
import { Summary } from 'src/types/Summary';

export default async function eligibilityStatusgibilityStatus(
  req: NextApiRequest,
  res: NextApiResponse<Summary | ErrorResponse>
) {
  try {
    const coordinates = JSON.parse(
      decodeURIComponent((req.query as Record<string, string>).coordinates)
    ) as number[][];

    if (!coordinates) {
      return res.status(400).json({
        message: 'Parameters coordinates is required',
        code: 'Bad Arguments',
      });
    }

    if (req.method === 'GET') {
      const data = await getDataSummary(coordinates);
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

      const data = await exportDataSummary(coordinates, format);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=${data.name}`);

      return res.send(data.content);
    }

    return res.status(501);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    return res.json({
      message: 'internal server error',
      code: 'Internal Server Error',
    });
  }
}
