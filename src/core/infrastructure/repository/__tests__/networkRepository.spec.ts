import { AddressFactory } from '@core/domain/entity/AddressFactory';
import { NetworkMapper } from '@core/infrastructure/mapper/network.mapper';
import { NetworkRepositoryImpl } from '@core/infrastructure/repository/networkRepositoryImpl';
import {
  anIDFAddress,
  anIDFNetwork,
  anIDFNetworkResponse,
  someNetwork,
} from './__fixtures__/data';

describe('Network Repository', () => {
  describe('#findByCoords', () => {
    it('should correctly call distance Api', async () => {
      // Given
      const fakeNetworkDistanceApiResponse = anIDFNetworkResponse();
      const httpClient = {
        get: jest.fn().mockResolvedValue(fakeNetworkDistanceApiResponse),
      };
      const address = AddressFactory.create(anIDFAddress());
      const expectedNetwork = anIDFNetwork();
      const networkRepository = new NetworkRepositoryImpl(httpClient);
      // When
      const network = await networkRepository.findByCoords(address);

      // Then
      expect(httpClient.get).toHaveBeenNthCalledWith(
        1,
        `${process.env.NEXT_PUBLIC_HEAT_NETWORK_API_BASE_URL}?lat=${address.lat}&lon=${address.lon}`
      );
      expect(network).toEqual(expectedNetwork);
    });
    it('should a null network when nothing found', async () => {
      // Given
      const httpClient = {
        get: jest.fn().mockResolvedValue({}),
      };
      const address = AddressFactory.create(anIDFAddress());
      const expectedNetwork = NetworkMapper.createNullNetwork();
      const networkRepository = new NetworkRepositoryImpl(httpClient);
      // When
      const network = await networkRepository.findByCoords(address);

      // Then
      expect(httpClient.get).toHaveBeenNthCalledWith(
        1,
        `${process.env.NEXT_PUBLIC_HEAT_NETWORK_API_BASE_URL}?lat=${address.lat}&lon=${address.lon}`
      );
      expect(network).toEqual(expectedNetwork);
    });
    it('should throw an error when call to distance Api fails', async () => {
      // Given
      const httpClient = {
        get: jest.fn().mockRejectedValue(new Error()),
      };
      const address = AddressFactory.create(anIDFAddress());
      const networkRepository = new NetworkRepositoryImpl(httpClient);
      // When
      await networkRepository.findByCoords(address).catch((result) => {
        // Then
        expect(httpClient.get).toHaveBeenNthCalledWith(
          1,
          `${process.env.NEXT_PUBLIC_HEAT_NETWORK_API_BASE_URL}?lat=${address.lat}&lon=${address.lon}`
        );
        expect(result).rejects;
      });
    });
  });
  describe('#findByIrisCode', () => {
    it('should correctly retrieve an Network by iris code', async () => {
      // Given
      const httpClient = {
        get: jest.fn().mockResolvedValue({}),
      };
      const address = AddressFactory.create({
        lat: 43.50142,
        lon: -1.45507,
        irisCode: '641021001',
        cityCode: '64102',
        label: '2 Esplanade Jouandin 64100 Bayonne',
      });
      const expectedNetwork = someNetwork({
        lat: null,
        lon: null,
        irisCode: '641021001',
        distance: null,
        filiere: 'c',
      });
      const networkRepository = new NetworkRepositoryImpl(httpClient);
      // When
      const network = await networkRepository.findByIrisCode(address.irisCode);

      // Then
      expect(httpClient.get).not.toHaveBeenCalled();
      expect(network).toEqual(expectedNetwork);
    });
    it('should return a null network when nothing no irisCode matches', async () => {
      // Given
      const httpClient = {
        get: jest.fn().mockResolvedValue({}),
      };
      const address = AddressFactory.create({
        lat: 43.50142,
        lon: -1.45507,
        irisCode: 'some-not-existing-iris-code',
        cityCode: '64102',
        label: '2 Esplanade Jouandin 64100 Bayonne',
      });
      const expectedNetwork = NetworkMapper.createNullNetwork();
      const networkRepository = new NetworkRepositoryImpl(httpClient);
      // When
      const network = await networkRepository.findByIrisCode(address.irisCode);

      // Then
      expect(httpClient.get).not.toHaveBeenCalled();
      expect(network).toEqual(expectedNetwork);
    });
  });
});
