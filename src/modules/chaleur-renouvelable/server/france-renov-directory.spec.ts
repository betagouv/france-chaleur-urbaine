import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchJSON } from '@/utils/network';

import { getNearestFranceRenovSpace } from './france-renov-directory';

vi.mock('@/utils/network', () => ({ fetchJSON: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fcuFranceRenovDirectory', undefined);
});
afterEach(() => vi.unstubAllGlobals());

const adviceSpace = (name: string, longitude: string) => ({
  adresse: JSON.stringify([
    { code_postal: '75001', latitude: '48.8566', longitude, nom_commune: 'Paris', numero_voie: '1 rue du Conseil' },
  ]),
  nom: name,
  site_internet: JSON.stringify([{ valeur: 'https://france-renov.gouv.fr' }]),
  telephone: JSON.stringify([{ valeur: '01 00 00 00 00' }]),
});

describe('getNearestFranceRenovSpace', () => {
  it('selects the geographically closest space and reuses the directory for another address', async () => {
    vi.mocked(fetchJSON).mockResolvedValue([adviceSpace('Plus loin', '2.40'), adviceSpace('Plus proche', '2.3522')]);
    expect(await getNearestFranceRenovSpace({ lat: 48.8566, lon: 2.3522 })).toStrictEqual({
      address: '1 rue du Conseil',
      city: 'Paris',
      email: '',
      name: 'Plus proche',
      phone: '01 00 00 00 00',
      secondaryPhone: null,
      website: 'https://france-renov.gouv.fr',
      zipcode: '75001',
    });
    expect(await getNearestFranceRenovSpace({ lat: 48.8566, lon: 2.4 })).toMatchObject({ name: 'Plus loin' });
    expect(fetchJSON).toHaveBeenCalledTimes(1);
  });

  it.each([
    { response: [] },
    { response: [adviceSpace('Sans coordonnées', '')] },
    { response: [{ adresse: 'invalid', nom: 'Malformed' }] },
  ])('uses the national fallback when no valid space is available (%j)', async ({ response }) => {
    vi.mocked(fetchJSON).mockResolvedValue(response);
    expect(await getNearestFranceRenovSpace({ lat: 48.8566, lon: 2.3522 })).toStrictEqual(null);
  });

  it('does not retain a rejected directory request in the cache', async () => {
    vi.mocked(fetchJSON).mockRejectedValueOnce(new Error('Directory unavailable')).mockResolvedValueOnce([]);
    expect(await getNearestFranceRenovSpace({ lat: 48.8566, lon: 2.3522 })).toStrictEqual(null);
    expect(await getNearestFranceRenovSpace({ lat: 48.8566, lon: 2.3522 })).toStrictEqual(null);
    expect(fetchJSON).toHaveBeenCalledTimes(2);
  });
});
