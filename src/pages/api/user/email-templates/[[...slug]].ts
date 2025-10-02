import crud from '@/server/api/crud';
import { handleRouteErrors } from '@/server/helpers/server';
import * as emailTemplatesService from '@/server/services/emailTemplates';

const { GET, POST, PUT, DELETE, _types } = crud<typeof emailTemplatesService.tableName, typeof emailTemplatesService.validation>(
  emailTemplatesService
);

export type EmailTemplatesResponse = typeof _types;

export default handleRouteErrors(
  { DELETE, GET, POST, PUT },
  {
    requireAuthentication: ['gestionnaire', 'admin', 'demo'],
  }
);
