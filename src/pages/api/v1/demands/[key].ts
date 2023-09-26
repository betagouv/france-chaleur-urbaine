import { getGestionnairesDemands } from '@core/infrastructure/repository/manager';
import type { NextApiRequest, NextApiResponse } from 'next';
import { apiUser } from 'src/services/api/authentication';
import { withCors } from 'src/services/api/cors';

const demands = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(501);
  }

  try {
    const account = await apiUser(req, res);
    if (!account) {
      return;
    }

    const demands = await getGestionnairesDemands(account.gestionnaires);
    return res.status(200).json(
      demands.map((demand) => ({
        id: demand.id,
        distance: demand['Distance au réseau'],
        network: demand['Identifiant réseau'],
        address: demand['Adresse'],
        buildingType: demand['Structure'],
        date: demand['Date demandes'],
      }))
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    res.statusCode = 500;
    return res.json({
      message: 'internal server error',
      code: 'Internal Server Error',
    });
  }
};

export default withCors(demands);
