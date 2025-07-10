import crud from '@/server/api/crud';
import { handleRouteErrors } from '@/server/helpers/server';
import * as assignmentRulesService from '@/server/services/assignment-rules';

const { GET, POST, PUT, DELETE, _types } = crud<typeof assignmentRulesService.tableName, typeof assignmentRulesService.validation>(
  assignmentRulesService as any
);

export type AssignmentRulesResponse = typeof _types;

export default handleRouteErrors(
  { GET, POST, PUT, DELETE },
  {
    requireAuthentication: ['admin'],
  }
);
