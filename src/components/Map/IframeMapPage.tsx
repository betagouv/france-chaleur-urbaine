import { useRouter } from 'next/router';

import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { createMapConfiguration, type MapConfiguration } from '@/components/Map/map-configuration';
import type { MapLegendFeature } from '@/components/Map/map-layers';
import useRouterReady from '@/hooks/useRouterReady';
import { deepMergeObjects } from '@/utils/core';
import type { DeepPartial } from '@/utils/typescript';

import { getIframeMapQueryState } from './iframe-query';

export type IframeMapPageProps = Omit<
  React.ComponentProps<typeof Map>,
  'enabledLegendFeatures' | 'initialMapConfiguration' | 'withLegend'
> & {
  defaultEnabledLegendFeatures?: MapLegendFeature[];
  defaultMapConfiguration: DeepPartial<MapConfiguration>;
  defaultWithLegend?: boolean;
};

const IframeMapPage = ({
  defaultEnabledLegendFeatures,
  defaultMapConfiguration,
  defaultWithLegend = true,
  ...mapProps
}: IframeMapPageProps) => {
  const router = useRouter();
  const isRouterReady = useRouterReady();

  if (!isRouterReady) {
    return null;
  }

  const queryState = getIframeMapQueryState(router.query);
  const initialMapConfiguration = createMapConfiguration(deepMergeObjects(defaultMapConfiguration, queryState.initialMapConfiguration));
  const enabledLegendFeatures = queryState.enabledLegendFeatures ?? defaultEnabledLegendFeatures;
  const withLegend = queryState.withLegend ?? defaultWithLegend;

  return (
    <IframeWrapper>
      <Map
        {...mapProps}
        enabledLegendFeatures={enabledLegendFeatures}
        initialMapConfiguration={initialMapConfiguration}
        withLegend={withLegend}
      />
    </IframeWrapper>
  );
};

export default IframeMapPage;
