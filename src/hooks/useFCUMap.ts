import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { atom, useAtom, useSetAtom, WritableAtom } from 'jotai';
import React from 'react';
import { MapRef } from 'react-map-gl/maplibre';

import { type ReseauxDeChaleurLimits } from '@components/Map/map-layers';
import { isDefined, setProperty, toggleBoolean } from '@utils/core';
import { Interval } from '@utils/interval';
import { fetchJSON } from '@utils/network';
import {
  defaultMapConfiguration,
  MapConfiguration,
  MapConfigurationProperty,
  MaybeEmptyMapConfiguration,
} from 'src/services/Map/map-configuration';

export const mapRefAtom = atom<MapRef | null>(null);
export const mapDrawAtom = atom<MapboxDraw | null>(null);
export const isDrawingAtom = atom<boolean>(false);
export const mapConfigurationAtom = atom<MapConfiguration>(defaultMapConfiguration);

type SetAtom<T extends WritableAtom<unknown, never[], unknown>> = ReturnType<typeof useSetAtom<T>>;

type UseFCUMapResult = {
  setMapRef: SetAtom<typeof mapRefAtom>;
  setMapDraw: SetAtom<typeof mapDrawAtom>;
  setIsDrawing: SetAtom<typeof isDrawingAtom>;
  setMapConfiguration: SetAtom<typeof mapConfigurationAtom>;
  mapConfiguration: MapConfiguration;
  toggleLayer: (property: MapConfigurationProperty<boolean>) => void;
  updateScaleInterval: (property: MapConfigurationProperty<Interval>) => (interval: Interval) => void;
} & (
  | { mapLoaded: false; mapRef: null; mapDraw: null; isDrawing: false }
  | {
      mapLoaded: true;
      mapRef: MapRef;
      mapDraw: MapboxDraw;
      isDrawing: boolean;
    }
);
/**
 * This hooks waits for the map to be initialized before returning non-null values.
 */
const useFCUMap = (initialMapConfiguration?: MaybeEmptyMapConfiguration): UseFCUMapResult => {
  const [mapRef, setMapRef] = useAtom(mapRefAtom);
  const [mapDraw, setMapDraw] = useAtom(mapDrawAtom);
  const [isDrawing, setIsDrawing] = useAtom(isDrawingAtom);
  const [mapConfiguration, setMapConfiguration] = useAtom(mapConfigurationAtom);

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
    mapConfiguration,
    setMapConfiguration,
    toggleLayer,
    updateScaleInterval,
  };

  if (!isDefined(mapRef) || !isDefined(mapDraw)) {
    return {
      ...commonValues,
      mapLoaded: false,
      mapRef: null,
      mapDraw: null,
      isDrawing: false,
    };
  }

  return {
    ...commonValues,
    mapLoaded: true,
    mapRef,
    mapDraw,
    isDrawing,
  };
};

export default useFCUMap;
