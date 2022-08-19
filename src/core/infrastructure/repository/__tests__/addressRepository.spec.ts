import { Coords } from '@core/domain/entity/address';
import { IRISAdress } from '@core/domain/entity/irisAddress';
import { RegularAddress } from '@core/domain/entity/regularAddress';
import { AddressNotFoundError } from '@core/domain/errors';
import { AddressRepositoryImpl } from '../AddressRepositoryImpl';

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
        post: jest.fn(),
      };
      const addressRepository = new AddressRepositoryImpl(fakeHttpClient);
      const address = await addressRepository.findByCoords(coords);
      expect(address).toBeInstanceOf(RegularAddress);
      expect(address.isBasedOnIRIS).toBeFalsy();
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
        post: jest.fn(),
      };
      const addressRepository = new AddressRepositoryImpl(fakeHttpClient);
      const address = await addressRepository.findByCoords(coords);
      expect(address).toBeInstanceOf(IRISAdress);
      expect(address.isBasedOnIRIS).toBeTruthy();
      expect(fakeHttpClient.get).toHaveBeenNthCalledWith(
        1,
        `${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}coords?geojson=false&lat=${coords.lat}&lon=${coords.lon}`
      );
    });
    it('should throw an error when address not found', async () => {
      const coords: Coords = { lat: 48.868662, lon: 2.333382 };
      const fakeHttpClient = {
        get: jest.fn().mockRejectedValue(new Error()),
        post: jest.fn(),
      };
      const addressRepository = new AddressRepositoryImpl(fakeHttpClient);
      await addressRepository.findByCoords(coords).catch((result) => {
        expect(result).rejects;
        expect(result).toBeInstanceOf(AddressNotFoundError);
      });
      expect(fakeHttpClient.get).toHaveBeenNthCalledWith(
        1,
        `${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}coords?geojson=false&lat=${coords.lat}&lon=${coords.lon}`
      );
    });
  });
});
