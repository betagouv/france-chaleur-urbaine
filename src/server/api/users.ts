import { type ApiAccounts } from '@/server/db/kysely';

import * as engie from './users/engie';

const adapters = {
  ENGIE: engie,
};

type ApiHandler = {
  handleData: (data: any) => Promise<any>;
};

export const getApiHandler = (account: ApiAccounts): ApiHandler => {
  if (account.name !== 'ENGIE') {
    throw new Error(`Api for account ${account.name} is not implemented`);
  }

  const adapter = adapters[account.name];

  return {
    handleData: async (data) => adapter.handleData(account, data as any),
  };
};
