import { getGestionnairesDemands } from '@core/infrastructure/repository/manager';
import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import { withCors } from 'src/services/api/cors';

const demands = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(501);
  }

  try {
    const { key } = req.query;

    if (!key) {
      res.status(400).json({
        message: 'Parameter key is required',
        code: 'Bad Arguments',
      });
      return;
    }

    const { authorization } = req.headers;
    if (!authorization) {
      res.status(401).json({
        message: 'Please specify a Bearer token authorization',
      });
      return;
    }

    const bearerToken = authorization.split(' ');
    if (bearerToken.length !== 2 || bearerToken[0].toLowerCase() !== 'bearer') {
      res.status(401).json({
        message: 'Please specify a Bearer token authorization',
      });
      return;
    }

    const account = await db('api_accounts').where('key', key).first();
    if (!account || account.token !== bearerToken[1]) {
      res.status(401).json({
        message: 'Please check account key and token',
      });
      return;
    }

    const demands = await getGestionnairesDemands(account.gestionnaires);
    return res.status(200).json(
      demands.map((demand) => ({
        id: demand.id,
        distance: demand['Distance au réseau'],
        network: demand['Identifiant réseau'],
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
