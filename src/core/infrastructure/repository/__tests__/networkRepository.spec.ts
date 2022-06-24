import { AddressFactory } from '@core/domain/entity/AddressFactory';
import { NetworkMapper } from '@core/infrastructure/mapper/network.mapper';
import { NetworkRepositoryImpl } from '@core/infrastructure/repository/networkRepositoryImpl';
import Distance from '../distance';
import {
  anIDFAddress,
  anIDFNetwork,
  anIDFNetworkResponse,
  someNetwork,
} from './__fixtures__/data';

describe('Network Repository', () => {
  describe('#findByCoords', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should correctly use distance helper', async () => {
      const spy = jest
        .spyOn(Distance, 'getDistance')
        .mockImplementation(() => anIDFNetworkResponse());

      const address = AddressFactory.create(anIDFAddress());
      const expectedNetwork = anIDFNetwork();
      const networkRepository = new NetworkRepositoryImpl();

      const network = await networkRepository.findByCoords(address);

      expect(spy).toHaveBeenNthCalledWith(1, address.lat, address.lon);
      expect(network).toEqual(expectedNetwork);
    });

    it('should a null network when nothing found', async () => {
      const spy = jest
        .spyOn(Distance, 'getDistance')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Partial object
        .mockImplementation(() => ({}));

      const address = AddressFactory.create(anIDFAddress());
      const expectedNetwork = NetworkMapper.createNullNetwork();
      const networkRepository = new NetworkRepositoryImpl();

      const network = await networkRepository.findByCoords(address);

      expect(spy).toHaveBeenNthCalledWith(1, address.lat, address.lon);
      expect(network).toEqual(expectedNetwork);
    });

    it('should throw an error when call to distance Api fails', async () => {
      const spy = jest.spyOn(Distance, 'getDistance').mockImplementation(() => {
        throw new Error();
      });
      const address = AddressFactory.create(anIDFAddress());
      const networkRepository = new NetworkRepositoryImpl();

      await networkRepository.findByCoords(address).catch((result) => {
        expect(spy).toHaveBeenNthCalledWith(1, address.lat, address.lon);
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
