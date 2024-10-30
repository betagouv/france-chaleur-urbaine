import { NextApiRequest, NextApiResponse } from 'next/types';
import * as yup from 'yup';

import { getSpreadSheet } from '@core/infrastructure/repository/export';
import { getDemands } from '@core/infrastructure/repository/manager';
import { handleRouteErrors, requireAuthentication, requirePostMethod } from '@helpers/server';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { USER_ROLE } from 'src/types/enum/UserRole';
import { exportsParams } from 'src/types/Export';

import { getObsoleteUsers } from './admin/exportObsoleteUsers';

const schema = yup.object().shape({
  exportType: yup.string().required(),
  params: yup.object().optional(),
});

export default handleRouteErrors(async (req: NextApiRequest, res: NextApiResponse) => {
  //Only export in XLSX format
  requirePostMethod(req);

  if (!(await schema.isValid(req.body))) {
    return res.status(400).send('Error');
  }

  const { exportType } = req.body;

  let data: any;
  switch (exportType) {
    case 'demands':
      await requireAuthentication(req, res, true);
      data = await getDemands(req.user);
      break;
    case 'obsoleteUsers':
      await requireAuthentication(req, res, [USER_ROLE.ADMIN]);
      data = await getObsoleteUsers();
      break;
    default:
      throw new Error();
  }

  const xlsx = getSpreadSheet(exportsParams[exportType].columns, data, EXPORT_FORMAT.XLSX);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${exportsParams[exportType].filename}.xlsx`);

  return res.status(200).send(xlsx);
});
