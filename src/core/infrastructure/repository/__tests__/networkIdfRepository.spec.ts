import { AddressFactory } from '@core/domain/entity/AddressFactory';
import { NetworkIdfRepository } from '@core/infrastructure/repository';
import {
  anIDFAddress,
  anIDFNetwork,
  anIDFNetworkResponse,
} from './__fixtures__/data';

describe('Network IDF Repository', () => {
  describe('#findNearestOf', () => {
    it('should correctly call distance Api', async () => {
      // Given
      const fakeNetworkDistanceApiResponse = anIDFNetworkResponse();
      const httpClient = {
        get: jest.fn().mockResolvedValue(fakeNetworkDistanceApiResponse),
      };
      const address = AddressFactory.create(anIDFAddress());
      const expectedNetwork = anIDFNetwork();
      const repository = new NetworkIdfRepository(httpClient);
      // When
      const network = await repository.findNearestOf(address);

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
      const repository = new NetworkIdfRepository(httpClient);
      // When
      await repository.findNearestOf(address).catch((result) => {
        // Then
        expect(httpClient.get).toHaveBeenNthCalledWith(
          1,
          `${process.env.NEXT_PUBLIC_HEAT_NETWORK_API_BASE_URL}?lat=${address.lat}&lon=${address.lon}`
        );
        expect(result).rejects;
      });
    });
  });
});
