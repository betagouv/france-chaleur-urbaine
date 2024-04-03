import { getSpreadSheet } from '@core/infrastructure/repository/export';
import { handleRouteErrors, requirePostMethod } from '@helpers/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import { ExportColumn } from 'src/types/ExportColumn';
import { User } from 'src/types/User';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';

const usersExportColumns: ExportColumn<User>[] = [
  {
    header: 'Email',
    value: 'email',
  },
  {
    header: 'Date de création du compte',
    value: (user) => new Date(user.created_at).toLocaleDateString('fr-FR'),
  },
  {
    header: 'Compte actif',
    value: (user) => `${user.active ? 'Oui' : 'Non'}`,
  },
];

export default handleRouteErrors(
  async (req: NextApiRequest, res: NextApiResponse) => {
    requirePostMethod(req);
    const today = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 6);
    const users = await db('users')
      .select('email', 'created_at', 'active')
      .whereNull('last_connection')
      .orWhereNotBetween('created_at', [from, today])
      .orderBy('created_at');
    const csv = getSpreadSheet(usersExportColumns, users, EXPORT_FORMAT.XLSX);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=comptes_obsoletes.xlsx`
    );

    return res.status(200).send(csv);
  },
  {
    requireAuthentication: ['admin'],
  }
);
