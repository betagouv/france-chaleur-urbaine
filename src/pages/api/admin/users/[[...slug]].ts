import * as userService from '@/modules/users/server/service';
import crud from '@/server/api/crud';
import { handleRouteErrors } from '@/server/helpers/server';

const { GET, POST, PUT, DELETE, _types } = crud<typeof userService.tableName, typeof userService.validation>(userService as any);

export type UsersResponse = typeof _types;

export default handleRouteErrors(
  { DELETE, GET, POST, PUT },
  {
    requireAuthentication: ['admin'],
  }
);
