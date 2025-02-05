import Papa from 'papaparse';

import { handleError } from '@/utils/network';

const API_ADRESSE_URL = 'https://api-adresse.data.gouv.fr/search/csv/';

type APIAdresseResult = {
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
      result_status: 'error';
      latitude: null;
      longitude: null;
      result_label: null;
      result_score: null;
      result_city: null;
    }
);

export async function getAddressesCoordinates(addressesCSV: string) {
  const form = new FormData();
  form.append('data', new Blob([`address\n${addressesCSV}`]), 'file.csv');
  form.append('result_columns', 'latitude');
  form.append('result_columns', 'longitude');
  form.append('result_columns', 'result_score');
  form.append('result_columns', 'result_city');
  form.append('result_columns', 'result_label');
  form.append('result_columns', 'result_status');

  const res = await fetch(API_ADRESSE_URL, {
    method: 'post',
    body: form,
  });
  if (!res.ok) {
    // TODO gérer statut 503 et retenter plus tard
    await handleError(res, API_ADRESSE_URL);
  }
  const responseBody = await res.text();

  const results = Papa.parse(responseBody, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  if (results.errors.length > 0) {
    console.error('parsing errors:', results.errors);
    throw new Error('parsing errors');
  }
  return results.data as APIAdresseResult[];
}
