import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import db from 'src/db';
import { EligibilityDemand } from 'src/types/EligibilityDemand';
import { USER_ROLE } from 'src/types/enum/UserRole';

export default async function eligibilityDemands(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession({ req });
    const user = session?.user;
    if (!user || user.role !== USER_ROLE.ADMIN) {
      return res.status(204).json([]);
    }

    if (req.method === 'GET') {
      const demands = await db
        .from('eligibility_demands')
        .leftJoin(
          'eligibility_tests',
          'eligibility_demands.eligibility_test_id',
          'eligibility_tests.id'
        )
        .select([
          'email',
          'eligibility_tests.id',
          'eligibility_demands.created_at',
          'version',
          'addresses_count',
          'error_count',
          'eligibile_count',
          'in_error',
        ])
        .orderBy('created_at', 'desc');
      const demandsById: Record<string, EligibilityDemand> = {};
      demands.forEach((demand) => {
        const existingDemand = demandsById[demand.id];
        if (existingDemand) {
          existingDemand.emails.push(demand.email);
        } else {
          demandsById[demand.id] = {
            ...demand,
            email: undefined,
            emails: [demand.email],
          };
        }
      });
      return res.status(200).json(Object.values(demandsById));
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
