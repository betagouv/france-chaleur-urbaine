import type { NextApiRequest, NextApiResponse } from 'next/types';
import { z } from 'zod';

import { handleRouteErrors, requireAuthentication, requirePostMethod } from '@/server/helpers/server';
import { getSpreadSheet } from '@/server/services/export';
import { getDemands } from '@/server/services/manager';
import { exportsParams } from '@/types/Export';
import { EXPORT_FORMAT } from '@/types/enum/ExportFormat';
import { USER_ROLE } from '@/types/enum/UserRole';

import { getObsoleteUsers } from './admin/exportObsoleteUsers';

const schema = z.object({
  exportType: z.string(),
  params: z.record(z.string(), z.any()).optional(),
});

export default handleRouteErrors(async (req: NextApiRequest, res: NextApiResponse) => {
  //Only export in XLSX format
  requirePostMethod(req);

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      details: result.error.issues,
      error: 'Validation failed',
    });
  }

  const { exportType } = req.body;

  let data: any;
  switch (exportType) {
    case 'demands':
      requireAuthentication(req.user, true);
      data = await getDemands(req.user);
      break;
    case 'obsoleteUsers':
      requireAuthentication(req.user, [USER_ROLE.ADMIN]);
      data = await getObsoleteUsers();
      break;
    default:
      throw new Error();
  }

  const xlsx = getSpreadSheet(exportsParams[exportType].columns, data, EXPORT_FORMAT.XLSX);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${exportsParams[exportType].filename}.xlsx`);

  res.status(200).send(xlsx);
});
