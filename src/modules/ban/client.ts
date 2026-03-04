import { clientConfig } from '@/client-config';
import { fetchJSON } from '@/utils/network';

import type { BANAddressFeature } from './types';

export const BAN_MIN_QUERY_LENGTH = 3;

type FetchBanSuggestionsOptions = {
  query: string;
  onlyCities?: boolean;
  excludeCities?: boolean;
  signal?: AbortSignal;
};

/**
 * Recherche d'adresses sur l'API Base Adresse Nationale (BAN).
 * Retourne les features des adresses qui peuvent correspondre.
 */
export const searchBANAddresses = async ({ query, onlyCities, excludeCities, signal }: FetchBanSuggestionsOptions) => {
  if (query.length < BAN_MIN_QUERY_LENGTH) {
    return [];
  }

  const response = await fetchWithRetry<BANAddressSearchResponse>(`${clientConfig.banApiBaseUrl}search`, {
    params: {
      limit: '10',
      q: query,
      ...(onlyCities ? { type: 'municipality' } : {}),
    },
    signal,
  });

  const features = excludeCities ? response.features.filter((feature) => feature.properties.type !== 'municipality') : response.features;

  return features;
};

type BANAddressSearchResponse = {
  type: 'FeatureCollection';
  version: string;
  features: BANAddressFeature[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
  filters?: {
    type: string;
  };
};

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 300;

/**
 * Fetches with exponential backoff. Retries on network/server errors,
 * but not on abort (user typed something new).
 */
async function fetchWithRetry<T>(url: string, init: RequestInit & { params?: Record<string, any> }, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchJSON<T>(url, init);
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      if (isAbort || attempt >= retries) {
        throw error;
      }
      const delay = BASE_RETRY_DELAY_MS * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      // Check if aborted during the wait
      if (init.signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
    }
  }
}
