import { getSpreadSheet } from '@core/infrastructure/repository/export';
import { getDemands } from '@core/infrastructure/repository/manager';
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from 'next-auth';
import { getSession } from 'next-auth/react';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { ExportColumn } from 'src/types/ExportColumn';
import { Demand } from 'src/types/Summary/Demand';

const exportColumn: ExportColumn<Demand>[] = [
  {
    header: 'Statut',
    value: 'Status',
  },
  {
    header: 'Prospect recontacté',
    value: (demand) => (demand['Prise de contact'] ? 'Oui' : 'Non'),
  },
  {
    header: 'Nom',
    value: (demand) => `${demand.Prénom ? demand.Prénom : ''} ${demand.Nom}`,
  },
  { header: 'Mail', value: 'Mail' },
  { header: 'Téléphone', value: 'Téléphone' },
  { header: 'Adresse', value: 'Adresse' },
  {
    header: 'En ZDP',
    value: 'en ZDP',
  },
  { header: 'Date de demande', value: 'Date demandes' },
  { header: 'Type', value: 'Structure' },
  { header: 'Structure', value: 'Établissement' },
  {
    header: 'Mode de chauffage',
    value: 'Mode de chauffage',
  },
  {
    header: 'Type de chauffage',
    value: 'Type de chauffage',
  },
  {
    header: 'Distance au réseau (m)',
    value: (demand) =>
      demand['Gestionnaire Distance au réseau'] === undefined
        ? demand['Distance au réseau']
        : demand['Gestionnaire Distance au réseau'],
  },
  {
    header: 'Nb logements',
    value: (demand) =>
      demand['Gestionnaire Logement'] === undefined
        ? demand['Logement']
        : demand['Gestionnaire Logement'],
  },
  {
    header: 'Conso gaz (MWh)',
    value: (demand) =>
      demand['Gestionnaire Conso'] === undefined
        ? demand['Conso']
        : demand['Gestionnaire Conso'],
  },
  { header: 'Commentaires', value: 'Commentaire' },
];

const get = async (res: NextApiResponse, user: User) => {
  const demands = await getDemands(user);
  return res.status(200).json(demands);
};

const post = async (res: NextApiResponse, user: User) => {
  const demands = await getDemands(user);
  if (!demands) {
    return res.status(204).send(null);
  }

  const csv = getSpreadSheet(exportColumn, demands, EXPORT_FORMAT.CSV);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=demands_fcu.csv`);

  return res.status(200).send(csv);
};

export default async function demands(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession({ req });
    const user = session?.user;
    if (!user) {
      return res.status(204).json([]);
    }

    if (req.method === 'GET') {
      return get(res, user);
    }

    if (req.method === 'POST') {
      return post(res, user);
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
