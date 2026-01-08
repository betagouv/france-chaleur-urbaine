import { init as initMatomo } from '@socialgouv/matomo-next';
import { atom, useAtom, useAtomValue } from 'jotai';
import { Router } from 'next/router';
import { useEffect, useState } from 'react';

import { clientConfig } from '@/client-config';
import { isDevModeEnabled } from '@/hooks/useDevMode';
import { AnalyticsFormId, type TrackingConfiguration, trackingEvents } from '@/modules/analytics/analytics.config';

export { AnalyticsFormId, type TrackingConfiguration };
type ExtractSuffix<T extends string, S extends string> = T extends `${infer Prefix}${S}` ? Prefix : never;

// globally accessible atom (state)
type MatomoAnalyticsLoadingState = 'pending' | 'loaded' | 'error';

const matomoAnalyticsLoadingStateAtom = atom<MatomoAnalyticsLoadingState>('pending');

const onRouteChange = (url: string) => {
  // see https://developers.google.com/analytics/devguides/collection/ga4/views?client_type=gtag&hl=fr#manually_send_page_view_events
  if (clientConfig.tracking.googleTagIds.length > 0 && typeof window?.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_location: url,
      page_title: document.title,
    });
  }
  // see https://help.hotjar.com/hc/en-us/articles/115011805428-Hotjar-on-Single-Page-Apps
  if (clientConfig.tracking.hotjarId && typeof window?.hj === 'function') {
    window.hj('stateChange', url);
  }
};

// prevent the double init effect due to strict mode
let hookInitialized = false;

/**
 * Register analytics (Matomo only for now).
 * Matomo and Google Analytics page views both have to be triggered manually.
 * Linkedin track page views automatically when loaded.
 */
export const useAnalytics = () => {
  const [matomoAnalyticsLoadingState, setMatomoAnalyticsLoadedState] = useAtom(matomoAnalyticsLoadingStateAtom);

  useEffect(() => {
    if (!hookInitialized && clientConfig.tracking.matomoServerURL && clientConfig.tracking.matomoSiteId) {
      hookInitialized = true;

      initMatomo({
        disableCookies: true,
        excludeUrlsPatterns: [/\/carte\?.+/], // do not track query params for this URL
        onScriptLoadingError() {
          setMatomoAnalyticsLoadedState('error');
        },
        siteId: clientConfig.tracking.matomoSiteId,
        url: clientConfig.tracking.matomoServerURL,
      });

      // handle the case where matomo does not respond
      const errorStateTimeout = setTimeout(() => {
        if (matomoAnalyticsLoadingState === 'pending') {
          setMatomoAnalyticsLoadedState('error');
        }
      }, 2000);

      // track the async deferred loading of the script by matomo-next
      // matomoAsyncInit is a specific callback used by Matomo
      // matomoAbTestingAsyncInit is a specific callback used by Matomo AB Testing framework
      window.matomoAbTestingAsyncInit = () => {
        setMatomoAnalyticsLoadedState('loaded');
        clearTimeout(errorStateTimeout);
      };
    }
  }, []);

  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);
  useEffect(() => {
    if (!analyticsLoaded) {
      return;
    }
    Router.events.on('routeChangeComplete', onRouteChange);
    return () => {
      Router.events.off('routeChangeComplete', onRouteChange);
    };
  }, [analyticsLoaded]);

  if (typeof window === 'object') {
    document.addEventListener(
      'multiplegtag_loaded',
      () => {
        setAnalyticsLoaded(true);
      },
      {
        once: true,
      }
    );
    document.addEventListener(
      'hotjar_loaded',
      () => {
        setAnalyticsLoaded(true);
      },
      {
        once: true,
      }
    );
  }
};

/*
Workflow du formulaire de test d'adresse :
- quand on soumet le formulaire :
  - Formulaire de test - Envoi
  - Formulaire de test - Adresse Inéligible
- quand on soumet le second formulaire de contact :
  - Formulaire de contact éligible - Envoi
*/

export type TrackingEvent = keyof typeof trackingEvents;
export type LegendTrackingEvent = ExtractSuffix<TrackingEvent, '|Active'>;
/**
 * Track an custom event.
 *
 * eventPayload is only use for Matomo at the moment.
 */
export const trackEvent = (eventKey: TrackingEvent, ...eventPayload: any[]) => {
  if (isDevModeEnabled()) {
    // eslint-disable-next-line no-console
    console.log('trackEvent', eventKey, eventPayload, trackingEvents[eventKey]);
  }
  const configuration = trackingEvents[eventKey];
  if (!configuration) {
    console.error('invalid tracking key', eventKey);
    return;
  }
  performTracking(configuration, eventPayload);
};

// augment window type with tracking helpers
declare let window: Window & {
  gtag: (...args: any[]) => void; // google
  lintrk: (action: string, param: any) => void; // linkedin
  _paq: [any]; // matomo
  Matomo: any; // matomo
  matomoAbTestingAsyncInit: any; // matomo
  hj: (...args: any[]) => void; // hotjar
};

const performTracking = (trackingConfig: TrackingConfiguration, eventPayload?: any[]) => {
  if (trackingConfig.google && typeof window?.gtag === 'function') {
    clientConfig.tracking.googleTagIds.forEach((googleTagId) => {
      window.gtag('event', 'conversion', {
        send_to: `${googleTagId}/${trackingConfig.google}`,
      });
    });
  }
  if (trackingConfig.linkedin && typeof window?.lintrk === 'function') {
    window.lintrk('track', { conversion_id: trackingConfig.linkedin });
  }
  if (trackingConfig.matomo && typeof window?._paq?.push === 'function') {
    window._paq.push(['trackEvent', ...trackingConfig.matomo, ...(eventPayload ?? [])]);
  }
};

type MatomoABTestingExperiment = {
  name: string;
  percentage: number;
  includedTargets: readonly any[];
  excludedTargets: readonly any[];
  variations: ReadonlyArray<{
    name: string;
    percentage?: number;
    activate: () => void;
  }>;
};

const emptyActivateMethod = () => {
  // code changes are executed using the variation name, not this callback method
};

const matomoABTestingExperiments = [
  // placeholder to make types work
  {
    excludedTargets: [],
    includedTargets: [],
    name: '_internal',
    percentage: 100,
    variations: [
      {
        activate: emptyActivateMethod,
        name: 'original',
      },
    ],
  },
  // add the experiments below
] as const satisfies readonly MatomoABTestingExperiment[];

type MatomoABTestingExperimentName = (typeof matomoABTestingExperiments)[number]['name'];

export type MatomoABTestingExperimentVariations<Name extends MatomoABTestingExperimentName> = Extract<
  (typeof matomoABTestingExperiments)[number],
  { name: Name }
>['variations'][number]['name'];

type MatomoAbTestingExperimentOptions = {
  enable?: boolean;
};

const defaultOptions: MatomoAbTestingExperimentOptions = {
  enable: true,
};

/**
 * Use an AB Testing Experiment a retrieve a variation name.
 *
 * Usage:
 *
 *   ```tsx
 *   ...
 *   const { ready, variation } = useMatomoAbTestingExperiment(
 *     'TitreDynamiquePageCopro'
 *   );
 *   if (!ready) {
 *     return null;
 *   }
 *
 *   return (
 *     <Button>{variation === 'NouveauLabel' ? 'nouveau label' : 'label original'}</Button>
 *   )
 *   ```
 */
export const useMatomoAbTestingExperiment = <Name extends MatomoABTestingExperimentName>(
  experimentName: MatomoABTestingExperimentName,
  options: MatomoAbTestingExperimentOptions = defaultOptions
):
  | {
      ready: boolean;
      variation: MatomoABTestingExperimentVariations<Name>;
    }
  | {
      ready: boolean;
      variation: undefined;
    } => {
  const matomoAnalyticsLoadingState = useAtomValue(matomoAnalyticsLoadingStateAtom);
  if (matomoAnalyticsLoadingState === 'pending') {
    return { ready: false, variation: undefined };
  }

  // if the script could not be loaded or the experiment is disabled, we fallback to the original variation
  if (matomoAnalyticsLoadingState === 'error' || !options.enable) {
    return { ready: true, variation: 'original' };
  }

  const experiment = new window.Matomo.AbTesting.Experiment(matomoABTestingExperiments.find((e) => e.name === experimentName));

  return { ready: true, variation: experiment.getActivatedVariationName() };
};
