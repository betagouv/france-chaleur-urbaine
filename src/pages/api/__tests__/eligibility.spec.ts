/**
 * @jest-environment node
 */
import { NetworkDistance } from '@core/infrastructure/mapper/network.dto';
import * as distance from '@core/infrastructure/repository/distance';
import {
  someCoords,
  someEligiblePyrisAddressOutOfIDFResponse,
  someIDFNetworkLessThanThresholdDistanceResponse,
  someNetwork,
  someOutOfIDFCoordsWithNoNetwork,
  somePyrisAddressOutOfIDFResponse,
  somePyrisAddressResponse,
} from '@core/infrastructure/repository/__tests__/__fixtures__/data';
import nock from 'nock';
import { createMocks } from 'node-mocks-http';
import sinon from 'sinon';
import eligibilityStatus from '../map/eligibilityStatus';

const THRESHOLD = parseInt(process.env.NEXT_THRESHOLD || '0', 10);

describe('/api/map/eligibilityStatus', () => {
  let computeDistanceStub: sinon.SinonStub;
  beforeEach(() => {
    computeDistanceStub = sinon.stub(distance, 'default');
  });
  afterEach(() => {
    computeDistanceStub.restore();
  });

  beforeAll(() => nock.disableNetConnect());
  afterAll(() => nock.enableNetConnect());

  test('return an 400 error when passing bad api parameters', async () => {
    const givenParams = { lat: 'some-lat', lon: null };
    const { req, res } = createMocks({
      method: 'GET',
      query: givenParams,
    });

    await eligibilityStatus(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: 'Parameters lat and lon are required',
        code: 'Bad Arguments',
      })
    );
  });
  test('return an 404 error when address not found', async () => {
    nock(`${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}`)
      .get('/coords')
      .query({
        geojson: false,
        ...someCoords(),
      })
      .reply(404, { message: 'IRIS not found from provided coordinates' });
    const coords = someCoords();
    const { req, res } = createMocks({
      method: 'GET',
      query: coords,
    });

    await eligibilityStatus(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: `no address found for theses coords : ${JSON.stringify(
          coords
        )} (AxiosError: Request failed with status code 404)`,
        code: 'Address Not Found',
      })
    );
  });
  describe('When no network near address found', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    test('should a successful response but with a null network (address in IDF)', async () => {
      const coords = someCoords();
      nock(`${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}`)
        .get('/coords')
        .query({
          geojson: false,
          ...coords,
        })
        .reply(200, { ...somePyrisAddressResponse() });

      computeDistanceStub.returns(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: coords,
      });

      await eligibilityStatus(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(
        expect.objectContaining({
          ...someCoords(),
          network: null,
          isEligible: false,
        })
      );
      sinon.assert.calledOnce(computeDistanceStub);
      sinon.assert.calledWith(computeDistanceStub, coords.lat, coords.lon);
    });
    test('should a successful response but with a null network (address out of IDF)', async () => {
      const coords = someOutOfIDFCoordsWithNoNetwork();
      nock(`${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}`)
        .get('/coords')
        .query({
          geojson: false,
          ...coords,
        })
        .reply(200, { ...somePyrisAddressOutOfIDFResponse() });

      const { req, res } = createMocks({
        method: 'GET',
        query: coords,
      });

      await eligibilityStatus(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(
        expect.objectContaining({
          ...coords,
          network: null,
          isEligible: false,
        })
      );
    });
  });
  describe('When address is eligible', () => {
    const testEligibleAddressInIDF = async (
      networkResponseOverride: Partial<NetworkDistance> = {}
    ) => {
      const coords = someCoords();
      const networkResponse = someIDFNetworkLessThanThresholdDistanceResponse({
        latOrigin: coords.lat,
        lonOrigin: coords.lon,
        ...networkResponseOverride,
      });
      nock(`${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}`)
        .get('/coords')
        .query({
          geojson: false,
          ...coords,
        })
        .reply(200, { ...somePyrisAddressResponse() });

      computeDistanceStub.returns(networkResponse.distPointReseau);

      const { req, res } = createMocks({
        method: 'GET',
        query: coords,
      });

      await eligibilityStatus(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(
        expect.objectContaining({
          ...someCoords(),
          network: someNetwork({
            lat: null,
            lon: null,
            distance: networkResponse.distPointReseau,
            filiere: null,
          }),
          isEligible: true,
        })
      );

      sinon.assert.calledOnce(computeDistanceStub);
      sinon.assert.calledWith(computeDistanceStub, coords.lat, coords.lon);
    };

    test(`should return address eligible, when address is in IDF and less then threshold distance (${THRESHOLD}m)`, async () => {
      await testEligibleAddressInIDF();
    });

    test(`should return address eligible, when address is in IDF and network at threshold distance (${THRESHOLD}m)`, async () => {
      await testEligibleAddressInIDF({ distPointReseau: THRESHOLD });
    });

    test(`should return address eligible, when address is in IDF and on network`, async () => {
      await testEligibleAddressInIDF({ distPointReseau: 0 });
    });

    test('should return address eligible, when address is out of IDF and network exist', async () => {
      const coords = someCoords({ lat: 43.50142, lon: -1.45507 });
      const pyrisResponse = someEligiblePyrisAddressOutOfIDFResponse();
      nock(`${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}`)
        .get('/coords')
        .query({
          geojson: false,
          ...coords,
        })
        .reply(200, { ...pyrisResponse });

      const { req, res } = createMocks({
        method: 'GET',
        query: coords,
      });

      await eligibilityStatus(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        ...coords,
        network: someNetwork({
          lat: null,
          lon: null,
          distance: null,
          irisCode: pyrisResponse.complete_code,
          filiere: 'c',
        }),
        isEligible: true,
      });
    });
  });
});
