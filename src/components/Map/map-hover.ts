import { MapGeoJSONFeature, MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useState } from 'react';
import { MapMouseEvent, MapRef } from 'react-map-gl/maplibre';

import { SourceId } from 'src/services/tiles.config';
import { MapPopupInfos } from 'src/types/MapComponentsInfos';

import { isDevModeEnabled } from './components/DevModeIcon';
import { layersWithDynamicContentPopup } from './components/DynamicMapPopupContent';
import { LayerId } from './map-layers';

let hoveredStateId: MapGeoJSONFeature['id'] | null = null;

type HoverConfig = {
  source: SourceId;
  sourceLayer: string;
  layer: LayerId;
};

const hoverConfigs: HoverConfig[] = [
  {
    layer: 'reseauxDeChaleur-avec-trace',
    source: 'network',
    sourceLayer: 'layer',
  },
  {
    layer: 'reseauxEnConstruction-trace',
    source: 'futurNetwork',
    sourceLayer: 'futurOutline',
  },
  {
    layer: 'reseauxDeFroid-avec-trace',
    source: 'coldNetwork',
    sourceLayer: 'coldOutline',
  },
];

type UseMapHoverConfigProps = {
  mapLayersLoaded: boolean;
  isDrawing: boolean;
  mapRef: MapRef | null;
};

/**
 * Register hover effects that highlight some features.
 */
export function useMapHoverEffects({ mapLayersLoaded, isDrawing, mapRef }: UseMapHoverConfigProps) {
  useEffect(() => {
    if (!mapLayersLoaded || !mapRef || isDrawing) {
      return;
    }

    /**
     * The hover state is used in the layers to change the style of the feature using ['feature-state', 'hover']
     */
    const setFeatureHoveringState = (map: MapRef, hover: boolean, source: SourceId, sourceLayer: string) => {
      if (hoveredStateId) {
        map.setFeatureState(
          {
            source,
            id: hoveredStateId,
            sourceLayer,
          },
          { hover }
        );
        if (!hover) {
          hoveredStateId = null;
        }
      }
    };

    const hoverConfigsWithCallbacks = hoverConfigs.map((config) => {
      return {
        layer: config.layer,
        onMouseEnter: (
          event: MapMouseEvent & {
            features?: MapGeoJSONFeature[];
          }
        ) => {
          if (event.features && event.features.length > 0) {
            setFeatureHoveringState(mapRef, false, config.source, config.sourceLayer);
            hoveredStateId = event.features[0].id;
            setFeatureHoveringState(mapRef, true, config.source, config.sourceLayer);
          }
        },
        onMouseLeave: () => {
          setFeatureHoveringState(mapRef, false, config.source, config.sourceLayer);
        },
      };
    });

    hoverConfigsWithCallbacks.forEach((config) => {
      mapRef.on('mouseenter', config.layer, config.onMouseEnter);
      mapRef.on('mouseleave', config.layer, config.onMouseLeave);
    });

    return () => {
      hoverConfigsWithCallbacks.forEach((config) => {
        mapRef.off('mouseenter', config.layer, config.onMouseEnter);
        mapRef.off('mouseleave', config.layer, config.onMouseLeave);
      });
    };
  }, [mapLayersLoaded, isDrawing]);
}

const clickEvents: {
  layer: LayerId;
  key: string;
}[] = [
  { layer: 'zonesPotentielChaud', key: 'zonesPotentielChaud' },
  { layer: 'zonesPotentielFortChaud', key: 'zonesPotentielFortChaud' },
  { layer: 'reseauxDeChaleur-avec-trace', key: 'network' },
  { layer: 'reseauxDeChaleur-sans-trace', key: 'network' },
  { layer: 'reseauxDeFroid-avec-trace', key: 'coldNetwork' },
  { layer: 'reseauxDeFroid-sans-trace', key: 'coldNetwork' },
  { layer: 'reseauxEnConstruction-trace', key: 'futurNetwork' },
  { layer: 'reseauxEnConstruction-zone', key: 'futurNetwork' },
  {
    layer: 'demandesEligibilite',
    key: 'demands',
  },
  { layer: 'caracteristiquesBatiments', key: 'buildings' },
  { layer: 'besoinsEnChaleur', key: '*' },
  { layer: 'besoinsEnFroid', key: '*' },
  { layer: 'besoinsEnChaleurIndustrieCommunes', key: '*' },
  { layer: 'consommationsGaz', key: 'consommation' },
  { layer: 'energy', key: 'energy' },
  { layer: 'batimentsRaccordes', key: 'raccordement' },
  {
    layer: 'enrrMobilisables-friches',
    key: 'enrrMobilisables-friche',
  },
  {
    layer: 'enrrMobilisables-parkings',
    key: 'enrrMobilisables-parking',
  },
  {
    layer: 'enrrMobilisables-datacenter',
    key: 'enrrMobilisables-datacenter',
  },
  {
    layer: 'enrrMobilisables-industrie',
    key: 'enrrMobilisables-industrie',
  },
  {
    layer: 'enrrMobilisables-installations-electrogenes',
    key: 'enrrMobilisables-installations-electrogenes',
  },
  {
    layer: 'enrrMobilisables-stations-d-epuration',
    key: 'enrrMobilisables-stations-d-epuration',
  },
  {
    layer: 'enrrMobilisables-unites-d-incineration',
    key: 'enrrMobilisables-unites-d-incineration',
  },
];

type UseMapClickEffectsProps = {
  mapLayersLoaded: boolean;
  isDrawing: boolean;
  mapRef: MapRef | null;
  noPopup?: boolean;
};

/**
 * Register click handlers that open popups.
 */
export function useMapClickHandlers({ mapLayersLoaded, isDrawing, mapRef, noPopup }: UseMapClickEffectsProps) {
  const [popupInfos, setPopupInfos] = useState<MapPopupInfos>();

  const onMapClick = (e: MapLayerMouseEvent, key: string) => {
    const selectedFeature = e.features?.[0];
    if (!selectedFeature) {
      return;
    }
    if (isDevModeEnabled()) {
      console.log('map-click', selectedFeature); // eslint-disable-line no-console
    }

    // depending on the feature type, we force the popup type to help building the popup content more easily
    setPopupInfos({
      latitude: e.lngLat.lat,
      longitude: e.lngLat.lng,
      content: layersWithDynamicContentPopup.includes(selectedFeature.layer?.id as (typeof layersWithDynamicContentPopup)[number])
        ? {
            type: selectedFeature.layer?.id,
            properties: selectedFeature.properties,
          }
        : { [key]: selectedFeature.properties },
    });
  };

  useEffect(() => {
    if (!mapLayersLoaded || !mapRef || isDrawing || noPopup) {
      return;
    }

    // register click event handlers
    const configsWithCallbacks = clickEvents.map(({ layer, key }) => {
      return {
        layer,
        onClick: (e: any) => onMapClick(e, key),
        onMouseEnter: () => {
          mapRef.getCanvas().style.cursor = 'pointer';
        },
        onMouseLeave: () => {
          mapRef.getCanvas().style.cursor = '';
        },
      };
    });

    configsWithCallbacks.forEach((config) => {
      mapRef.on('click', config.layer, config.onClick);
      mapRef.on('touchend', config.layer, config.onClick);
      mapRef.on('mouseenter', config.layer, config.onMouseEnter);
      mapRef.on('mouseleave', config.layer, config.onMouseLeave);
    });

    return () => {
      configsWithCallbacks.forEach((config) => {
        mapRef.off('click', config.layer, config.onClick);
        mapRef.off('touchend', config.layer, config.onClick);
        mapRef.off('mouseenter', config.layer, config.onMouseEnter);
        mapRef.off('mouseleave', config.layer, config.onMouseLeave);
      });
    };
  }, [mapLayersLoaded, isDrawing]);

  return {
    popupInfos,
  };
}
