import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackPostHogEvent } from '@/modules/analytics/client';
import type { CcrtDemandTab } from '@/modules/chaleur-renouvelable/client/CcrtDemandTabs';

import { useCcrtWorkspaceTracking } from './useCcrtWorkspaceTracking';

vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: vi.fn() }));
const context = { departements: ['44'], structure_ccrt: 'CCRT 44' };
const properties = { departement: '44', structure_ccrt: 'CCRT 44' };

describe('CCRT workspace tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('waits for authorized data, maps tabs and counts each consulted group once', () => {
    const { result, rerender } = renderHook(
      ({ loaded, tab }: { loaded: boolean; tab: CcrtDemandTab }) => useCcrtWorkspaceTracking(loaded ? context : undefined, tab, ''),
      { initialProps: { loaded: false, tab: 'to_process' } }
    );
    expect(trackPostHogEvent).not.toHaveBeenCalled();
    rerender({ loaded: true, tab: 'to_process' });
    act(() => result.current.trackTab('closed'));
    rerender({ loaded: true, tab: 'closed' });
    rerender({ loaded: true, tab: 'closed' });
    expect(vi.mocked(trackPostHogEvent).mock.calls).toStrictEqual([
      ['ccrt_demandes:list_viewed', { ...properties, onglet: 'a_traiter' }],
      ['ccrt_demandes:tab_clicked', { ...properties, onglet: 'cloturees' }],
      ['ccrt_demandes:list_viewed', { ...properties, onglet: 'cloturees' }],
    ]);
  });

  it('debounces search without collecting its text or duplicating the explicit button click', () => {
    const { result, rerender } = renderHook(({ search }) => useCcrtWorkspaceTracking(context, 'all', search), {
      initialProps: { search: '' },
    });
    vi.mocked(trackPostHogEvent).mockClear();
    rerender({ search: 'client@exemple.fr' });
    act(() => vi.advanceTimersByTime(400));
    expect(trackPostHogEvent).not.toHaveBeenCalled();
    act(() => result.current.trackSearch());
    act(() => vi.advanceTimersByTime(100));
    expect(trackPostHogEvent).toHaveBeenCalledExactlyOnceWith('ccrt_demandes:search_used', properties);
    rerender({ search: '' });
    rerender({ search: 'client@exemple.fr' });
    act(() => vi.advanceTimersByTime(500));
    expect(trackPostHogEvent).toHaveBeenCalledTimes(2);
  });

  it('tracks applied filters and export with the authorized territory', () => {
    const { result } = renderHook(() => useCcrtWorkspaceTracking(context, 'all', ''));
    vi.mocked(trackPostHogEvent).mockClear();
    act(() => {
      result.current.trackFilter('statut', 'A traiter');
      result.current.trackFilter('date', 'asc');
      result.current.trackExport();
    });
    expect(vi.mocked(trackPostHogEvent).mock.calls).toStrictEqual([
      ['ccrt_demandes:filter_applied', { ...properties, type_filtre: 'statut', valeur: 'A traiter' }],
      ['ccrt_demandes:filter_applied', { ...properties, type_filtre: 'date', valeur: 'asc' }],
      ['ccrt_demandes:export_clicked', properties],
    ]);
  });
});
