import Papa from 'papaparse';

import type { FranceRenovSpace } from '@/modules/chaleur-renouvelable/constants';
import { fetchJSON, fetchText } from '@/utils/network';

// The dataset is the stable anchor; the producer can replace the main file resource.
const FRANCE_RENOV_SPACES_DATASET_URL = `https://www.data.gouv.fr/api/1/datasets/6a1d5761c0e706be4aaef8e4/`;
const FRANCE_RENOV_SPACES_CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

type FranceRenovSpacesCache = {
  expiresAt: number;
  promise: Promise<Map<string, FranceRenovSpace>>;
};

type DataGouvDatasetResponse = {
  resources: DataGouvResource[];
};

type DataGouvResource = {
  format: string;
  latest: string | null;
  type: string;
  url: string;
};

type FranceRenovSpaceCsvRow = {
  'Adresse Structure': string;
  'Code Insee Commune': string;
  'Code Postal Structure': string;
  'Commune Structure': string;
  'Email Structure': string;
  'Nom Structure': string;
  'Site Internet Structure': string | null;
  'Telephone Structure': string;
  'Telephone 2 Structure': string | null;
};

let franceRenovSpacesByCityCodeCache: FranceRenovSpacesCache | null = null;

export const getFranceRenovSpaceByCityCode = async (cityCode: string): Promise<FranceRenovSpace | null> => {
  const franceRenovSpacesByCityCode = await getFranceRenovSpacesByCityCode();

  return franceRenovSpacesByCityCode.get(cityCode) ?? null;
};

const getFranceRenovSpacesByCityCode = async () => {
  if (!franceRenovSpacesByCityCodeCache || franceRenovSpacesByCityCodeCache.expiresAt <= Date.now()) {
    franceRenovSpacesByCityCodeCache = {
      expiresAt: Date.now() + FRANCE_RENOV_SPACES_CACHE_DURATION_MS,
      promise: loadFranceRenovSpacesByCityCode(),
    };
  }

  const franceRenovSpacesByCityCodePromise = franceRenovSpacesByCityCodeCache.promise;

  try {
    return await franceRenovSpacesByCityCodePromise;
  } catch (error) {
    if (franceRenovSpacesByCityCodeCache?.promise === franceRenovSpacesByCityCodePromise) {
      franceRenovSpacesByCityCodeCache = null;
    }

    throw error;
  }
};

const loadFranceRenovSpacesByCityCode = async () => {
  const csvUrl = await getFranceRenovSpacesCsvUrl();
  const csv = await fetchText(csvUrl);
  const parsedCsv = Papa.parse<FranceRenovSpaceCsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsedCsv.errors.length > 0) {
    throw new Error(`France Renov spaces CSV parsing errors: ${JSON.stringify(parsedCsv.errors)}`);
  }

  return new Map(
    parsedCsv.data
      .filter((franceRenovSpaceCsvRow) => franceRenovSpaceCsvRow['Code Insee Commune'])
      .map((franceRenovSpaceCsvRow) => [franceRenovSpaceCsvRow['Code Insee Commune'], toFranceRenovSpace(franceRenovSpaceCsvRow)])
  );
};

const getFranceRenovSpacesCsvUrl = async () => {
  const dataset = await fetchJSON<DataGouvDatasetResponse>(FRANCE_RENOV_SPACES_DATASET_URL);
  const mainCsvResource = dataset.resources.find((resource) => resource.type === 'main' && resource.format.toLowerCase() === 'csv');

  if (!mainCsvResource) {
    throw new Error(`Impossible de récupérer le CSV sur data.gouv, url du dataset : ${FRANCE_RENOV_SPACES_DATASET_URL}`);
  }

  return mainCsvResource.latest ?? mainCsvResource.url;
};

const toFranceRenovSpace = (franceRenovSpaceCsvRow: FranceRenovSpaceCsvRow): FranceRenovSpace => ({
  address: franceRenovSpaceCsvRow['Adresse Structure'].trim(),
  city: franceRenovSpaceCsvRow['Commune Structure'],
  email: franceRenovSpaceCsvRow['Email Structure'],
  name: franceRenovSpaceCsvRow['Nom Structure'],
  phone: franceRenovSpaceCsvRow['Telephone Structure'],
  secondaryPhone: franceRenovSpaceCsvRow['Telephone 2 Structure'],
  website: franceRenovSpaceCsvRow['Site Internet Structure'],
  zipcode: franceRenovSpaceCsvRow['Code Postal Structure'],
});
