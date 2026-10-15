import { useEffect, useRef } from 'react';

import { trackPostHogEvent } from '@/modules/analytics/client';
import type { PostHogEventMap } from '@/modules/analytics/posthog.config';

import { type CcrtDemandTab, ccrtTrackingTabs } from '../CcrtDemandTabs';

type CcrtWorkspaceTrackingContext = { departements: string[]; structure_ccrt: string | null };

/**
 * Tracks workspace navigation and settled searches without collecting search text.
 */
export function useCcrtWorkspaceTracking(context: CcrtWorkspaceTrackingContext | undefined, tab: CcrtDemandTab, search: string) {
  const trackedTab = useRef<string | null>(null);
  const trackedSearch = useRef('');
  const properties = { departement: context?.departements.join(',') || null, structure_ccrt: context?.structure_ccrt ?? null };
  const trackSearch = () => {
    if (context && search.trim() && trackedSearch.current !== search) {
      trackPostHogEvent('ccrt_demandes:search_used', properties);
      trackedSearch.current = search;
    }
  };
  // Count a settled live search once; pressing the search button can record it immediately.
  useEffect(() => {
    if (!search.trim()) {
      trackedSearch.current = '';
    }
    const timeout = window.setTimeout(trackSearch, 500);
    return () => window.clearTimeout(timeout);
  }, [search, context]);
  // Wait for authorized data before counting the consulted group.
  useEffect(() => {
    if (context && trackedTab.current !== tab) {
      trackPostHogEvent('ccrt_demandes:list_viewed', { ...properties, onglet: ccrtTrackingTabs[tab] });
      trackedTab.current = tab;
    }
  }, [tab, context]);
  return {
    trackExport: () => {
      if (context) {
        trackPostHogEvent('ccrt_demandes:export_clicked', properties);
      }
    },
    trackFilter: (type: PostHogEventMap['ccrt_demandes:filter_applied']['type_filtre'], value: string) => {
      if (context) {
        trackPostHogEvent('ccrt_demandes:filter_applied', { ...properties, type_filtre: type, valeur: value });
      }
    },
    trackSearch,
    trackTab: (nextTab: CcrtDemandTab) => {
      if (context) {
        trackPostHogEvent('ccrt_demandes:tab_clicked', { ...properties, onglet: ccrtTrackingTabs[nextTab] });
      }
    },
  };
}
