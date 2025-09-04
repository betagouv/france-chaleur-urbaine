import { authProcedure, router } from '@/modules/trpc/server';

import * as proEligibilityTestsService from './service';

export const proEligibilityTestsRouter = router({
  list: authProcedure.meta({ auth: { roles: ['admin', 'gestionnaire'] } }).query(async (props) => {
    return await proEligibilityTestsService.list({}, props.ctx);
  }),
});
