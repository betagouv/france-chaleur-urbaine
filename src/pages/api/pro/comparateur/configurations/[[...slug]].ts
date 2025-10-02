import crud from '@/server/api/crud';
import { handleRouteErrors } from '@/server/helpers/server';
import * as configurationService from '@/server/services/comparateur/configuration';

const { GET, POST, PUT, DELETE, _types } = crud<typeof configurationService.tableName, typeof configurationService.validation>(
  configurationService
);

export type ProComparateurConfigurationResponse = typeof _types;

export default handleRouteErrors(
  { DELETE, GET, POST, PUT },
  {
    requireAuthentication: ['particulier', 'professionnel', 'gestionnaire', 'admin', 'demo'],
  }
);
