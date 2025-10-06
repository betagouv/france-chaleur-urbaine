import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import React, { createContext, useContext } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

import {
  defaultMapConfiguration,
  type MapConfiguration,
  type MapConfigurationProperty,
  type MaybeEmptyMapConfiguration,
} from '@/components/Map/map-configuration';
import { isDevModeEnabled } from '@/hooks/useDevMode';
import useReseauxDeChaleurFilters from '@/hooks/useReseauxDeChaleurFilters';
import { deepMergeObjects, isDefined, setProperty, toggleBoolean } from '@/utils/core';
import type { Interval } from '@/utils/interval';

type UseFCUMapResult = {
  setMapRef: React.Dispatch<React.SetStateAction<MapRef | null>>;
  setMapDraw: React.Dispatch<React.SetStateAction<MapboxDraw | null>>;
  setIsDrawing: React.Dispatch<React.SetStateAction<boolean>>;
  setMapLayersLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  setMapConfiguration: React.Dispatch<React.SetStateAction<MapConfiguration>>;
  mapConfiguration: MapConfiguration;
  toggleLayer: (property: MapConfigurationProperty<boolean>) => void;
  updateProperty: <T>(property: MapConfigurationProperty<T>, value: T) => void;
  updateScaleInterval: (property: MapConfigurationProperty<Interval>) => (interval: Interval) => void;
} & ReturnType<typeof useReseauxDeChaleurFilters> &
  (
    | { mapLoaded: false; mapLayersLoaded: false; mapRef: null; mapDraw: null; isDrawing: false }
    | {
        mapLoaded: true;
        mapLayersLoaded: boolean;
        mapRef: MapRef;
        mapDraw: MapboxDraw;
        isDrawing: boolean;
      }
  );

const MapContext = createContext<UseFCUMapResult | undefined>(undefined);

/**
 * This context provider waits for the map to be initialized before returning non-null values.
 */
export const FCUMapContextProvider: React.FC<React.PropsWithChildren<{ initialMapConfiguration?: MaybeEmptyMapConfiguration }>> = ({
  children,
  initialMapConfiguration,
}) => {
  const [mapRef, setMapRef] = React.useState<MapRef | null>(null);
  const [mapDraw, setMapDraw] = React.useState<MapboxDraw | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [mapLayersLoaded, setMapLayersLoaded] = React.useState(false);
  const [originalMapConfiguration, setMapConfiguration] = React.useState<MapConfiguration>(
    (initialMapConfiguration ?? defaultMapConfiguration) as MapConfiguration
  );
  const reseauxDeChaleurFilters = useReseauxDeChaleurFilters();

  const mapConfiguration = deepMergeObjects(originalMapConfiguration, reseauxDeChaleurFilters.filters);

  if (isDevModeEnabled()) {
    (window as any).mapConfiguration = mapConfiguration;
  }

  React.useEffect(() => {
    setMapConfiguration({
      ...originalMapConfiguration,
      reseauxDeChaleur: {
        ...originalMapConfiguration.reseauxDeChaleur,
        ...reseauxDeChaleurFilters.filters,
      },
    });
  }, [reseauxDeChaleurFilters.filters]);

  const toggleLayer: UseFCUMapResult['toggleLayer'] = (property) => {
    toggleBoolean(mapConfiguration, property);
    setMapConfiguration({ ...mapConfiguration });
  };

  const updateProperty: UseFCUMapResult['updateProperty'] = (property, value) => {
    setProperty(mapConfiguration, property, value);
    setMapConfiguration({ ...mapConfiguration });
  };

  const updateScaleInterval: UseFCUMapResult['updateScaleInterval'] = (property) => (interval) => {
    setProperty(mapConfiguration, property, interval);
    setMapConfiguration({ ...mapConfiguration });
  };

  const commonValues = {
    mapConfiguration,
    setIsDrawing,
    setMapConfiguration,
    setMapDraw,
    setMapLayersLoaded,
    setMapRef,
    toggleLayer,
    updateProperty,
    updateScaleInterval,
    ...reseauxDeChaleurFilters,
  };

  const contextValue: UseFCUMapResult =
    !isDefined(mapRef) || !isDefined(mapDraw)
      ? {
          ...commonValues,
          isDrawing: false,
          mapDraw: null,
          mapLayersLoaded: false,
          mapLoaded: false,
          mapRef: null,
        }
      : {
          ...commonValues,
          isDrawing,
          mapDraw,
          mapLayersLoaded,
          mapLoaded: true,
          mapRef,
        };

  return <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>;
};

export const useFCUMap = (): UseFCUMapResult => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useFCUMap must be used within a MapProvider');
  }
  return context;
};

export default useFCUMap;
