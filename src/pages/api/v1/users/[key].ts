import type { NextApiRequest, NextApiResponse } from 'next';
import z from 'zod';
import { apiUser } from 'src/services/api/authentication';
import { withCors } from 'src/services/api/cors';
import { upsertUsersFromApi } from 'src/services/users';

const ApiNetworkValidation = z.object({
  id_sncu: z.string(),
  contacts: z.array(z.string()),
});
const ApiNetworksValidation = z.array(ApiNetworkValidation);
export type ApiNetwork = z.infer<typeof ApiNetworkValidation>;

const apiUsers = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'PUT') {
    return res.status(501);
  }

  try {
    const account = await apiUser(req, res);
    if (!account) {
      return;
    }

    const input = ApiNetworksValidation.safeParse(req.body);
    if (input.success) {
      const warnings = await upsertUsersFromApi(account, input.data);
      return warnings.length > 0
        ? res.status(200).json({ warnings })
        : res.status(200).send('Success');
    }

    return res.status(400).json(input.error);
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

export default withCors(apiUsers);
