import { clientConfig } from '@/client-config';
import { fetchJSON } from '@/utils/network';

import type { SuggestionItem } from './types';

type FetchBanSuggestionsOptions = {
  query: string;
  limit?: number | string;
  onlyCities?: boolean;
  excludeCities?: boolean;
};

export type SuggestionResponse = {
  type: 'FeatureCollection';
  version: string;
  features: SuggestionItem[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
  filters?: {
    type: string;
  };
};

export const searchBANAddresses = async (options: FetchBanSuggestionsOptions): Promise<SuggestionItem[]> => {
  const { query, limit = 10, onlyCities, excludeCities } = options;

  const response = await fetchJSON<SuggestionResponse>(clientConfig.banApiBaseUrl, {
    params: {
      limit: limit.toString(),
      q: query,
      ...(onlyCities ? { type: 'municipality' } : {}),
    },
  });

  const features = excludeCities ? response.features.filter((feature) => feature.properties.type !== 'municipality') : response.features;

  return features;
};
