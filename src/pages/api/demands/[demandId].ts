import { updateDemand } from '@core/infrastructure/repository/manager';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { DEMANDE_STATUS } from 'src/types/enum/DemandSatus';
import * as yup from 'yup';

const updateDemandSchema = yup.object().shape({
  'Prise de contact': yup.boolean().optional(),
  Commentaire: yup.string().optional(),
  Status: yup.string().optional().oneOf(Object.values(DEMANDE_STATUS)),
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
  if (!session?.user) {
    return res.status(204).json({});
  }

  if (req.method !== 'PUT') {
    return res.status(501);
  }
  try {
    const body = req.body;

    if (!(await updateDemandSchema.isValid(body))) {
      return res.status(400).send('Error');
    }

    const demand = await updateDemand(session.user, demandId as string, body);

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
