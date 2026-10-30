import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChoixChauffageResults } from './useChoixChauffageResults';

const mocks = vi.hoisted(() => ({
  address: '14 Rue Lecourbe 75015 Paris',
  averageHousingArea: null as number | null,
  buildingAddress: '16 Rue Lecourbe',
  constructionId: 'building-1',
  hasConstructionId: true,
  hasDifferentBuilding: false,
  housingCount: null as number | null,
  isAddressMissing: false,
  isEligibilityLoading: false,
  isPrefillAvailable: false,
  isPrefillLoading: false,
  queryPrefill: vi.fn(),
  recommendation: 'PAC géothermique',
  resolveBuildingAddress: vi.fn(),
  setGeoAddress: vi.fn(),
  setParams: vi.fn(),
  shouldSelectBuilding: false,
  track: vi.fn(),
}));
vi.mock('../building-address', () => ({ getBuildingAddress: mocks.resolveBuildingAddress }));
vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: mocks.track }));
vi.mock('@/components/ComparateurPublicodes/useSimulatorEngine', () => ({ default: () => ({}) }));
vi.mock('@/hooks/useContactFormFCU', () => ({ default: () => ({}) }));
vi.mock('./useRemoveHashOnScroll', () => ({ useRemoveHashOnScroll: () => {} }));
vi.mock('./useChoixChauffageQueryParams', () => ({
  useChoixChauffageQueryParams: () => ({
    params: {
      adresse: mocks.address,
      constructionId: mocks.hasConstructionId ? mocks.constructionId : null,
      nbLogements: mocks.housingCount,
      surfaceMoyenne: mocks.averageHousingArea,
    },
    setParams: mocks.setParams,
  }),
}));
vi.mock('./useAddressEligibility', () => ({
  useAddressEligibility: () => ({
    batEnrBatiments: [],
    codeDepartement: '75',
    geoAddress: mocks.isAddressMissing ? undefined : { properties: { label: mocks.address } },
    isEligibilityLoading: mocks.isEligibilityLoading,
    selectedBatEnrBatiment: {
      adresse: mocks.buildingAddress,
      batiment_construction_id: mocks.hasDifferentBuilding ? 'previous-building' : mocks.constructionId,
    },
    setGeoAddress: mocks.setGeoAddress,
    shouldSelectBatEnrBatiment: mocks.shouldSelectBuilding,
  }),
}));

beforeEach(() => {
  mocks.hasConstructionId = true;
  mocks.hasDifferentBuilding = false;
  mocks.housingCount = null;
  mocks.averageHousingArea = null;
  mocks.isPrefillAvailable = false;
});

describe('selected building address correction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveBuildingAddress.mockReset();
    mocks.address = '14 Rue Lecourbe 75015 Paris';
    mocks.constructionId = 'building-1';
    mocks.isAddressMissing = false;
    mocks.shouldSelectBuilding = false;
  });

  it('updates the address and BAN coordinates while preserving the confirmed building', async () => {
    const address = { geometry: { coordinates: [2.31, 48.81] }, properties: { label: '16 Rue Lecourbe 75015 Paris' } };
    mocks.resolveBuildingAddress.mockResolvedValue(address);
    renderHook(() => useChoixChauffageResults());

    await waitFor(() =>
      expect(mocks.setParams).toHaveBeenCalledExactlyOnceWith({ adresse: address.properties.label, constructionId: 'building-1' })
    );
    expect(mocks.setGeoAddress).toHaveBeenCalledExactlyOnceWith(address);
  });

  it('keeps the entered address when no reliable address is found', async () => {
    mocks.resolveBuildingAddress.mockResolvedValue(undefined);
    renderHook(() => useChoixChauffageResults());

    await waitFor(() => expect(mocks.resolveBuildingAddress).toHaveBeenCalled());
    expect(mocks.setParams).not.toHaveBeenCalled();
    expect(mocks.setGeoAddress).not.toHaveBeenCalled();
  });

  it('waits until the building is confirmed', () => {
    mocks.shouldSelectBuilding = true;
    renderHook(() => useChoixChauffageResults());
    expect(mocks.resolveBuildingAddress).not.toHaveBeenCalled();
  });

  it('ignores a correction if the user changes the address before the lookup finishes', async () => {
    let finishLookup = (_address: unknown) => {};
    mocks.resolveBuildingAddress.mockReturnValueOnce(
      new Promise((resolve) => {
        finishLookup = resolve;
      })
    );
    const { rerender } = renderHook(() => useChoixChauffageResults());
    mocks.address = 'Nouvelle adresse';
    rerender();
    await act(async () => finishLookup({ properties: { label: '16 Rue Lecourbe 75015 Paris' } }));

    expect(mocks.setParams).not.toHaveBeenCalled();
    expect(mocks.setGeoAddress).not.toHaveBeenCalled();
  });
});
vi.mock('../simulation-situation', () => ({ buildSimulationSituation: () => ({}) }));
vi.mock('../modesChauffageData', () => ({ getIncompatibleSolutionRows: () => [], getModesDeChauffage: () => [] }));
vi.mock('../heatingModeCosts', () => ({
  getHeatingModeCosts: () => ({ modesEnriched: [{ id: mocks.recommendation, label: mocks.recommendation }] }),
  setPublicodesSituation: () => {},
}));
vi.mock('@/modules/trpc/client', () => ({
  default: {
    batEnr: {
      getSimulationPrefill: {
        useQuery: (input: unknown, options: unknown) => {
          mocks.queryPrefill(input, options);
          return {
            data: mocks.isPrefillAvailable ? { nbLogements: 24, surfaceMoyenne: 98 } : undefined,
            isLoading: mocks.isPrefillLoading,
          };
        },
      },
    },
    useUtils: () => ({}),
  },
}));

describe('selected building simulation prefill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveBuildingAddress.mockResolvedValue(undefined);
    mocks.address = '14 Rue Lecourbe 75015 Paris';
    mocks.constructionId = 'building-1';
    mocks.isAddressMissing = false;
    mocks.isEligibilityLoading = false;
    mocks.isPrefillLoading = false;
    mocks.shouldSelectBuilding = false;
    mocks.isPrefillAvailable = true;
  });

  it.each(['shouldSelectBuilding', 'isEligibilityLoading', 'isAddressMissing', 'hasDifferentBuilding'] as const)(
    'does not apply cached building data while %s is unresolved',
    (pendingState) => {
      mocks[pendingState] = true;
      const { rerender } = renderHook(() => useChoixChauffageResults());

      expect(mocks.queryPrefill).toHaveBeenLastCalledWith({ batiment_construction_id: expect.any(String) }, { enabled: false });
      expect(mocks.setParams).not.toHaveBeenCalled();

      mocks[pendingState] = false;
      rerender();

      expect(mocks.queryPrefill).toHaveBeenLastCalledWith({ batiment_construction_id: 'building-1' }, { enabled: true });
      expect(mocks.setParams).toHaveBeenCalledExactlyOnceWith({ nbLogements: 24, surfaceMoyenne: 98 });
    }
  );

  it('prefills a single automatically selected building without requiring a construction id in the URL', () => {
    mocks.hasConstructionId = false;
    renderHook(() => useChoixChauffageResults());

    expect(mocks.setParams).toHaveBeenCalledExactlyOnceWith({ nbLogements: 24, surfaceMoyenne: 98 });
  });

  it('preserves housing count and area already entered by the user or supplied in the URL', () => {
    mocks.housingCount = 42;
    mocks.averageHousingArea = 80;
    renderHook(() => useChoixChauffageResults());

    expect(mocks.setParams).not.toHaveBeenCalled();
  });
});

describe('recommended solution tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.address = '14 Rue Lecourbe 75015 Paris';
    mocks.constructionId = 'building-1';
    mocks.recommendation = 'PAC géothermique';
    mocks.isAddressMissing = false;
    mocks.isEligibilityLoading = false;
    mocks.isPrefillLoading = false;
    mocks.shouldSelectBuilding = false;
  });

  it('tracks once across six recalculations and Strict Mode effect replays', () => {
    const { rerender } = renderHook(() => useChoixChauffageResults(), { wrapper: StrictMode });
    Array.from({ length: 5 }).forEach(() => rerender());

    expect(mocks.track).toHaveBeenCalledExactlyOnceWith('fcr_results:recommended_solution_displayed', {
      solution_type: 'PAC géothermique',
    });
  });

  it.each(['isAddressMissing', 'isEligibilityLoading', 'isPrefillLoading', 'shouldSelectBuilding'] as const)(
    'waits until %s is resolved before tracking the recommendation',
    (pendingState) => {
      mocks[pendingState] = true;
      const { rerender } = renderHook(() => useChoixChauffageResults());
      expect(mocks.track).not.toHaveBeenCalled();

      mocks[pendingState] = false;
      rerender();

      expect(mocks.track).toHaveBeenCalledExactlyOnceWith('fcr_results:recommended_solution_displayed', {
        solution_type: 'PAC géothermique',
      });
    }
  );

  it.each(['address', 'constructionId', 'recommendation'] as const)('tracks a new result when %s changes', (changedField) => {
    const { rerender } = renderHook(() => useChoixChauffageResults());
    mocks[changedField] = 'Nouvelle valeur';
    rerender();
    rerender();

    expect(mocks.track.mock.calls).toStrictEqual([
      ['fcr_results:recommended_solution_displayed', { solution_type: 'PAC géothermique' }],
      ['fcr_results:recommended_solution_displayed', { solution_type: mocks.recommendation }],
    ]);
  });
});
