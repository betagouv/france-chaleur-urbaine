import { AddressFactory } from '@core/domain/entity/AddressFactory';
import { NetworkMapper } from '@core/infrastructure/mapper/network.mapper';
import { NetworkRepositoryImpl } from '@core/infrastructure/repository/networkRepositoryImpl';
import sinon from 'sinon';
import * as distance from '../distance';
import { anIDFAddress, someNetwork, THRESHOLD } from './__fixtures__/data';

describe('Network Repository', () => {
  describe('#findByCoords', () => {
    let computeDistanceStub: sinon.SinonStub;
    beforeEach(() => {
      computeDistanceStub = sinon.stub(distance, 'default');
    });
    afterEach(() => {
      jest.resetAllMocks();
      computeDistanceStub.restore();
    });

    it('should correctly use distance helper', async () => {
      computeDistanceStub.returns(THRESHOLD);

      const address = AddressFactory.create(anIDFAddress());
      const networkRepository = new NetworkRepositoryImpl();

      const network = await networkRepository.findByCoords(address);

      sinon.assert.calledOnce(computeDistanceStub);
      sinon.assert.calledWith(computeDistanceStub, address.lat, address.lon);
      expect(network).toEqual({
        distance: THRESHOLD,
        filiere: null,
        lat: null,
        lon: null,
        irisCode: null,
      });
    });

    it('should a null network when nothing found', async () => {
      computeDistanceStub.returns(null);

      const address = AddressFactory.create(anIDFAddress());
      const expectedNetwork = NetworkMapper.createNullNetwork();
      const networkRepository = new NetworkRepositoryImpl();

      const network = await networkRepository.findByCoords(address);

      sinon.assert.calledOnce(computeDistanceStub);
      sinon.assert.calledWith(computeDistanceStub, address.lat, address.lon);
      expect(network).toEqual(expectedNetwork);
    });

    it('should return 0 when distance is 0', async () => {
      computeDistanceStub.returns(0);

      const address = AddressFactory.create(anIDFAddress());
      const networkRepository = new NetworkRepositoryImpl();

      const network = await networkRepository.findByCoords(address);

      sinon.assert.calledOnce(computeDistanceStub);
      sinon.assert.calledWith(computeDistanceStub, address.lat, address.lon);
      expect(network).toEqual({
        distance: 0,
        filiere: null,
        lat: null,
        lon: null,
        irisCode: null,
      });
    });

    it('should throw an error when call to distance Api fails', async () => {
      computeDistanceStub.throws(new Error());

      const address = AddressFactory.create(anIDFAddress());
      const networkRepository = new NetworkRepositoryImpl();

      await networkRepository.findByCoords(address).catch((result) => {
        sinon.assert.calledOnce(computeDistanceStub);
        sinon.assert.calledWith(computeDistanceStub, address.lat, address.lon);
        expect(result).rejects;
      });
    });
  });

  describe('#findByIrisCode', () => {
    it('should correctly retrieve an Network by iris code', async () => {
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
      const networkRepository = new NetworkRepositoryImpl();

      const network = await networkRepository.findByIrisCode(address.irisCode);

      expect(network).toEqual(expectedNetwork);
    });
    it('should return a null network when nothing no irisCode matches', async () => {
      const address = AddressFactory.create({
        lat: 43.50142,
        lon: -1.45507,
        irisCode: 'some-not-existing-iris-code',
        cityCode: '64102',
        label: '2 Esplanade Jouandin 64100 Bayonne',
      });
      const expectedNetwork = NetworkMapper.createNullNetwork();
      const networkRepository = new NetworkRepositoryImpl();

      const network = await networkRepository.findByIrisCode(address.irisCode);

      expect(network).toEqual(expectedNetwork);
    });
  });
});
