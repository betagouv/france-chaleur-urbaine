import {
  anIDFAddress,
  anIDFNetworkResponse,
  someCoords,
} from '@core/infrastructure/repository/__tests__/__fixtures__/data';
import { TestEligibility } from '@core/useCase/testEligibility';

describe('Test Eligibility useCase', () => {
  describe('When Address is in IDF', () => {
    it('should return an Address with an eligible to true', async () => {
      // Given
      const coords = someCoords();
      const httpClient = {
        get: jest.fn().mockResolvedValue(anIDFNetworkResponse()),
      };
      const addressRepository = {
        findByCoords: jest.fn().mockResolvedValue(anIDFAddress()),
      };
      const testEligibility = new TestEligibility(
        addressRepository,
        httpClient
      );
      // When
      const address = await testEligibility.check(coords);
      // Then
      expect(address.isEligible).toBeTruthy();
    });
  });
});
