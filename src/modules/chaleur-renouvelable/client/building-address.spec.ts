import { beforeEach, describe, expect, it, vi } from 'vitest';

import { searchBANAddresses } from '@/modules/ban/client';
import type { BANAddressFeature } from '@/modules/ban/types';

import { getBuildingAddress } from './building-address';

vi.mock('@/modules/ban/client', () => ({ searchBANAddresses: vi.fn() }));

const currentAddress: BANAddressFeature = {
  geometry: { coordinates: [2.3, 48.8], type: 'Point' },
  properties: {
    city: 'Paris',
    citycode: '75115',
    context: '75, Paris, Île-de-France',
    housenumber: '14',
    id: 'old-address',
    importance: 1,
    label: '14 Rue Lecourbe 75015 Paris',
    name: '14 Rue Lecourbe',
    postcode: '75015',
    score: 1,
    street: 'Rue Lecourbe',
    type: 'housenumber',
    x: 0,
    y: 0,
  },
  type: 'Feature',
};
const buildingAddress: BANAddressFeature = {
  ...currentAddress,
  properties: {
    ...currentAddress.properties,
    housenumber: '16',
    id: 'building-address',
    label: '16 Rue Lecourbe 75015 Paris',
    name: '16 Rue Lecourbe',
  },
};

describe('getBuildingAddress', () => {
  beforeEach(() => vi.mocked(searchBANAddresses).mockReset());

  it.each([null, '', '  '])('keeps the existing address without a building address (%s)', async (address) => {
    expect(await getBuildingAddress(address, currentAddress)).toStrictEqual(undefined);
    expect(searchBANAddresses).not.toHaveBeenCalled();
  });

  it.each(['14 Rue Lecourbe', '14 RUE LECOURBE 75015 PARIS'])('avoids a lookup when the address already matches %s', async (address) => {
    expect(await getBuildingAddress(address, currentAddress)).toStrictEqual(currentAddress);
    expect(searchBANAddresses).not.toHaveBeenCalled();
  });

  it.each(['16 Rue Lecourbe', '16 RUE LECOURBE 75015 PARIS'])('finds the unique precise BAN address for %s', async (address) => {
    vi.mocked(searchBANAddresses).mockResolvedValue([currentAddress, buildingAddress]);
    expect(await getBuildingAddress(address, currentAddress)).toStrictEqual(buildingAddress);
  });

  it.each(['street', 'municipality', 'locality'] as const)('rejects a %s result', async (type) => {
    vi.mocked(searchBANAddresses).mockResolvedValue([{ ...buildingAddress, properties: { ...buildingAddress.properties, type } }]);
    expect(await getBuildingAddress('16 Rue Lecourbe', currentAddress)).toStrictEqual(undefined);
  });

  it('does not replace the address with a fuzzy match or the same street in another city', async () => {
    vi.mocked(searchBANAddresses).mockResolvedValue([
      currentAddress,
      { ...buildingAddress, properties: { ...buildingAddress.properties, citycode: 'other-city' } },
    ]);
    expect(await getBuildingAddress('16 Rue Lecourbe', currentAddress)).toStrictEqual(undefined);
  });

  it('keeps the address when multiple BAN entries match', async () => {
    vi.mocked(searchBANAddresses).mockResolvedValue([
      buildingAddress,
      { ...buildingAddress, properties: { ...buildingAddress.properties, id: 'other-entrance' } },
    ]);
    expect(await getBuildingAddress('16 Rue Lecourbe', currentAddress)).toStrictEqual(undefined);
  });
});
