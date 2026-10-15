import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CcrtTrackingPlacement } from '@/modules/analytics/posthog.config';
import type { CcrtDemand } from '@/modules/chaleur-renouvelable/types';
import { uuid } from '@/tests/helpers';

import { useCcrtDemandActions } from './useCcrtDemandActions';

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), track: vi.fn() }));
vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: mocks.track }));
vi.mock('@/modules/trpc/client', () => ({
  default: {
    batEnr: { ccrt: { updateDemandeChaleurRenouvelable: { useMutation: () => ({ mutateAsync: mocks.mutate }) } } },
    useUtils: () => ({}),
  },
}));

// Contact actions need only the persisted tracking context and initial status.
const demand = {
  alternative_heating_solutions: ['PAC géothermique'],
  departement_code: '44',
  id: uuid(1),
  status: 'A traiter',
} as CcrtDemand;
const properties = { demande_id: demand.id, departement: '44', solution_1: 'PAC géothermique', structure_ccrt: 'CCRT 44' };

describe('CCRT contact tracking', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(['liste', 'fiche'] as const)(
    'keeps external contacts separate and leaves the status unchanged from %s',
    (placement: CcrtTrackingPlacement) => {
      const { result } = renderHook(() => useCcrtDemandActions('CCRT 44'));
      act(() => result.current.trackContact(demand, 'email', placement));
      act(() => result.current.trackContact(demand, 'phone', placement));
      expect(mocks.track.mock.calls).toStrictEqual([
        ['ccrt_demande:contact_email_clicked', { ...properties, emplacement: placement }],
        ['ccrt_demande:contact_phone_clicked', { ...properties, emplacement: placement }],
      ]);
      expect(mocks.mutate).not.toHaveBeenCalled();
    }
  );

  it('tracks the integrated contact button without counting a mailto and leaves history visits untracked', () => {
    const { result } = renderHook(() => useCcrtDemandActions('CCRT 44'));
    act(() => result.current.openEmail(demand, false, 'fiche'));
    expect(result.current.emailDemand).toStrictEqual(demand);
    expect(mocks.track).toHaveBeenCalledExactlyOnceWith('ccrt_demande:contact_clicked', { ...properties, emplacement: 'fiche' });
    act(() => result.current.openEmail(demand, true, 'fiche'));
    expect(mocks.track).toHaveBeenCalledTimes(1);
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});
