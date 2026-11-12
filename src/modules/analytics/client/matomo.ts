import { trackPagesRouter } from '@socialgouv/matomo-next';
import { atom, useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { clientConfig } from '@/client-config';
import { isDevModeEnabled } from '@/hooks/useDevMode';

import { AnalyticsFormId, type TrackingConfiguration, trackingEvents } from '../analytics.config';

export { AnalyticsFormId, type TrackingConfiguration };

type ExtractSuffix<T extends string, S extends string> = T extends `${infer Prefix}${S}` ? Prefix : never;

// globally accessible atom (state)
type MatomoAnalyticsLoadingState = 'pending' | 'loaded' | 'error';

const matomoAnalyticsLoadingStateAtom = atom<MatomoAnalyticsLoadingState>('pending');

// prevent the double init effect due to strict mode
let hookInitialized = false;

/**
 * Register analytics (Matomo only for now).
 */
export const useAnalytics = () => {
  const [matomoAnalyticsLoadingState, setMatomoAnalyticsLoadedState] = useAtom(matomoAnalyticsLoadingStateAtom);

  useEffect(() => {
    if (!hookInitialized && clientConfig.tracking.matomoServerURL && clientConfig.tracking.matomoSiteId) {
      hookInitialized = true;

      trackPagesRouter({
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
  _paq: [any]; // matomo
  Matomo: any; // matomo
  matomoAbTestingAsyncInit: any; // matomo
};

const performTracking = (trackingConfig: TrackingConfiguration, eventPayload?: any[]) => {
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
