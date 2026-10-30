import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSimulationStartRoute, useStartSimulation } from '@/modules/simulation-tracking/client/useSimulationTracking';

import { useChoixChauffageResults } from './useChoixChauffageResults';

const mocks = vi.hoisted(() => ({
  address: '14 Rue Lecourbe 75015 Paris',
  buildingAddress: '16 Rue Lecourbe',
  constructionId: 'building-1',
  isAddressMissing: false,
  isEligibilityLoading: false,
  isPrefillLoading: false,
  recommendation: 'PAC géothermique',
  resolveBuildingAddress: vi.fn(),
  setGeoAddress: vi.fn(),
  setParams: vi.fn(),
  shouldSelectBuilding: false,
  simulationCreate: vi.fn().mockResolvedValue(undefined),
  simulationUpdate: vi.fn().mockResolvedValue(undefined),
  track: vi.fn(),
}));
vi.mock('../building-address', () => ({ getBuildingAddress: mocks.resolveBuildingAddress }));
vi.mock('next/router', () => ({ useRouter: () => ({ isReady: true, pathname: '/chaleur-renouvelable/resultat' }) }));
vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: mocks.track }));
vi.mock('@/components/ComparateurPublicodes/useSimulatorEngine', () => ({ default: () => ({}) }));
vi.mock('@/hooks/useContactFormFCU', () => ({ default: () => ({}) }));
vi.mock('./useRemoveHashOnScroll', () => ({ useRemoveHashOnScroll: () => {} }));
vi.mock('./useChoixChauffageQueryParams', () => ({
  useChoixChauffageQueryParams: () => ({
    params: { adresse: mocks.address, constructionId: mocks.constructionId },
    setParams: mocks.setParams,
  }),
}));
vi.mock('./useAddressEligibility', () => ({
  useAddressEligibility: () => ({
    batEnrBatiments: [],
    codeDepartement: '75',
    geoAddress: mocks.isAddressMissing ? undefined : { properties: { label: mocks.address } },
    isAddressNotFound: mocks.isAddressMissing,
    isCcrtCovered: false,
    isEligibilityLoading: mocks.isEligibilityLoading,
    selectedBatEnrBatiment: { adresse: mocks.buildingAddress, batiment_construction_id: mocks.constructionId },
    setGeoAddress: mocks.setGeoAddress,
    shouldSelectBatEnrBatiment: mocks.shouldSelectBuilding,
  }),
}));

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
vi.mock('../simulation-situation', () => ({ buildSimulationSituation: () => ({ hasAlreadyReceivedHeatNetworkRefusal: false }) }));
vi.mock('../modesChauffageData', () => ({ getIncompatibleSolutionRows: () => [], getModesDeChauffage: () => [] }));
vi.mock('../heatingModeCosts', () => ({
  getHeatingModeCosts: () => ({ modesEnriched: [{ id: mocks.recommendation, label: mocks.recommendation }] }),
  setPublicodesSituation: () => {},
}));
vi.mock('@/modules/trpc/client', () => ({
  default: {
    batEnr: { getSimulationPrefill: { useQuery: () => ({ isLoading: mocks.isPrefillLoading }) } },
    useUtils: () => ({
      client: { simulationTracking: { create: { mutate: mocks.simulationCreate }, update: { mutate: mocks.simulationUpdate } } },
    }),
  },
}));

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

describe('simulation tracking', () => {
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

  const expectedSnapshot = {
    address: '14 Rue Lecourbe 75015 Paris',
    addressResolved: true,
    batimentConstructionId: 'building-1',
    ccrtDemandAvailable: false,
    communeCode: null,
    departementCode: '75',
    heatNetworkAvailable: false,
    housingType: 'immeuble_chauffage_collectif',
    outdoorSpace: null,
    radiatorType: null,
    recommendedSolution: 'PAC géothermique',
    refusalAlreadyKnown: false,
  };

  it('creates the simulation once with the start page of a direct arrival, across rerenders and Strict Mode', () => {
    const { rerender } = renderHook(() => useChoixChauffageResults(), { wrapper: StrictMode });
    Array.from({ length: 3 }).forEach(() => rerender());

    expect(mocks.simulationCreate).toHaveBeenCalledExactlyOnceWith({
      ...expectedSnapshot,
      host: null,
      id: expect.any(String),
      page: '/',
      previousSimulationId: null,
      route: '/chaleur-renouvelable/resultat',
      source: null,
    });
    expect(mocks.simulationUpdate).not.toHaveBeenCalled();
  });

  describe('start page handed over by the form', () => {
    afterEach(() => window.history.replaceState({}, '', '/'));

    it('is used by the next results page only, then a direct arrival is counted', () => {
      window.history.replaceState({}, '', '/?source=iframe-test');
      const startSimulation = renderHook(() => useStartSimulation());
      act(() => startSimulation.result.current());
      window.history.replaceState({}, '', '/chaleur-renouvelable/resultat');

      const firstResults = renderHook(() => useChoixChauffageResults());
      firstResults.unmount();
      renderHook(() => useChoixChauffageResults());

      expect(mocks.simulationCreate.mock.calls.map(([input]) => [input.page, input.source])).toStrictEqual([
        ['/', 'iframe-test'],
        ['/chaleur-renouvelable/resultat', null],
      ]);
    });

    it('exposes the start route while the results page is mounted, for its back link', () => {
      const startSimulation = renderHook(() => useStartSimulation());
      act(() => startSimulation.result.current());
      const results = renderHook(() => useChoixChauffageResults());
      const startRoute = renderHook(() => useSimulationStartRoute());
      expect(startRoute.result.current).toStrictEqual('/chaleur-renouvelable/resultat');

      results.unmount();
      startRoute.rerender();
      expect(startRoute.result.current).toBeNull();
    });
  });

  it('creates an unresolved-address simulation when the BAN finds no house number', () => {
    mocks.isAddressMissing = true;
    renderHook(() => useChoixChauffageResults());

    expect(mocks.simulationCreate).toHaveBeenCalledTimes(1);
    expect(mocks.simulationCreate.mock.calls[0][0]).toMatchObject({ address: '14 Rue Lecourbe 75015 Paris', addressResolved: false });
  });

  it.each(['isEligibilityLoading', 'isPrefillLoading', 'shouldSelectBuilding'] as const)(
    'waits until %s is resolved before creating',
    (pendingState) => {
      mocks[pendingState] = true;
      const { rerender } = renderHook(() => useChoixChauffageResults());
      expect(mocks.simulationCreate).not.toHaveBeenCalled();

      mocks[pendingState] = false;
      rerender();

      expect(mocks.simulationCreate).toHaveBeenCalledTimes(1);
    }
  );

  it('updates the same simulation when the shown recommendation changes', () => {
    const { rerender } = renderHook(() => useChoixChauffageResults());
    mocks.recommendation = 'Chaudière biomasse';
    rerender();
    rerender();

    expect(mocks.simulationCreate).toHaveBeenCalledTimes(1);
    const simulationId = mocks.simulationCreate.mock.calls[0][0].id;
    expect(mocks.simulationUpdate.mock.calls).toStrictEqual([
      [{ ...expectedSnapshot, id: simulationId, recommendedSolution: 'Chaudière biomasse' }],
    ]);
  });

  it('keeps the same simulation, without any update, when the typed address is corrected to the confirmed building', () => {
    const { rerender } = renderHook(() => useChoixChauffageResults());
    mocks.address = '16 Rue Lecourbe 75015 Paris';
    rerender();

    expect(mocks.simulationCreate).toHaveBeenCalledTimes(1);
    expect(mocks.simulationUpdate).not.toHaveBeenCalled();
  });

  it('starts a new simulation chained to the previous one when the building changes, with the same start page', () => {
    const { rerender, result } = renderHook(() => useChoixChauffageResults());
    const firstSimulationId = result.current.simulationId;
    mocks.address = '20 Avenue de Ségur 75007 Paris';
    mocks.constructionId = 'building-2';
    rerender();

    expect(result.current.simulationId).not.toStrictEqual(firstSimulationId);
    expect(
      mocks.simulationCreate.mock.calls.map(([input]) => [input.id, input.previousSimulationId, input.address, input.page])
    ).toStrictEqual([
      [firstSimulationId, null, '14 Rue Lecourbe 75015 Paris', '/'],
      [result.current.simulationId, firstSimulationId, '20 Avenue de Ségur 75007 Paris', '/'],
    ]);
    expect(mocks.simulationUpdate).not.toHaveBeenCalled();
  });
});
