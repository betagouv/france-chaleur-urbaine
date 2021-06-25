import { act } from '@testing-library/react-hooks';
import { customRenderHook } from '@utils/contextProvider';
import {
  someNearHeatNetwork,
  someRemoteHeatNetwork,
} from '@utils/fixtures/heatNetwork';
import { Coords } from 'src/types';
import { useHeatNetworks } from '../useHeatNetworks';

describe('useBan Hook', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('check eligibility (fetching ok)', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });
    test('should valid eligibility when some heatNetwork is near given address', async () => {
      // Given
      const coords: Coords = { lat: 1, lon: 0 };
      const fakeHeatNetwork = someNearHeatNetwork();
      const heatNetworkServiceMock = {
        findByCoords: jest.fn().mockResolvedValue(fakeHeatNetwork),
      };
      const { result, waitForNextUpdate } = customRenderHook(
        () => useHeatNetworks(),
        {
          heatNetworkService: heatNetworkServiceMock,
        }
      );

      act(() => {
        // When
        result.current.checkEligibility(coords);
      });
      // Then
      await waitForNextUpdate();
      expect(result.current.isEligible).toEqual(true);
      expect(result.current.status).toEqual('success');
    });
    test('should reject eligibility when some heatNetwork is too far from given address', async () => {
      // Given
      const coords: Coords = { lat: 1, lon: 2.6 };
      const fakeHeatNetwork = someRemoteHeatNetwork();
      const heatNetworkServiceMock = {
        findByCoords: jest.fn().mockResolvedValue(fakeHeatNetwork),
      };
      const { result, waitForNextUpdate } = customRenderHook(
        () => useHeatNetworks(),
        {
          heatNetworkService: heatNetworkServiceMock,
        }
      );

      act(() => {
        // When
        result.current.checkEligibility(coords);
      });
      // Then
      await waitForNextUpdate();
      expect(result.current.isEligible).toEqual(false);
      expect(result.current.status).toEqual('success');
    });
  });

  test('should throw an error when fetching fails', async () => {
    // Given
    const coords: Coords = { lat: 1, lon: 0 };
    const heatNetworkServiceMock = {
      findByCoords: jest.fn().mockRejectedValue({}),
    };
    const { result, waitForNextUpdate } = customRenderHook(
      () => useHeatNetworks(),
      {
        heatNetworkService: heatNetworkServiceMock,
      }
    );
    act(() => {
      // When
      result.current.checkEligibility(coords);
    });
    // Then
    expect(result.current.status).toEqual('loading');
    await waitForNextUpdate();
    expect(result.current.isEligible).toEqual(false);
    expect(result.current.status).toEqual('error');
  });
});
