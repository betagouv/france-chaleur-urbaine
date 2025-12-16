import * as assignmentRulesService from '@/modules/demands/server/assignment-rules-service';
import crud from '@/server/api/crud';
import { handleRouteErrors } from '@/server/helpers/server';

const { GET, POST, PUT, DELETE, _types } = crud<typeof assignmentRulesService.tableName, typeof assignmentRulesService.validation>(
  assignmentRulesService as any
);

export type AssignmentRulesResponse = typeof _types;

export default handleRouteErrors(
  { DELETE, GET, POST, PUT },
  {
    requireAuthentication: ['admin'],
  }
);
