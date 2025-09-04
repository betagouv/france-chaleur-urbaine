import { type Selectable } from 'kysely';

import { handleRouteErrors } from '@/server/helpers/server';
import { type FrontendType } from '@/utils/typescript';

import * as proEligibilityTestsService from './service';

const GET = proEligibilityTestsService.listAdmin;

export type AdminProEligibilityTestListItem = FrontendType<Selectable<Awaited<ReturnType<typeof GET>>[number]>>;

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
