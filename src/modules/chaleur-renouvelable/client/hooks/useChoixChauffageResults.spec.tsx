import { renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChoixChauffageResults } from './useChoixChauffageResults';

const mocks = vi.hoisted(() => ({
  address: '14 Rue Lecourbe 75015 Paris',
  constructionId: 'building-1',
  isAddressMissing: false,
  isEligibilityLoading: false,
  isPrefillLoading: false,
  recommendation: 'PAC géothermique',
  shouldSelectBuilding: false,
  track: vi.fn(),
}));
vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: mocks.track }));
vi.mock('@/components/ComparateurPublicodes/useSimulatorEngine', () => ({ default: () => ({}) }));
vi.mock('@/hooks/useContactFormFCU', () => ({ default: () => ({}) }));
vi.mock('./useRemoveHashOnScroll', () => ({ useRemoveHashOnScroll: () => {} }));
vi.mock('./useChoixChauffageQueryParams', () => ({
  useChoixChauffageQueryParams: () => ({ params: { adresse: mocks.address, constructionId: mocks.constructionId } }),
}));
vi.mock('./useAddressEligibility', () => ({
  useAddressEligibility: () => ({
    batEnrBatiments: [],
    codeDepartement: '75',
    geoAddress: mocks.isAddressMissing ? undefined : { properties: { label: mocks.address } },
    isEligibilityLoading: mocks.isEligibilityLoading,
    selectedBatEnrBatiment: { batiment_construction_id: mocks.constructionId },
    shouldSelectBatEnrBatiment: mocks.shouldSelectBuilding,
  }),
}));
vi.mock('../simulation-situation', () => ({ buildSimulationSituation: () => ({}) }));
vi.mock('../modesChauffageData', () => ({ getIncompatibleSolutionRows: () => [], getModesDeChauffage: () => [] }));
vi.mock('../heatingModeCosts', () => ({
  getHeatingModeCosts: () => ({ modesEnriched: [{ id: mocks.recommendation, label: mocks.recommendation }] }),
  setPublicodesSituation: () => {},
}));
vi.mock('@/modules/trpc/client', () => ({
  default: {
    batEnr: { getSimulationPrefill: { useQuery: () => ({ isLoading: mocks.isPrefillLoading }) } },
    useUtils: () => ({}),
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
