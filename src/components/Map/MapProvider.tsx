import MapboxDraw from '@mapbox/mapbox-gl-draw';
import React, { createContext, useContext } from 'react';
import { MapRef } from 'react-map-gl/maplibre';

import { type ReseauxDeChaleurLimits } from '@components/Map/map-layers';
import useReseauxDeChaleurFilters from '@hooks/useReseauxDeChaleurFilters';
import { deepMergeObjects, isDefined, setProperty, toggleBoolean } from '@utils/core';
import { Interval } from '@utils/interval';
import { fetchJSON } from '@utils/network';
import {
  defaultMapConfiguration,
  MapConfiguration,
  MapConfigurationProperty,
  MaybeEmptyMapConfiguration,
} from 'src/services/Map/map-configuration';

type UseFCUMapResult = {
  setMapRef: React.Dispatch<React.SetStateAction<MapRef | null>>;
  setMapDraw: React.Dispatch<React.SetStateAction<MapboxDraw | null>>;
  setIsDrawing: React.Dispatch<React.SetStateAction<boolean>>;
  setMapLayersLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  setMapConfiguration: React.Dispatch<React.SetStateAction<MapConfiguration>>;
  mapConfiguration: MapConfiguration;
  toggleLayer: (property: MapConfigurationProperty<boolean>) => void;
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
  const [originalMapConfiguration, setMapConfiguration] = React.useState<MapConfiguration>(defaultMapConfiguration);
  const reseauxDeChaleurFilters = useReseauxDeChaleurFilters();

  const mapConfiguration = deepMergeObjects(originalMapConfiguration, reseauxDeChaleurFilters.filters);

  React.useEffect(() => {
    if (!initialMapConfiguration) {
      return;
    }
    // amend the configuration with metadata limits of networks
    fetchJSON<ReseauxDeChaleurLimits>('/api/map/network-limits').then((limits) => {
      setMapConfiguration({
        ...initialMapConfiguration,
        reseauxDeChaleur: {
          ...initialMapConfiguration.reseauxDeChaleur,
          anneeConstruction: limits.anneeConstruction,
          emissionsCO2: limits.emissionsCO2,
          livraisonsAnnuelles: limits.livraisonsAnnuelles,
          prixMoyen: limits.prixMoyen,
          limits,
        },
      });
    });
  }, []);

  const toggleLayer: UseFCUMapResult['toggleLayer'] = (property) => {
    toggleBoolean(mapConfiguration, property);
    setMapConfiguration({ ...mapConfiguration });
  };

  const updateScaleInterval: UseFCUMapResult['updateScaleInterval'] = (property) => (interval) => {
    setProperty(mapConfiguration, property, interval);
    setMapConfiguration({ ...mapConfiguration });
  };

  const commonValues = {
    setMapRef,
    setMapDraw,
    setIsDrawing,
    setMapLayersLoaded,
    mapConfiguration,
    setMapConfiguration,
    toggleLayer,
    updateScaleInterval,
    ...reseauxDeChaleurFilters,
  };

  const contextValue: UseFCUMapResult =
    !isDefined(mapRef) || !isDefined(mapDraw)
      ? {
          ...commonValues,
          mapLoaded: false,
          mapLayersLoaded: false,
          mapRef: null,
          mapDraw: null,
          isDrawing: false,
        }
      : {
          ...commonValues,
          mapLoaded: true,
          mapLayersLoaded,
          mapRef,
          mapDraw,
          isDrawing,
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
