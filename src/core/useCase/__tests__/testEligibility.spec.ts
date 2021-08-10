import {
  anIDFAddress,
  anIDFNetwork,
  someCoords,
} from '@core/infrastructure/repository/__tests__/__fixtures__/data';
import { TestEligibility } from '@core/useCase/testEligibility';

describe('Test Eligibility useCase', () => {
  describe('When Address is in IDF', () => {
    it('should return an Address with an eligible to true', async () => {
      // Given
      const coords = someCoords();
      const addressRepository = {
        findByCoords: jest.fn().mockResolvedValue(anIDFAddress()),
      };
      const networkRepository = {
        findByCoords: jest.fn().mockResolvedValue(anIDFNetwork()),
        findByIrisCode: jest.fn(),
      };
      const testEligibility = new TestEligibility(
        addressRepository,
        networkRepository
      );
      // When
      const address = await testEligibility.check(coords);
      // Then
      expect(address.isEligible).toBe(true);
    });
  });
});
