import type { NextApiRequest, NextApiResponse } from 'next';

import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';
import { getGestionnairesDemands } from '@/server/services/manager';
import { apiUser } from '@/services/api/authentication';
import { withCors } from '@/services/api/cors';

const demands = handleRouteErrors(async (req: NextApiRequest, res: NextApiResponse) => {
  requireGetMethod(req);

  const account = await apiUser(req, res);
  if (!account) {
    return;
  }

  const demands = await getGestionnairesDemands(account.gestionnaires);
  return demands.map((demand) => ({
    id: demand.id,
    distance: demand['Distance au réseau'],
    network: demand['Identifiant réseau'],
    address: demand['Adresse'],
    buildingType: demand['Structure'],
    date: demand['Date demandes'],
  }));
});

export default withCors(demands);
