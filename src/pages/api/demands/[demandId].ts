import {
  getDemand,
  updateDemand,
} from '@core/infrastructure/repository/manager';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import * as yup from 'yup';

const updateDemandSchema = yup.object().shape({
  Raccordable: yup.boolean(),
  'Prise de contact avec le demandeur réalisée par l’exploitant': yup.boolean(),
  'En attente d’éléments complémentaires de la part du demandeur':
    yup.boolean(),
  'Etude en cours': yup.boolean(),
  'Raccordement abandonné par la copropriété ou l’établissement tertiaire':
    yup.boolean(),
  'Raccordement voté en AG de copropriété': yup.boolean(),
  'Travaux en cours': yup.boolean(),
  'Raccordement effectué': yup.boolean(),
  Commentaire: yup.string(),
});

const dealErrors = (res: NextApiResponse, error: any) => {
  if (error) {
    console.error(error);
    res.statusCode = 502;
    return res.json({
      message: error,
      code: 'Internal Server Error',
    });
  }
};

export default async function demand(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { demandId } = req.query;
  const session = await getSession({ req });
  if (!session?.user?.email) {
    return res.status(204).json({});
  }

  switch (req.method) {
    case 'GET': {
      try {
        const demand = await getDemand(session.user.email, demandId as string);
        const error = (demand as any)?.error;
        if (error) {
          dealErrors(res, error);
        }
        return res.status(200).json(demand);
      } catch (error) {
        console.error(error);
        res.statusCode = 500;
        return res.json({
          message: 'internal server error',
          code: 'Internal Server Error',
        });
      }
    }
    case 'PUT': {
      try {
        const body = req.body;

        if (!(await updateDemandSchema.isValid(body))) {
          return res.status(400).send('Error');
        }

        const demand = await updateDemand(
          session.user.email,
          demandId as string,
          body
        );
        const error = (demand as any)?.error;
        if (error) {
          dealErrors(res, error);
        }
        return res.status(200).json(demand);
      } catch (error) {
        console.error(error);
        res.statusCode = 500;
        return res.json({
          message: 'internal server error',
          code: 'Internal Server Error',
        });
      }
    }
    default:
      return res.status(501);
  }
}
