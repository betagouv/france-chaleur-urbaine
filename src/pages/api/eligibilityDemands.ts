import { handleRouteErrors, requireGetMethod } from '@helpers/server';
import type { NextApiRequest } from 'next';
import db from 'src/db';
import { EligibilityDemand } from 'src/types/EligibilityDemand';

export default handleRouteErrors(
  async (req: NextApiRequest) => {
    requireGetMethod(req);

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
    return Object.values(demandsById);
  },
  {
    requireAuthentication: ['admin'],
  }
);
