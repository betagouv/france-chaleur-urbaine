import geoViewport from '@mapbox/geo-viewport';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useDebouncedEffect, useLocalStorageValue } from '@react-hookz/web';
import { LayerSpecification, MapLibreEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/router';
import { parseAsString, useQueryStates } from 'nuqs';
import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import MapReactGL, {
  AttributionControl,
  GeolocateControl,
  MapProvider,
  MapRef,
  MapSourceDataEvent,
  NavigationControl,
  ScaleControl,
} from 'react-map-gl/maplibre';

import Accordion from '@components/ui/Accordion';
import Box from '@components/ui/Box';
import Icon from '@components/ui/Icon';
import Link from '@components/ui/Link';
import Tooltip from '@components/ui/Tooltip';
import { useContactFormFCU } from '@hooks';
import useRouterReady from '@hooks/useRouterReady';
import { useServices } from 'src/services';
import { trackEvent } from 'src/services/analytics';
import { MapConfiguration, isMapConfigurationInitialized } from 'src/services/Map/map-configuration';
import { AddressDetail, HandleAddressSelect } from 'src/types/HeatNetworksResponse';
import { MapMarkerInfos, MapPopupType } from 'src/types/MapComponentsInfos';
import { Point } from 'src/types/Point';
import { StoredAddress } from 'src/types/StoredAddress';
import { TypeLegendLogo } from 'src/types/TypeLegendLogo';

import CardSearchDetails from './components/CardSearchDetails';
import { type MapLegendFeature } from './components/MapLegendReseaux';
import MapMarker from './components/MapMarker';
import MapPopup from './components/MapPopup';
import MapSearchForm from './components/MapSearchForm';
import SimpleMapLegend from './components/SimpleMapLegend';
import { Title } from './components/SimpleMapLegend.style';
import { useBuildingsDataExtractionLayers } from './components/tools/BuildingsDataExtractionTool';
import { useDistancesMeasurementLayers } from './components/tools/DistancesMeasurementTool';
import { useLinearHeatDensityLayers } from './components/tools/LinearHeatDensityTool';
import { useMapClickHandlers, useMapHoverEffects } from './map-hover';
import { applyMapConfigurationToLayers, buildInternalMapLayers, buildMapLayers, layerSymbolsImagesURLs } from './map-layers';
import {
  CollapseLegend,
  CollapseLegendLabel,
  LegendContainer,
  LegendLogo,
  LegendLogoLink,
  LegendLogoList,
  LegendSideBar,
  MapSearchInputWrapper,
  MapSearchWrapper,
  MapStyle,
  legendWidth,
} from './Map.style';
import useFCUMap, { FCUMapContextProvider } from './MapProvider';
import satelliteConfig from './satellite.config.json';
import { MapboxStyleDefinition, MapboxStyleSwitcherControl } from './StyleSwitcher';

const mapSettings = {
  defaultLongitude: 2.3,
  defaultLatitude: 47,
  defaultZoom: 5,
  minZoom: 5,
  maxZoom: 20,
};

const getAddressId = (LatLng: Point) => `${LatLng.join('--')}`;

const carteConfig = 'https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json';
const styles: MapboxStyleDefinition[] = [
  {
    title: 'Carte',
    uri: carteConfig,
  },
  {
    title: 'Satellite',
    uri: satelliteConfig as any,
  },
];

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

type MapProps = {
  withoutLogo?: boolean;
  initialMapConfiguration?: MapConfiguration;
  enabledLegendFeatures?: MapLegendFeature[];
  withLegend?: boolean;
  withBorder?: boolean;
  legendTitle?: string;
  legendLogoOpt?: TypeLegendLogo;
  withCenterPin?: boolean;
  noPopup?: boolean;
  popupType?: MapPopupType;
  pinsList?: MapMarkerInfos[];
  initialCenter?: Point;
  initialZoom?: number;
  geolocDisabled?: boolean;
  withFCUAttribution?: boolean;
  persistViewStateInURL?: boolean;
  mapRef?: MutableRefObject<MapRef>;
};

const Map = ({ initialMapConfiguration, ...props }: MapProps) => {
  return (
    <FCUMapContextProvider initialMapConfiguration={initialMapConfiguration}>
      <InternalMap {...props} />
    </FCUMapContextProvider>
  );
};

const InternalMap = ({
  withoutLogo,
  withLegend,
  withBorder,
  legendTitle,
  enabledLegendFeatures,
  withCenterPin,
  noPopup,
  legendLogoOpt,
  popupType = MapPopupType.DEFAULT,
  pinsList,
  initialCenter,
  initialZoom,
  geolocDisabled,
  withFCUAttribution,
  persistViewStateInURL,
  mapRef: mapRefParam,
}: MapProps) => {
  const router = useRouter();
  const { setMapRef, setMapDraw, isDrawing, mapConfiguration, mapLayersLoaded, setMapLayersLoaded } = useFCUMap();

  const { heatNetworkService } = useServices();
  const { handleOnFetchAddress, handleOnSuccessAddress } = useContactFormFCU();

  const [soughtAddressesVisible, setSoughtAddressesVisible] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const mapRef = useRef<MapRef>(null);
  const switcherControlRef = useRef<MapboxStyleSwitcherControl>();
  const [markersList, setMarkersList] = useState<MapMarkerInfos[]>([]);

  const [legendCollapsed, setLegendCollapsed] = useState(true);
  useEffect(() => {
    setLegendCollapsed(window.innerWidth < 992);
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
        center: { lon: coordinates[0], lat: coordinates[1] },
        zoom: zoom || 16,
      });
    }
  }, []);

  const markAddressAsContacted = (address: Partial<StoredAddress>) => {
    setSoughtAddresses(soughtAddresses.map((addr) => (addr.id === address.id ? { ...addr, contacted: true } : addr)));
  };

  const onAddressSelectHandle: HandleAddressSelect = useCallback(
    (address: string, coordinates: Point, addressDetails: AddressDetail) => {
      const search = {
        date: Date.now(),
      };
      const id = getAddressId(coordinates);
      const existingAddressIndex = soughtAddresses.findIndex(({ id: soughtAddressesId }) => soughtAddressesId === id);

      if (existingAddressIndex === -1) {
        const newAddress = {
          id,
          coordinates,
          address,
          addressDetails,
          search,
        };
        handleOnFetchAddress({ address }, true);
        handleOnSuccessAddress(
          {
            address,
            geoAddress: addressDetails.geoAddress,
            eligibility: addressDetails.network,
          },
          true
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
    (result: { coordinates?: Point }) => {
      if (!result.coordinates) {
        return;
      }

      const id = getAddressId(result.coordinates);
      const addressIndex = soughtAddresses.findIndex(({ coordinates }) => getAddressId(coordinates) === id);

      setSelectedCardIndex(-1);

      soughtAddresses.splice(addressIndex, 1);
      setSoughtAddresses([...soughtAddresses]);

      setMarkersList((current) => current.filter((marker) => marker.id !== id));
    },
    [setSoughtAddresses, soughtAddresses, selectedCardIndex]
  );

  const onMapLoad = async (e: MapLibreEvent) => {
    const drawControl = new MapboxDraw({
      displayControlsDefault: false,
      styles: [
        // disable all mapbox draw styles, they are handled externally using draw.render events
        // we must define an empty layer otherwise the library tries to add its own layers
        {
          id: 'draw-empty-layer',
          type: 'background',
          paint: {
            'background-opacity': 0,
          },
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

    // register move and hover event handlers
    {
      const map = mapRef.current;
      if (map) {
        if (persistViewStateInURL) {
          map.on('move', () => {
            const newViewState = {
              longitude: map.getMap().getCenter().lng,
              latitude: map.getMap().getCenter().lat,
              zoom: map.getMap().getZoom(),
            };
            if (
              viewState?.longitude !== newViewState.longitude ||
              viewState?.latitude !== newViewState.latitude ||
              viewState?.zoom !== newViewState.zoom
            ) {
              setViewState(newViewState);
            }
          });
        }
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

    buildMapLayers(mapConfiguration).forEach((spec) => {
      if (map.getSource(spec.sourceId)) {
        return;
      }

      map.addSource(spec.sourceId, spec.source);
      spec.layers.forEach((layer) => {
        if (!layer.layout) {
          layer.layout = {};
        }
        // hide all layers by default to prevent loading them
        layer.layout.visibility = 'none';
        map.addLayer(layer);
      });
    });

    // other sources: distances measurement, linear heat density, buildings data extraction
    buildInternalMapLayers().forEach((spec) => {
      if (map.getSource(spec.sourceId)) {
        return;
      }

      map.addSource(spec.sourceId, spec.source);
      spec.layers.forEach((layer) => {
        map.addLayer(layer);
      });
    });

    setMapLayersLoaded(true);
  };

  useMapHoverEffects({ mapLayersLoaded, isDrawing, mapRef: mapRef.current });
  const { popupInfos } = useMapClickHandlers({ mapLayersLoaded, isDrawing, mapRef: mapRef.current, noPopup });

  // disable the switcher control as it conflicts with map layers and drawing interactions
  useEffect(() => {
    switcherControlRef.current?.enable(!isDrawing);
  }, [isDrawing]);

  useEffect(() => {
    const { id } = router.query;
    if (!id) {
      return;
    }

    heatNetworkService.bulkEligibilityValues(id as string).then((response) => {
      if (response.result) {
        const newMarkersList: MapMarkerInfos[] = [];
        response.result.forEach((address) => {
          const id = getAddressId([address.lon, address.lat]);
          if (
            // Remove duplicates
            !newMarkersList.some((marker) => marker.id === id && marker.popupContent === address.label)
          ) {
            const newMarker = {
              id: getAddressId([address.lon, address.lat]),
              latitude: address.lat,
              longitude: address.lon,
              color: address.isEligible ? 'green' : 'red',
              popup: true,
              popupContent: address.label,
            };

            newMarkersList.push(newMarker);
          }
        });
        setMarkersList(newMarkersList);
      }
    });
  }, [router.query, heatNetworkService]);

  useEffect(() => {
    if (mapRef.current && initialCenter) {
      if (withCenterPin) {
        const newMarker = {
          id: getAddressId(initialCenter),
          latitude: initialCenter[1],
          longitude: initialCenter[0],
        };
        setMarkersList([newMarker]);
      }
      jumpTo({ coordinates: initialCenter, zoom: initialZoom });
    }
  }, [initialCenter, jumpTo, withCenterPin]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const { coord, id } = router.query;
    if (!geolocDisabled && !coord && !initialCenter && !id && navigator.geolocation) {
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(({ state }) => {
          if (state === 'granted' || state === 'prompt') {
            navigator.geolocation.getCurrentPosition((pos) => {
              const { longitude, latitude } = pos.coords;
              jumpTo({ coordinates: [longitude, latitude], zoom: 13 });
            });
          }
        });
      } else {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { longitude, latitude } = pos.coords;
          jumpTo({ coordinates: [longitude, latitude], zoom: 13 });
        });
      }
    }
  }, [jumpTo, initialCenter, router, geolocDisabled]);

  useEffect(() => {
    if (pinsList && pinsList?.length > 0) {
      //The pin to display are only those on the pinsList
      return;
    }
    let shouldUpdate = false;
    const newMarkersList: MapMarkerInfos[] = markersList;
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

  // FIXME pourquoi on doit passer par un setState ici ?
  useEffect(() => {
    if (pinsList) {
      setMarkersList(pinsList);
    }
  }, [pinsList]);

  const [viewState, setViewState] = useState<ViewState | null>(null);
  useEffect(() => {
    if (persistViewStateInURL && router.query.coord) {
      const [lng, lat] = (router.query.coord as string).split(',');
      setViewState({
        longitude: parseFloat(lng) || mapSettings.defaultLongitude,
        latitude: parseFloat(lat) || mapSettings.defaultLatitude,
        zoom: parseFloat(router.query.zoom as string) || mapSettings.defaultZoom,
      });
    }
  }, []);

  const [, setQuery] = useQueryStates({
    coord: parseAsString,
    zoom: parseAsString,
  });

  // store the view state in the URL (e.g. /carte?coord=2.3429253,48.7998120&zoom=11.36)
  useDebouncedEffect(
    () => {
      if (!viewState) {
        return;
      }
      setQuery(
        {
          coord: `${viewState.longitude.toFixed(7)},${viewState.latitude.toFixed(7)}`,
          zoom: viewState.zoom.toFixed(2),
        },
        {
          shallow: true,
        }
      );
    },
    [viewState],
    500
  );

  const isRouterReady = useRouterReady();
  if (!isRouterReady || !isMapConfigurationInitialized(mapConfiguration)) {
    return null;
  }

  const initialViewState: ViewState = {
    longitude: initialCenter ? initialCenter[0] : mapSettings.defaultLongitude,
    latitude: initialCenter ? initialCenter[1] : mapSettings.defaultLatitude,
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

  // initial fit on bbox
  if (router.query.bbox) {
    const bbox = (router.query.bbox as string).split(',').map((n) => Number.parseFloat(n)) as [number, number, number, number];

    const mapViewportFitPadding = 50; // px
    const headerHeight = 56; // px
    const mapViewportWidth = window.innerWidth - (withLegend && !legendCollapsed ? legendWidth : 0) - mapViewportFitPadding;
    const mapViewportHeight = window.innerHeight - headerHeight - mapViewportFitPadding;

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
    <Link href="/documentation/carto_sources.pdf" isExternal eventKey="Téléchargement|Carto sources">
      Sources
    </Link>
  );

  return (
    <>
      <MapStyle legendCollapsed={!withLegend || legendCollapsed} isDrawing={isDrawing} withBorder={withBorder} />
      <div className="map-wrap">
        {withLegend && (
          <>
            <CollapseLegend
              legendCollapsed={legendCollapsed}
              onClick={() => {
                trackEvent(`Carto|Légende|${legendCollapsed ? 'Ouvre' : 'Ferme'}`);
                setLegendCollapsed(!legendCollapsed);
              }}
            >
              <Tooltip placement="right" title={legendCollapsed ? 'Afficher la légende' : 'Masquer la légende'}>
                <CollapseLegendLabel>
                  <Icon size="sm" name="fr-icon-arrow-right-s-line" rotate={legendCollapsed ? -90 : 90} />
                  <span>Légende</span>
                  <Icon size="sm" name="fr-icon-arrow-right-s-line" rotate={legendCollapsed ? -90 : 90} />
                </CollapseLegendLabel>
              </Tooltip>
            </CollapseLegend>
            <LegendSideBar legendCollapsed={legendCollapsed}>
              <LegendContainer>
                <SimpleMapLegend legendTitle={legendTitle} enabledFeatures={enabledLegendFeatures} />
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
        <MapProvider>
          <MapReactGL
            initialViewState={initialViewState}
            mapStyle={carteConfig}
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
            {popupInfos && (
              <MapPopup latitude={popupInfos.latitude} longitude={popupInfos.longitude} content={popupInfos.content} type={popupType} />
            )}
            {markersList.length > 0 &&
              markersList.map((marker: MapMarkerInfos) => (
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
              ))}
          </MapReactGL>
          {withLegend && (
            <MapSearchWrapper legendCollapsed={legendCollapsed}>
              <MapSearchInputWrapper>
                <Title>Rechercher une adresse</Title>
                <MapSearchForm onAddressSelect={onAddressSelectHandle} />
              </MapSearchInputWrapper>

              {soughtAddresses.length > 0 && (
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
                >
                  <Box display="flex" flexDirection="column" gap={'8px'}>
                    {soughtAddresses.map((soughtAddress, index) => (
                      <CardSearchDetails
                        key={soughtAddress.id}
                        address={soughtAddress}
                        onClick={jumpTo}
                        onClickClose={removeSoughtAddresses}
                        onContacted={markAddressAsContacted}
                        expanded={selectedCardIndex === index}
                        setExpanded={(expanded) => setSelectedCardIndex(expanded ? index : -1)}
                      />
                    ))}
                  </Box>
                </Accordion>
              )}
            </MapSearchWrapper>
          )}
        </MapProvider>
      </div>
    </>
  );
};

export default Map;
