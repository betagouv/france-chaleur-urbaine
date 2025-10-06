import Papa from 'papaparse';
import type { Logger } from 'winston';

import { serverConfig } from '@/server/config';
import { parentLogger } from '@/server/helpers/logger';
import { handleError } from '@/utils/network';
import { sleep } from '@/utils/time';

export type APIAdresseResult = {
  address?: string;
  latitude?: number;
  longitude?: number;
} & (
  | {
      result_status: 'ok';
      latitude: number;
      longitude: number;
      result_label: string;
      result_score: number;
      result_city: string;
    }
  | {
      result_status: 'error' | 'not-found' | 'skipped';
      latitude: null;
      longitude: null;
      result_label: null;
      result_score: null;
      result_city: null;
    }
);

const MINIMUM_RETRY_DELAY = 2_000;
const MAXIMUM_RETRY_DELAY = 30_000;
const MAX_TOTAL_TIME = 180_000; // 3 minutes

async function makeAPIRequest(url: string, form: FormData, contextLogger?: Logger) {
  const startTime = Date.now();
  let attempt = 0;
  const logger = (contextLogger ?? parentLogger).child({
    module: 'api-adresse',
  });

  for (;;) {
    try {
      const res = await fetch(url, {
        body: form,
        method: 'post',
      });

      if (!res.ok) {
        await handleError(res, url);
      }

      const responseBody = await res.text();
      const results = Papa.parse(responseBody, {
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true,
      });

      if (results.errors.length > 0) {
        throw new Error(`CSV parsing errors: ${JSON.stringify(results.errors)}`);
      }

      const data = results.data as APIAdresseResult[];

      const stats = data.reduce(
        (acc, result) => {
          acc[result.result_status] = (acc[result.result_status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      logger.info('results stats', stats);

      return data;
    } catch (err: any) {
      attempt++;
      const elapsedTime = Date.now() - startTime;

      if (elapsedTime >= MAX_TOTAL_TIME) {
        throw new Error(`Operation timed out after ${MAX_TOTAL_TIME}ms: ${err.message}`);
      }

      // Exponential backoff
      const delay = Math.min(Math.max(MINIMUM_RETRY_DELAY, MINIMUM_RETRY_DELAY * 1.5 ** attempt), MAXIMUM_RETRY_DELAY);
      logger.error(`results error retrying in ${delay}ms`, { err: err.message });
      await sleep(delay);
    }
  }
}

export async function getAddressesCoordinates(addressesCSV: string, contextLogger?: Logger) {
  const form = new FormData();
  form.append('data', new Blob([`address\n${addressesCSV}`]), 'file.csv');
  form.append('result_columns', 'latitude');
  form.append('result_columns', 'longitude');
  form.append('result_columns', 'result_score');
  form.append('result_columns', 'result_city');
  form.append('result_columns', 'result_label');
  form.append('result_columns', 'result_status');

  return makeAPIRequest(`${serverConfig.API_ADRESSE_URL}search/csv/`, form, contextLogger);
}

export async function getCoordinatesAddresses(coordinatesCSV: string, contextLogger?: Logger) {
  const form = new FormData();
  form.append('data', new Blob([`latitude,longitude\n${coordinatesCSV}`]), 'file.csv');
  form.append('result_columns', 'result_score');
  form.append('result_columns', 'result_city');
  form.append('result_columns', 'result_label');
  form.append('result_columns', 'result_status');

  const results = await makeAPIRequest('https://data.geopf.fr/geocodage/reverse/csv', form, contextLogger);

  // Transform results to include the original coordinates as "address" field and ensure same structure
  return results.map((result, index) => {
    const coordinateLines = coordinatesCSV.split('\n');
    const originalCoordinates = coordinateLines[index];

    return {
      ...result,
      address: originalCoordinates, // Include original coordinates as address
    };
  });
}
