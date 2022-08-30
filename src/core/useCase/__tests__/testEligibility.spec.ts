import * as inZDP from '@core/infrastructure/repository/zdp';
import {
  anIDFAddress,
  anIDFNetwork,
  someCoords,
} from '@core/infrastructure/repository/__tests__/__fixtures__/data';
import { TestEligibility } from '@core/useCase/testEligibility';
import sinon from 'sinon';

describe('Test Eligibility useCase', () => {
  let zdpStub: sinon.SinonStub;
  beforeEach(() => {
    zdpStub = sinon.stub(inZDP, 'default');
  });
  afterEach(() => {
    zdpStub.restore();
  });

  describe('When Address is in IDF', () => {
    it('should return an Address with an eligible to true', async () => {
      zdpStub.returns(true);
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
      expect(address.inZDP).toBe(true);
      sinon.assert.calledOnce(zdpStub);
      sinon.assert.calledWith(zdpStub, coords.lat, coords.lon);
    });
  });
});
