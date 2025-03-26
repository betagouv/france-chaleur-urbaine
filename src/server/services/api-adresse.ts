import Papa from 'papaparse';
import { type Logger } from 'winston';

import { serverConfig } from '@/server/config';
import { parentLogger } from '@/server/helpers/logger';
import { handleError } from '@/utils/network';
import { sleep } from '@/utils/time';

export type APIAdresseResult = {
  address: string;
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

export async function getAddressesCoordinates(addressesCSV: string, contextLogger?: Logger) {
  const startTime = Date.now();
  let attempt = 0;
  const logger = (contextLogger ?? parentLogger).child({
    module: 'api-adresse',
  });

  for (;;) {
    try {
      const form = new FormData();
      form.append('data', new Blob([addressesCSV]), 'file.csv');
      form.append('result_columns', 'latitude');
      form.append('result_columns', 'longitude');
      form.append('result_columns', 'result_score');
      form.append('result_columns', 'result_city');
      form.append('result_columns', 'result_label');
      form.append('result_columns', 'result_status');

      const res = await fetch(`${serverConfig.API_ADRESSE_URL}search/csv/`, {
        method: 'post',
        body: form,
      });

      if (!res.ok) {
        await handleError(res, `${serverConfig.API_ADRESSE_URL}search/csv/`);
      }

      const responseBody = await res.text();
      const results = Papa.parse(responseBody, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      if (results.errors.length > 0) {
        throw new Error('CSV parsing errors: ' + JSON.stringify(results.errors));
      }

      const data = results.data as APIAdresseResult[];

      // TODO vérifier si on peut avoir seulement quelques lignes en error et pas toutes
      // if (data.some((result) => result.result_status === 'error')) {
      //   throw new Error('Some addresses returned with error status');
      // }
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
      const delay = Math.min(Math.max(MINIMUM_RETRY_DELAY, MINIMUM_RETRY_DELAY * Math.pow(1.5, attempt)), MAXIMUM_RETRY_DELAY);
      logger.error(`results error retrying in ${delay}ms`, { err: err.message });
      await sleep(delay);
    }
  }
}
