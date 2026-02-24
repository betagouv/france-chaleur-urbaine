import geoViewport from '@mapbox/geo-viewport';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useDebouncedCallback, useLocalStorageValue } from '@react-hookz/web';
import type { GeoJSONSource, LayerSpecification, MapGeoJSONFeature, MapLibreEvent, Map as MapLibreMap } from 'maplibre-gl';
import { useRouter } from 'next/router';
import { parseAsJson, parseAsString, useQueryStates } from 'nuqs';
import { type ReactNode, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import MapReactGL, {
  AttributionControl,
  GeolocateControl,
  MapProvider,
  type MapRef,
  type MapSourceDataEvent,
  NavigationControl,
  ScaleControl,
} from 'react-map-gl/maplibre';
import { z } from 'zod';

import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'maplibre-gl/dist/maplibre-gl.css';

import FileDragNDrop from '@/components/Map/components/FileDragNDrop';
import type { AdresseEligible } from '@/components/Map/layers/adressesEligibles';
import { isMapConfigurationInitialized, type MapConfiguration } from '@/components/Map/map-configuration';
import Accordion from '@/components/ui/Accordion';
import Box from '@/components/ui/Box';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Tooltip from '@/components/ui/Tooltip';
import useContactFormFCU from '@/hooks/useContactFormFCU';
import useDevMode from '@/hooks/useDevMode';
import useRouterReady from '@/hooks/useRouterReady';
import { trackEvent, trackPostHogEvent } from '@/modules/analytics/client';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import type { BoundingBox } from '@/modules/geo/types';
import { notify } from '@/modules/notification';
import type { AddressDetail, HandleAddressSelect } from '@/types/HeatNetworksResponse';
import type { MapMarkerInfos } from '@/types/MapComponentsInfos';
import type { Point } from '@/types/Point';
import type { StoredAddress } from '@/types/StoredAddress';
import type { TypeLegendLogo } from '@/types/TypeLegendLogo';
import cx from '@/utils/cx';

import CardSearchDetails from './components/CardSearchDetails';
import MapMarker from './components/MapMarker';
import MapSearchForm from './components/MapSearchForm';
import SimpleMapLegend from './components/SimpleMapLegend';
import { Title } from './components/SimpleMapLegend.style';
import { useBuildingsDataExtractionLayers } from './components/tools/BuildingsDataExtractionTool';
import { useDistancesMeasurementLayers } from './components/tools/DistancesMeasurementTool';
import { useLinearHeatDensityLayers } from './components/tools/LinearHeatDensityTool';
import {
  CollapseLegend,
  CollapseLegendLabel,
  LegendContainer,
  LegendLogo,
  LegendLogoLink,
  LegendLogoList,
  LegendSideBar,
  legendWidth,
  MapGlobalStyle,
  MapSearchInputWrapper,
  MapSearchWrapper,
} from './Map.style';
import useFCUMap, { FCUMapContextProvider } from './MapProvider';
import { useMapEvents } from './map-events';
import { applyMapConfigurationToLayers, layerSymbolsImagesURLs, loadMapLayers, type MapLegendFeature } from './map-layers';
// https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json
import rawOsmConfig from './osm.config.json';
import { type MapboxStyleDefinition, MapboxStyleSwitcherControl } from './StyleSwitcher';
import rawSatelliteConfig from './satellite.config.json';

export type { AdresseEligible };
const mapSettings = {
  defaultLatitude: 47,
  defaultLongitude: 2.3,
  defaultZoom: 5,
  maxZoom: 20,
  minZoom: 5,
};

const getAddressId = (LatLng: Point) => `${LatLng.join('--')}`;

const osmConfig = rawOsmConfig as any;
const satelliteConfig = rawSatelliteConfig as any;

const styles: MapboxStyleDefinition[] = [
  {
    title: 'Carte',
    uri: osmConfig,
  },
  {
    title: 'Satellite',
    uri: satelliteConfig,
  },
];

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

// Zod schema for BoundingBox validation
const boundingBoxSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

type MapProps = {
  withoutLogo?: boolean;
  initialMapConfiguration?: MapConfiguration;
  enabledLegendFeatures?: MapLegendFeature[];
  withLegend?: boolean;
  withBorder?: boolean;
  withSoughtAddresses?: boolean;
  legendTitle?: string;
  legendCollapsed?: boolean;
  legendLogoOpt?: TypeLegendLogo;
  withCenterPin?: boolean;
  noPopup?: boolean;
  pinsList?: MapMarkerInfos[];
  initialCenter?: Point;
  initialZoom?: number;
  enableFlyToCentering?: boolean;
  bounds?: BoundingBox;
  geolocDisabled?: boolean;
  withFCUAttribution?: boolean;
  withComptePro?: boolean;
  persistViewStateInURL?: boolean;
  mapRef?: RefObject<MapRef>;
  adressesEligibles?: AdresseEligible[];
  adressesEligiblesAutoFit?: boolean;
  onFeatureClick?: (feature: MapGeoJSONFeature) => void;
  onGeomDrop?: (geojson: any) => void;
  geomUpdateFeatures?: GeoJSON.Feature[];
  children?: ReactNode;
};

const Map = ({ initialMapConfiguration, ...props }: MapProps) => {
  return (
    <FCUMapContextProvider initialMapConfiguration={initialMapConfiguration}>
      <FullyFeaturedMap {...props} />
    </FCUMapContextProvider>
  );
};

export const FullyFeaturedMap = ({
  withoutLogo,
  withLegend,
  withBorder,
  legendTitle,
  legendCollapsed: defaultLegendCollapsed,
  enabledLegendFeatures,
  withCenterPin,
  noPopup,
  withSoughtAddresses = true,
  legendLogoOpt,
  pinsList,
  initialCenter,
  initialZoom,
  enableFlyToCentering,
  bounds: defaultBounds,
  geolocDisabled,
  withFCUAttribution,
  withComptePro,
  persistViewStateInURL,
  mapRef: mapRefParam,
  className,
  adressesEligibles,
  adressesEligiblesAutoFit = true,
  onFeatureClick,
  onGeomDrop,
  geomUpdateFeatures,
  children,
  ...props
}: MapProps & React.HTMLAttributes<HTMLDivElement>) => {
  const { devModeEnabled, toggleDevMode } = useDevMode();
  const router = useRouter();
  const { setMapRef, setMapDraw, isDrawing, mapConfiguration, mapLayersLoaded, setMapLayersLoaded } = useFCUMap();
  const { userInfo, setUserInfo } = useUserInfo();
  const { handleOnFetchAddress, handleOnSuccessAddress } = useContactFormFCU();

  const [soughtAddressesVisible, setSoughtAddressesVisible] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const mapRef = useRef<MapRef>(null);
  const switcherControlRef = useRef<MapboxStyleSwitcherControl>(null);
  const [markersList, setMarkersList] = useState<MapMarkerInfos[]>([]);

  const [legendCollapsed, setLegendCollapsed] = useState(true);

  useEffect(() => {
    setLegendCollapsed(defaultLegendCollapsed || window.innerWidth < 992);
    return () => {
      setMapRef(null);
      setMapDraw(null);
      setMapLayersLoaded(false);
    };
  }, []);

  // resize the map when the container renders
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.getMap().resize();
    }
  }, [mapRef.current, legendCollapsed]);

  // exports the mapRef
  useEffect(() => {
    if (mapRefParam && mapRef.current) {
      mapRefParam.current = mapRef.current;
    }
    setMapRef(mapRef?.current);
  }, [mapRef.current]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.showTileBoundaries = devModeEnabled;
    }
  }, [mapRef.current?.getMap(), devModeEnabled]);

  const { value: soughtAddresses, set: setSoughtAddresses } = useLocalStorageValue<StoredAddress[], StoredAddress[], true>(
    'mapSoughtAddresses',
    {
      defaultValue: [],
      initializeWithValue: true,
    }
  );

  const jumpTo = useCallback(({ coordinates, zoom }: { coordinates: [number, number]; zoom?: number }) => {
    if (mapRef.current) {
      mapRef.current.jumpTo({
        center: { lat: coordinates[1], lon: coordinates[0] },
        zoom: zoom || 16,
      });
    }
  }, []);

  const markAddressAsContacted = useCallback(
    (address: Partial<StoredAddress>) => {
      setSoughtAddresses(soughtAddresses.map((addr) => (addr.id === address.id ? { ...addr, contacted: true } : addr)));
    },
    [soughtAddresses]
  );

  const onAddressSelectHandle: HandleAddressSelect = useCallback(
    (address: string, coordinates: Point, addressDetails: AddressDetail) => {
      const search = {
        date: Date.now(),
      };
      const id = getAddressId(coordinates);
      const existingAddressIndex = soughtAddresses.findIndex(({ id: soughtAddressesId }) => soughtAddressesId === id);

      if (existingAddressIndex === -1) {
        const newAddress = {
          address,
          addressDetails,
          coordinates,
          id,
          search,
        };
        handleOnFetchAddress({ address }, 'carte');
        handleOnSuccessAddress(
          {
            address,
            eligibility: addressDetails.network,
            geoAddress: addressDetails.geoAddress,
          },
          'carte'
        );
        setSoughtAddresses([newAddress, ...soughtAddresses]);
        setSelectedCardIndex(0);
      } else {
        setSelectedCardIndex(existingAddressIndex);
      }
      setSoughtAddressesVisible(true);

      jumpTo({ coordinates });
    },
    [handleOnFetchAddress, handleOnSuccessAddress, jumpTo, setSoughtAddresses, soughtAddresses]
  );

  const removeSoughtAddresses = useCallback(
    (result: { coordinates?: Point; address?: string }) => {
      if (!result.coordinates) {
        return;
      }

      const id = getAddressId(result.coordinates);
      const addressIndex = soughtAddresses.findIndex(({ coordinates }) => getAddressId(coordinates) === id);

      setSelectedCardIndex(-1);

      soughtAddresses.splice(addressIndex, 1);
      setSoughtAddresses([...soughtAddresses]);

      setMarkersList((current) => current.filter((marker) => marker.id !== id));

      if (userInfo.address === result.address) {
        setUserInfo({ address: '' });
      }
    },
    [setSoughtAddresses, soughtAddresses, selectedCardIndex, userInfo.address, setUserInfo]
  );

  const resetSoughtAddresses = useCallback(() => {
    setSelectedCardIndex(-1);
    setSoughtAddresses([]);
    setMarkersList([]);
  }, []);

  // cache setExpanded functions to avoid rerendering CardSearchDetails
  const setExpandedFunctions = useMemo(
    () =>
      (soughtAddresses ?? []).map((_, index) => (expanded: boolean) => {
        setSelectedCardIndex(expanded ? index : -1);
      }),
    [soughtAddresses?.length]
  );

  const onMapLoad = async (e: MapLibreEvent) => {
    const drawControl = new MapboxDraw({
      displayControlsDefault: false,
      styles: [
        // disable all mapbox draw styles, they are handled externally using draw.render events
        // we must define an empty layer otherwise the library tries to add its own layers
        {
          id: 'draw-empty-layer',
          paint: {
            'background-opacity': 0,
          },
          type: 'background',
        } satisfies LayerSpecification,
      ],
    });

    e.target.addControl(drawControl as any);
    setMapDraw(drawControl);
    const switcherControl = new MapboxStyleSwitcherControl(styles, {
      defaultStyle: 'Carte',
      eventListeners: {
        onChange: () => {
          // this switcher removes all sources and layers when used so we must configure them again
          setMapLayersLoaded(false);
          return true;
        },
      },
    });
    e.target.addControl(switcherControl);
    switcherControlRef.current = switcherControl;

    const map = e.target;
    // load layers symbols
    await Promise.all(
      layerSymbolsImagesURLs.map(async (spec) => {
        const response = await map.loadImage(spec.url);
        map.addImage(spec.key, response.data, {
          sdf: 'sdf' in spec && spec.sdf,
        });
      })
    );

    // register move event handler to sync view state to URL
    if (persistViewStateInURL) {
      const map = mapRef.current?.getMap();
      if (map) {
        map.on('move', () => {
          syncViewStateToURL(map);
        });
      }
    }
  };

  const onMapSourceData = (e: MapSourceDataEvent) => {
    const map = mapRef.current?.getMap();
    if (
      mapLayersLoaded ||
      !map ||
      !isMapConfigurationInitialized(mapConfiguration) ||
      (e.sourceId !== 'openmaptiles' && e.sourceId !== 'raster-tiles') ||
      !e.isSourceLoaded ||
      !e.tile
    ) {
      return;
    }

    loadMapLayers(map, mapConfiguration);

    setMapLayersLoaded(true);
  };

  const { Popup } = useMapEvents({ isDrawing, mapLayersLoaded, mapRef: mapRef.current, onFeatureClick });

  // disable the switcher control as it conflicts with map layers and drawing interactions
  useEffect(() => {
    switcherControlRef.current?.enable(!isDrawing);
  }, [isDrawing]);

  useEffect(() => {
    if (!mapRef.current || !initialCenter) {
      return;
    }

    if (withCenterPin) {
      const newMarker = {
        id: getAddressId(initialCenter),
        latitude: initialCenter[1],
        longitude: initialCenter[0],
      };
      setMarkersList([newMarker]);
    }
    if (enableFlyToCentering) {
      if (initialCenter[0] === undefined || initialCenter[1] === undefined) {
        notify('error', "Nous n'avons pas pu centrer la carte car les coordonnées sont invalides");
        return;
      }

      mapRef.current?.getMap()?.flyTo({ center: initialCenter, duration: 1000, essential: true, zoom: initialZoom });
    } else {
      jumpTo({ coordinates: initialCenter, zoom: initialZoom });
    }
  }, [initialCenter, jumpTo, withCenterPin, mapRef.current]);

  useEffect(() => {
    if ((pinsList && pinsList?.length > 0) || !withSoughtAddresses) {
      //The pin to display are only those on the pinsList
      return;
    }
    let shouldUpdate = false;
    const newMarkersList = [...markersList];
    const newSoughtAddresses = soughtAddresses.map((sAddress: any | never[]) => {
      const id = sAddress.id;
      const markerIndex = newMarkersList.findIndex((marker) => marker.id === id);
      if (markerIndex === -1) {
        const newMarker = {
          id: sAddress.id,
          latitude: sAddress.coordinates[1],
          longitude: sAddress.coordinates[0],
        };
        newMarkersList.push(newMarker);
        shouldUpdate = true;
      }
      return sAddress;
    });
    if (shouldUpdate) {
      setSoughtAddresses(newSoughtAddresses);
      setMarkersList(newMarkersList);
    }
  }, [markersList, setMarkersList, setSoughtAddresses, soughtAddresses]);

  useEffect(() => {
    if (!mapLayersLoaded) {
      return;
    }

    const map = mapRef.current?.getMap();
    if (map && isMapConfigurationInitialized(mapConfiguration)) {
      applyMapConfigurationToLayers(map, mapConfiguration);
    }
  }, [mapLayersLoaded, mapRef, mapConfiguration]);

  useDistancesMeasurementLayers();
  useLinearHeatDensityLayers();
  useBuildingsDataExtractionLayers();

  // TODO pourquoi on doit passer par un setState ici ?
  useEffect(() => {
    if (pinsList) {
      setMarkersList(pinsList);
    }
  }, [pinsList]);

  const [{ bounds: boundsInQuery }, setQuery] = useQueryStates({
    bounds: parseAsJson(boundingBoxSchema.parse),
    coord: parseAsString,
    zoom: parseAsString,
  });
  const bounds = boundsInQuery || defaultBounds;

  // Debounced function to sync view state to URL (e.g. /carte?coord=2.3429253,48.7998120&zoom=11.36)
  const syncViewStateToURL = useDebouncedCallback(
    (map: MapLibreMap) => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      void setQuery(
        {
          bounds: null, // reset bounds as they are just meant to be used on load of the map
          coord: `${center.lng.toFixed(7)},${center.lat.toFixed(7)}`,
          zoom: zoom.toFixed(2),
        },
        {
          shallow: true,
        }
      );
    },
    [],
    500
  );

  const mapViewportFitPadding = 50; // px

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!bounds || !map) {
      return;
    }
    const { center, zoom } = geoViewport.viewport(
      bounds, // bounds
      [map.getCanvas().clientWidth - 2 * mapViewportFitPadding, map.getCanvas().clientHeight - 2 * mapViewportFitPadding], // dimensions
      1, // min zoom
      20, // max zoom
      512, // tile size for MVT
      true // allow decimals in zoom
    );

    map.flyTo({ center, duration: 1000, essential: true, zoom });
  }, [JSON.stringify(bounds), mapRef.current]);

  // This effect fits the map on the bounds of the adressesEligibles when they change
  useEffect(() => {
    if (!adressesEligiblesAutoFit || !mapRef.current || !adressesEligibles?.length) {
      return;
    }

    const bounds = adressesEligibles.reduce(
      (acc, address) => {
        acc[0] = Math.min(acc[0], address.longitude);
        acc[1] = Math.min(acc[1], address.latitude);
        acc[2] = Math.max(acc[2], address.longitude);
        acc[3] = Math.max(acc[3], address.latitude);
        return acc;
      },
      [180, 90, -180, -90] as BoundingBox
    );

    const map = mapRef.current.getMap();
    const { center, zoom } = geoViewport.viewport(
      bounds,
      [map.getCanvas().clientWidth - 2 * mapViewportFitPadding, map.getCanvas().clientHeight - 2 * mapViewportFitPadding],
      1,
      20,
      512,
      true
    );

    map.flyTo({ center, duration: 1000, essential: true, zoom });
  }, [adressesEligiblesAutoFit, adressesEligibles, mapRef.current]);

  // Update adressesEligibles source when it changes
  useEffect(() => {
    if (!mapRef.current || !mapLayersLoaded || !adressesEligibles) return;

    (mapRef.current.getSource('adressesEligibles') as GeoJSONSource)?.setData({
      features: adressesEligibles.map((address) => ({
        geometry: {
          coordinates: [address.longitude, address.latitude],
          type: 'Point',
        },
        id: address.id,
        properties: {
          ...address,
        },
        type: 'Feature',
      })),
      type: 'FeatureCollection',
    });
  }, [mapRef.current, mapLayersLoaded, adressesEligibles]);

  // Update geomUpdate source when it changes
  useEffect(() => {
    if (!mapRef.current || !mapLayersLoaded || !geomUpdateFeatures) return;

    (mapRef.current.getSource('geomUpdate') as GeoJSONSource)?.setData({
      features: geomUpdateFeatures,
      type: 'FeatureCollection',
    });
  }, [mapRef.current, mapLayersLoaded, geomUpdateFeatures]);

  const mapMarkers = useMemo(() => {
    if (markersList.length === 0) {
      return null;
    }

    return markersList.map((marker: MapMarkerInfos) => (
      <MapMarker
        key={marker.id}
        id={marker.id}
        longitude={marker.longitude}
        latitude={marker.latitude}
        color={marker.color}
        popup={marker.popup}
        popupContent={marker.popupContent}
        onClickAction={marker.onClickAction}
      />
    ));
  }, [markersList]);

  const isRouterReady = useRouterReady();
  if (!isRouterReady || !isMapConfigurationInitialized(mapConfiguration)) {
    return null;
  }

  const initialViewState: ViewState = {
    latitude: initialCenter ? initialCenter[1] : mapSettings.defaultLatitude,
    longitude: initialCenter ? initialCenter[0] : mapSettings.defaultLongitude,
    zoom: initialZoom || mapSettings.defaultZoom,
  };

  if (router.query.coord) {
    const [lng, lat] = (router.query.coord as string).split(',');
    initialViewState.longitude = parseFloat(lng) || mapSettings.defaultLongitude;
    initialViewState.latitude = parseFloat(lat) || mapSettings.defaultLatitude;
    initialViewState.zoom = initialZoom || 13;
  }

  if (router.query.zoom) {
    initialViewState.zoom = parseFloat(router.query.zoom as string) ?? mapSettings.defaultZoom;
  }

  // initial fit on bbox deprecated
  if (router.query.bbox) {
    const headerHeight = 56; // px
    const mapViewportWidth =
      typeof window !== 'undefined' ? window.innerWidth - (withLegend && !legendCollapsed ? legendWidth : 0) - mapViewportFitPadding : 0;
    const mapViewportHeight = typeof window !== 'undefined' ? window.innerHeight - headerHeight - mapViewportFitPadding : 0;

    const bbox = (router.query.bbox as string).split(',').map((n) => Number.parseFloat(n)) as BoundingBox;

    const { center, zoom } = geoViewport.viewport(
      bbox, // bounds
      [mapViewportWidth, mapViewportHeight], // dimensions
      11, // min zoom
      16, // max zoom
      512, // tile size for MVT
      true // allow decimals in zoom
    );

    initialViewState.longitude = center[0] || mapSettings.defaultLongitude;
    initialViewState.latitude = center[1] || mapSettings.defaultLatitude;
    initialViewState.zoom = zoom;
  }

  const sourcesLink = ReactDOMServer.renderToString(
    <Link
      href="/donnees"
      isExternal
      eventKey="Téléchargement|Carto sources"
      postHogEventKey="link:click"
      postHogEventProps={{ link_name: 'sources_donnees', source: 'carte' }}
    >
      Sources
    </Link>
  );

  return (
    <>
      <MapGlobalStyle $legendCollapsed={!withLegend || legendCollapsed} isDrawing={isDrawing} withBorder={withBorder} />
      <div className={cx('map-wrap', className)} {...props}>
        {withLegend && (
          <>
            <CollapseLegend
              $legendCollapsed={legendCollapsed}
              onClick={() => {
                trackEvent(`Carto|Légende|${legendCollapsed ? 'Ouvre' : 'Ferme'}`);
                trackPostHogEvent('map:legend_toggle', { is_open: legendCollapsed });
                setLegendCollapsed(!legendCollapsed);
              }}
            >
              <Tooltip side="right" title={legendCollapsed ? 'Afficher la légende' : 'Masquer la légende'}>
                <CollapseLegendLabel>
                  <Icon size="sm" name="fr-icon-arrow-right-s-line" rotate={legendCollapsed ? -90 : 90} />
                  <span>Légende</span>
                  <Icon size="sm" name="fr-icon-arrow-right-s-line" rotate={legendCollapsed ? -90 : 90} />
                </CollapseLegendLabel>
              </Tooltip>
            </CollapseLegend>
            <LegendSideBar $legendCollapsed={legendCollapsed}>
              <LegendContainer>
                <SimpleMapLegend legendTitle={legendTitle} enabledFeatures={enabledLegendFeatures} withComptePro={withComptePro} />
              </LegendContainer>
              {!withoutLogo && (
                <LegendLogoList>
                  <LegendLogoLink href="https://france-chaleur-urbaine.beta.gouv.fr/" target="_blank" rel="noopener noreferrer">
                    <img src="/logo-fcu-with-typo.jpg" alt="logo france chaleur urbaine" />
                  </LegendLogoLink>
                  {legendLogoOpt && (
                    <LegendLogo>
                      <img src={legendLogoOpt.src} alt={legendLogoOpt.alt} />
                    </LegendLogo>
                  )}
                </LegendLogoList>
              )}
            </LegendSideBar>
          </>
        )}
        {children}
        <MapProvider>
          <MapReactGL
            initialViewState={initialViewState}
            mapStyle={osmConfig}
            attributionControl={false}
            maxZoom={mapSettings.maxZoom}
            minZoom={mapSettings.minZoom}
            onLoad={onMapLoad}
            onSourceData={onMapSourceData}
            ref={mapRef}
          >
            {/* trackUserLocation allows the user to disable the geolocation marker */}
            {!geolocDisabled && <GeolocateControl fitBoundsOptions={{ maxZoom: 13 }} trackUserLocation />}
            <AttributionControl
              compact={false}
              position="bottom-right"
              customAttribution={
                withFCUAttribution
                  ? "<a href='https://france-chaleur-urbaine.beta.gouv.fr/' target='_blank' rel='noopener noreferrer'>France Chaleur Urbaine</a>"
                  : sourcesLink
              }
            />
            <NavigationControl showZoom={true} visualizePitch={true} position="bottom-right" />
            <ScaleControl maxWidth={100} unit="metric" position="bottom-left" />
            {Popup}
            {children}
            {mapMarkers}
            <FileDragNDrop onDrop={onGeomDrop} />
          </MapReactGL>
          {withLegend && (
            <MapSearchWrapper $legendCollapsed={legendCollapsed}>
              <MapSearchInputWrapper>
                <Title>Rechercher une adresse</Title>
                <MapSearchForm
                  onAddressSelect={onAddressSelectHandle}
                  withDefaultAddress={withSoughtAddresses && soughtAddresses.length === 0}
                />
              </MapSearchInputWrapper>

              {withSoughtAddresses && soughtAddresses.length > 0 && (
                <Accordion
                  className="fr-mt-1v"
                  label={
                    <>
                      {soughtAddresses.length} adresse{soughtAddresses.length > 1 ? 's' : ''} recherchée
                      {soughtAddresses.length > 1 ? 's' : ''}
                    </>
                  }
                  simple
                  small
                  expanded={soughtAddressesVisible}
                  onExpandedChange={setSoughtAddressesVisible}
                  onClose={resetSoughtAddresses}
                >
                  <Box display="flex" flexDirection="column" gap="8px">
                    {soughtAddresses.map((soughtAddress, index) => (
                      <CardSearchDetails
                        key={soughtAddress.id}
                        address={soughtAddress}
                        onClick={jumpTo}
                        onClickClose={removeSoughtAddresses}
                        onContacted={markAddressAsContacted}
                        expanded={selectedCardIndex === index}
                        setExpanded={setExpandedFunctions[index]}
                      />
                    ))}
                  </Box>
                </Accordion>
              )}
            </MapSearchWrapper>
          )}

          {/* Enable dev mode on click */}
          <Box
            position="absolute"
            top="0"
            right="0"
            width="8px"
            height="8px"
            backgroundColor={devModeEnabled ? '#00aa00' : undefined}
            onClick={() => toggleDevMode()}
          />
        </MapProvider>
      </div>
    </>
  );
};

export default Map;
