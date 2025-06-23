import { handleRouteErrors } from '@/server/helpers/server';
import { listWithUsers } from '@/server/services/tags';

const GET = listWithUsers;

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
