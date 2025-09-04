import buildContext from '@/server/api/context-builder';
import crud, { type ApiResponseMutation, type ApiResponseQueryGet, type ApiResponseQueryList } from '@/server/api/crud';
import { handleRouteErrors } from '@/server/helpers/server';

import * as proEligibilityTestsService from './service';

const { GET, POST, PUT, DELETE, _types } = crud<typeof proEligibilityTestsService.tableName, typeof proEligibilityTestsService.validation>(
  proEligibilityTestsService as any
);

type ProEligibilityTestListItem = Awaited<ReturnType<typeof proEligibilityTestsService.list>>['items'][number];
type ProEligibilityTestGetItem = Awaited<ReturnType<typeof proEligibilityTestsService.get>>;
type ProEligibilityTestCreateItem = Awaited<ReturnType<typeof proEligibilityTestsService.create>>;
type ProEligibilityTestUpdateItem = Awaited<ReturnType<typeof proEligibilityTestsService.update>>;

export type ProEligibilityTestResponse = {
  list: ApiResponseQueryList<ProEligibilityTestListItem>;
  listItem: NonNullable<ApiResponseQueryList<ProEligibilityTestListItem>['items']>[number];
  get: ApiResponseQueryGet<ProEligibilityTestGetItem>;
  getItem: NonNullable<ApiResponseQueryGet<ProEligibilityTestGetItem>['item']>;
  create: ApiResponseMutation<ProEligibilityTestCreateItem>;
  update: ApiResponseMutation<ProEligibilityTestUpdateItem>;
  delete: Awaited<ReturnType<typeof DELETE>>;
  createInput: (typeof _types)['createInput'];
  updateInput: (typeof _types)['updateInput'];
};

export default handleRouteErrors(
  {
    GET,
    POST,
    PUT: async (req) => {
      const context = buildContext(req);
      const [itemId, action] = req.query.slug as string[];

      if (action === 'mark-as-seen') {
        const item = await proEligibilityTestsService.markAsSeen(itemId, context);
        return {
          status: 'success',
          item,
        };
      }

      return PUT(req);
    },
    DELETE,
  },
  {
    requireAuthentication: ['particulier', 'professionnel', 'gestionnaire', 'admin', 'demo'],
  }
);
