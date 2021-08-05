import { AddressIdfExcluded, IdfAddress } from '@core/domain/entity';
import { Coords } from '@core/domain/entity/address';
import { RepositoryError } from '@core/domain/errors';
import { HttpAddressRepository } from '../httpAddressRepository';

describe('Address Repository', () => {
  describe('#findByCoords', () => {
    it('should return an IDF Address, when postal code starts with [75,...,78]', async () => {
      const coords: Coords = { lat: 48.868662, lon: 2.333382 };
      const fakeHttpClient = {
        get: jest.fn().mockResolvedValue({
          city: 'Paris 2e Arrondissement',
          lat: 48.868662,
          lon: 2.333382,
          name: 'Gaillon 1',
          complete_code: '751020501',
          iris: '0501',
          citycode: '75102',
          type: 'A',
          address: '34 Avenue de l’Opéra 75002 Paris',
        }),
      };
      const addressRepository = new HttpAddressRepository(fakeHttpClient);
      const address = await addressRepository.findByCoords(coords);
      expect(address).toBeInstanceOf(IdfAddress);
      expect(address.isIDF).toBeTruthy();
      expect(fakeHttpClient.get).toHaveBeenNthCalledWith(
        1,
        `${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}coords?geojson=false&lat=${coords.lat}&lon=${coords.lon}`
      );
    });
    it('should return an Address IDF excluded according to postal code', async () => {
      const coords: Coords = { lat: 48.868662, lon: 2.333382 };
      const fakeHttpClient = {
        get: jest.fn().mockResolvedValue({
          city: 'Saint-sulpice d‘Arnoult',
          lat: 48.868662,
          lon: 2.333382,
          name: 'Charentes',
          complete_code: '172500501',
          iris: '0501',
          citycode: '17250',
          type: 'A',
          address: '34 Avenue de l’Opéra 17250 Saint-sulpice d‘Arnoult',
        }),
      };
      const addressRepository = new HttpAddressRepository(fakeHttpClient);
      const address = await addressRepository.findByCoords(coords);
      expect(address).toBeInstanceOf(AddressIdfExcluded);
      expect(address.isIDF).toBeFalsy();
      expect(fakeHttpClient.get).toHaveBeenNthCalledWith(
        1,
        `${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}coords?geojson=false&lat=${coords.lat}&lon=${coords.lon}`
      );
    });
    it('should throw an error when something going wrong', async () => {
      const coords: Coords = { lat: 48.868662, lon: 2.333382 };
      const fakeHttpClient = {
        get: jest.fn().mockRejectedValue(new Error()),
      };
      const addressRepository = new HttpAddressRepository(fakeHttpClient);
      await addressRepository.findByCoords(coords).catch((result) => {
        expect(result).rejects;
        expect(result).toBeInstanceOf(RepositoryError);
      });
      expect(fakeHttpClient.get).toHaveBeenNthCalledWith(
        1,
        `${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}coords?geojson=false&lat=${coords.lat}&lon=${coords.lon}`
      );
    });
  });
});
