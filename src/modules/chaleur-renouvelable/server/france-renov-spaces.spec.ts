import { afterEach, describe, expect, it, vi } from 'vitest';

const DATASET_URL = 'https://www.data.gouv.fr/api/1/datasets/6a1d5761c0e706be4aaef8e4/';
const LATEST_CSV_URL = 'https://www.data.gouv.fr/api/1/datasets/r/main-resource-id';
const RESOURCE_CSV_URL = 'https://static.data.gouv.fr/resource.csv';

const csvContent = [
  'Code Insee Commune,Adresse Structure,Code Postal Structure,Commune Structure,Email Structure,Nom Structure,Site Internet Structure,Telephone Structure,Telephone 2 Structure',
  '01001, 2 boulevard Edouard Herriot,01000,BOURG-EN-BRESSE,dombesrenov@alec-ain.fr,Dombes Rénov +,www.alec-ain.fr,0474983376,',
  '75056,6 rue Agrippa d Aubigne,75004,PARIS,contact@paris.fr,Agence parisienne du climat,https://www.apc-paris.com,0183769000,0140000000',
].join('\n');

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('France Renov spaces service', () => {
  it('loads the current main CSV resource from the stable data.gouv dataset', async () => {
    const fetchMock = mockDataGouvFetch({
      latest: LATEST_CSV_URL,
      url: RESOURCE_CSV_URL,
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getFranceRenovSpaceByCityCode } = await importFreshService();

    const franceRenovSpace = await getFranceRenovSpaceByCityCode('01001');

    expect(franceRenovSpace).toStrictEqual({
      address: '2 boulevard Edouard Herriot',
      city: 'BOURG-EN-BRESSE',
      email: 'dombesrenov@alec-ain.fr',
      name: 'Dombes Rénov +',
      phone: '0474983376',
      secondaryPhone: '',
      website: 'www.alec-ain.fr',
      zipcode: '01000',
    });
    expect(fetchMock).toHaveBeenCalledWith(DATASET_URL, {});
    expect(fetchMock).toHaveBeenCalledWith(LATEST_CSV_URL, {});
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('tabular-api'), expect.anything());
  });

  it('caches the parsed CSV across city lookups', async () => {
    const fetchMock = mockDataGouvFetch({
      latest: LATEST_CSV_URL,
      url: RESOURCE_CSV_URL,
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getFranceRenovSpaceByCityCode } = await importFreshService();

    const firstFranceRenovSpace = await getFranceRenovSpaceByCityCode('01001');
    const secondFranceRenovSpace = await getFranceRenovSpaceByCityCode('75056');
    const missingFranceRenovSpace = await getFranceRenovSpaceByCityCode('99999');

    expect(firstFranceRenovSpace?.name).toStrictEqual('Dombes Rénov +');
    expect(secondFranceRenovSpace?.name).toStrictEqual('Agence parisienne du climat');
    expect(missingFranceRenovSpace).toStrictEqual(null);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to the resource URL when latest is missing', async () => {
    const fetchMock = mockDataGouvFetch({
      latest: null,
      url: RESOURCE_CSV_URL,
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getFranceRenovSpaceByCityCode } = await importFreshService();

    await getFranceRenovSpaceByCityCode('01001');

    expect(fetchMock).toHaveBeenCalledWith(RESOURCE_CSV_URL, {});
  });
});

async function importFreshService() {
  vi.resetModules();

  return import('./france-renov-spaces');
}

function mockDataGouvFetch(resource: { latest: string | null; url: string }) {
  return vi.fn(async (fetchUrl: string) => {
    if (fetchUrl === DATASET_URL) {
      return jsonResponse({
        resources: [
          {
            format: 'csv',
            latest: 'https://www.data.gouv.fr/api/1/datasets/r/documentation-resource-id',
            type: 'documentation',
            url: 'https://static.data.gouv.fr/documentation.csv',
          },
          {
            format: 'csv',
            latest: resource.latest,
            type: 'main',
            url: resource.url,
          },
        ],
      });
    }

    if (fetchUrl === LATEST_CSV_URL || fetchUrl === RESOURCE_CSV_URL) {
      return textResponse(csvContent);
    }

    return textResponse('', 404);
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}

function textResponse(body: string, status = 200) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv',
    },
    status,
  });
}
