import crud from '@/server/api/crud';
import { handleRouteErrors } from '@/server/helpers/server';

import * as tagsService from './service';

const { GET, POST, PUT, DELETE, _types } = crud<typeof tagsService.tableName, typeof tagsService.validation>({
  ...tagsService,
  list: tagsService.listWithUsers as any,
});

export type TagsResponse = typeof _types;

export default handleRouteErrors(
  { GET, POST, PUT, DELETE },
  {
    requireAuthentication: ['admin'],
  }
);
