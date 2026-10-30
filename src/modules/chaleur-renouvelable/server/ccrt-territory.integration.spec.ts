import { beforeEach, expect, it } from 'vitest';

import { kdb, sql } from '@/server/db/kysely';
import { cleanDatabase, seedCommune, seedDepartement } from '@/tests/fixtures';

import { getCcrtTerritory } from './ccrt-access';

beforeEach(async () => {
  await cleanDatabase();
  await kdb.deleteFrom('ept').execute();
});

it.each([
  { arrondissement: '69385', commune: '69123', department: '69', lat: 45.75, lon: 4.82, region: '84' },
  { arrondissement: '75115', commune: '75056', department: '75', lat: 48.85, lon: 2.3, region: '11' },
  { arrondissement: '13201', commune: '13055', department: '13', lat: 43.3, lon: 5.37, region: '93' },
])('resolves all territorial scopes from coordinates for arrondissement $arrondissement', async (input) => {
  await seedCommune({
    geom: sql`ST_Multi(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint(${input.lon}, ${input.lat}), 4326), 2154), 100))`,
    insee_com: input.commune,
    insee_dep: input.department,
    insee_reg: input.region,
    siren_epci: 'EPCI',
  });
  await kdb
    .insertInto('ept')
    .values({ code: 'EPT', membres: JSON.stringify([{ code: input.commune, nom: 'Test city' }]), nom: 'Test EPT', type: 'EPT' })
    .execute();

  expect(await getCcrtTerritory(input.arrondissement, null, { lat: input.lat, lon: input.lon })).toStrictEqual({
    commune_code: input.commune,
    departement_code: input.department,
    epci_code: 'EPCI',
    ept_code: 'EPT',
    region_code: input.region,
  });
});

it('keeps EPCI and EPT separate when IGN stores a combined Grand Paris membership', async () => {
  await seedCommune({ insee_com: '92012', insee_dep: '92', insee_reg: '11', siren_epci: '200054781/200057974' });
  await kdb
    .insertInto('ept')
    .values({
      code: '200057974',
      membres: JSON.stringify([{ code: '92012', nom: 'Boulogne-Billancourt' }]),
      nom: 'Grand Paris Seine Ouest',
      type: 'EPT',
    })
    .execute();

  expect(await getCcrtTerritory('92012', null)).toStrictEqual({
    commune_code: '92012',
    departement_code: '92',
    epci_code: '200054781',
    ept_code: '200057974',
    region_code: '11',
  });
});

it.each([
  { department: '2A', region: '94' },
  { department: '971', region: '01' },
])('uses reference department codes without truncating $department', async ({ department, region }) => {
  await seedDepartement({ insee_dep: department, insee_reg: region });

  expect(await getCcrtTerritory(null, department)).toStrictEqual({
    commune_code: null,
    departement_code: department,
    epci_code: null,
    ept_code: null,
    region_code: region,
  });
});

it('falls back to the exact commune code when no spatial reference is available', async () => {
  await seedCommune({ insee_com: '74010', insee_dep: '74', insee_reg: '84', siren_epci: '200066793' });

  expect(await getCcrtTerritory('74010', '75', { lat: 45.9, lon: 6.1 })).toStrictEqual({
    commune_code: '74010',
    departement_code: '74',
    epci_code: '200066793',
    ept_code: null,
    region_code: '84',
  });
});

it('prefers the spatial commune over conflicting address codes', async () => {
  await seedCommune({
    geom: sql`ST_Multi(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint(4.82, 45.75), 4326), 2154), 100))`,
    insee_com: '69123',
    insee_dep: '69',
    insee_reg: '84',
    siren_epci: '200046977',
  });
  await seedCommune({ insee_com: '75056', insee_dep: '75', insee_reg: '11', siren_epci: '200054781' });

  expect(await getCcrtTerritory('75056', '75', { lat: 45.75, lon: 4.82 })).toStrictEqual({
    commune_code: '69123',
    departement_code: '69',
    epci_code: '200046977',
    ept_code: null,
    region_code: '84',
  });
});
