import { FakeHttpClient } from '@utils/fakeHttpClient';
import { Coords } from 'src/types';
import { HeatNetworkService } from '..';
import { ServiceError } from '../errors';

describe('heatNetwork service', () => {
  const baseURL = process.env.NEXT_PUBLIC_HEAT_NETWORK_API_BASE_URL;
  afterEach(() => {
    jest.resetAllMocks();
  });
  test('should correctly fetch data', () => {
    // Given
    const coords: Coords = { lat: 1, lon: 0 };
    const expectedUrl = `${baseURL}?lat=${coords.lat}&lon=${coords.lon}`;
    const service = new HeatNetworkService(FakeHttpClient);
    // When
    service.findByCoords(coords);
    // Then
    expect(FakeHttpClient.get).toHaveBeenNthCalledWith(1, expectedUrl);
  });
  test('should throw an error fetching fails', async () => {
    // Given
    const coords: Coords = { lat: 1, lon: 0 };
    const expectedUrl = `${baseURL}?lat=${coords.lat}&lon=${coords.lon}`;
    const service = new HeatNetworkService(FakeHttpClient);
    FakeHttpClient.get.mockRejectedValue({});
    // When
    await service.findByCoords(coords).catch((resultError) => {
      // Then
      expect(FakeHttpClient.get).toHaveBeenNthCalledWith(1, expectedUrl);
      expect(resultError).rejects;
      expect(resultError).toBeInstanceOf(ServiceError);
    });
  });
});
