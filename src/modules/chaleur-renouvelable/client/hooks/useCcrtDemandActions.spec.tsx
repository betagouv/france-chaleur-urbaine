import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CcrtTrackingPlacement } from '@/modules/analytics/posthog.config';
import type { CcrtDemand } from '@/modules/chaleur-renouvelable/types';
import { uuid } from '@/tests/helpers';

import { useCcrtDemandActions } from './useCcrtDemandActions';

const mocks = vi.hoisted(() => ({ invalidate: vi.fn(), mutate: vi.fn(), setAdmin: vi.fn(), setCcrt: vi.fn(), track: vi.fn() }));
vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: mocks.track }));
vi.mock('@/modules/trpc/client', () => ({
  default: {
    batEnr: { ccrt: { updateDemandeChaleurRenouvelable: { useMutation: () => ({ mutateAsync: mocks.mutate }) } } },
    useUtils: () => ({
      batEnr: {
        admin: { listDemandesChaleurRenouvelable: { invalidate: mocks.invalidate, setData: mocks.setAdmin } },
        ccrt: {
          getFollowUp: { invalidate: mocks.invalidate },
          listDemandesChaleurRenouvelable: { invalidate: mocks.invalidate, setData: mocks.setCcrt },
        },
      },
    }),
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

  it('refreshes both admin and CCRT summaries with the status returned by the server', async () => {
    mocks.mutate.mockResolvedValue({ id: demand.id, project_state: 'En réflexion', status: 'Recontacté pour premier échange' });
    const { result } = renderHook(() => useCcrtDemandActions('CCRT 44'));
    await act(() => result.current.updateDemand(demand, { status: 'Recontacté pour premier échange' }));
    const initialData = { count: 1, items: [demand] };
    const expected = { count: 1, items: [{ ...demand, project_state: 'En réflexion', status: 'Recontacté pour premier échange' }] };
    expect(mocks.setAdmin.mock.calls[0][1](initialData)).toStrictEqual(expected);
    expect(mocks.setCcrt.mock.calls[0][1](initialData)).toStrictEqual(expected);
    expect(mocks.invalidate).toHaveBeenCalledTimes(3);
  });

  it('tracks the integrated contact button without counting a mailto and leaves history visits untracked', () => {
    const { result } = renderHook(() => useCcrtDemandActions('CCRT 44'));
    act(() => result.current.openEmail(demand, false, 'fiche'));
    expect(result.current.emailDemand).toStrictEqual(demand);
    expect(mocks.track).toHaveBeenCalledExactlyOnceWith('ccrt_demande:contact_clicked', { ...properties, emplacement: 'fiche' });
    act(() => result.current.openEmail(demand, true, 'fiche'));
    expect(mocks.track).toHaveBeenCalledTimes(1);
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('selects the historical email and clears that selection when opening a new message', () => {
    const { result } = renderHook(() => useCcrtDemandActions('CCRT 44'));
    act(() => result.current.openEmail(demand, true, 'fiche', uuid(2)));

    expect(result.current.selectedEmailId).toStrictEqual(uuid(2));
    expect(result.current.showEmailHistory).toStrictEqual(true);
    expect(mocks.track).not.toHaveBeenCalled();

    act(() => result.current.closeEmail());
    act(() => result.current.openEmail(demand));

    expect(result.current.selectedEmailId).toStrictEqual(undefined);
    expect(result.current.showEmailHistory).toStrictEqual(false);
  });
});
