import type { NextApiRequest, NextApiResponse } from 'next';

import { getSpreadSheet } from '@core/infrastructure/repository/export';
import { getDemands } from '@core/infrastructure/repository/manager';
import { handleRouteErrors, invalidPermissionsError } from '@helpers/server';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { ExportColumn } from 'src/types/ExportColumn';
import { Demand } from 'src/types/Summary/Demand';

const demandsExportColumns: ExportColumn<Demand>[] = [
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
    header: 'En PDP',
    value: 'en PDP',
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
      demand['Gestionnaire Distance au réseau'] === undefined ? demand['Distance au réseau'] : demand['Gestionnaire Distance au réseau'],
  },
  { header: 'ID réseau le plus proche', value: 'Identifiant réseau' },
  { header: 'Nom du réseau le plus proche', value: 'Nom réseau' },
  {
    header: 'Nb logements',
    value: (demand) => (demand['Gestionnaire Logement'] === undefined ? demand['Logement'] : demand['Gestionnaire Logement']),
  },
  {
    header: 'Surface en m2',
    value: 'Surface en m2',
  },
  {
    header: 'Conso gaz (MWh)',
    value: (demand) => (demand['Gestionnaire Conso'] === undefined ? demand['Conso'] : demand['Gestionnaire Conso']),
  },
  { header: 'Commentaires', value: 'Commentaire' },
  {
    header: 'Affecté à',
    value: 'Affecté à',
  },
];

export default handleRouteErrors(
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'GET') {
      return await getDemands(req.user);
    }

    if (req.method === 'POST') {
      const demands = await getDemands(req.user);
      const csv = getSpreadSheet(demandsExportColumns, demands, EXPORT_FORMAT.XLSX);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=demands_fcu.xlsx`);

      return res.status(200).send(csv);
    }

    throw invalidPermissionsError;
  },
  {
    requireAuthentication: true,
  }
);
