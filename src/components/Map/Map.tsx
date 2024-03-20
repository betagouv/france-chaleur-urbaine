import MapReactGL, {
  AttributionControl,
  GeolocateControl,
  MapProvider,
  MapRef,
  MapSourceDataEvent,
  NavigationControl,
  ScaleControl,
} from 'react-map-gl/maplibre';

import Hoverable from '@components/Hoverable';
import { Icon } from '@dataesr/react-dsfr';
import { useContactFormFCU, usePersistedState } from '@hooks';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useServices } from 'src/services';
import {
  AddressDetail,
  HandleAddressSelect,
} from 'src/types/HeatNetworksResponse';
import { Point } from 'src/types/Point';
import { StoredAddress } from 'src/types/StoredAddress';
import { TypeLegendLogo } from 'src/types/TypeLegendLogo';
import {
  MapMarkerInfos,
  MapPopupInfos,
  MapPopupType,
} from 'src/types/MapComponentsInfos';
import MapMarker from './components/MapMarker';
import MapPopup from './components/MapPopup';
import ZoneInfos from './components/SummaryBoxes';
import {
  CollapseLegend,
  LegendSideBar,
  LegendContainer,
  LegendLogo,
  LegendLogoLink,
  LegendLogoList,
  LegendSeparator,
  MapControlWrapper,
  MapStyle,
  TopLegend,
  TopLegendSwitch,
} from './Map.style';
import satelliteConfig from './satellite.config.json';
import {
  MapboxStyleDefinition,
  MapboxStyleSwitcherControl,
} from './StyleSwitcher';
import {
  ExpressionSpecification,
  MapGeoJSONFeature,
  MapLibreEvent,
} from 'maplibre-gl';
import { trackEvent } from 'src/services/analytics';
import debounce from '@utils/debounce';
import SimpleMapLegend, {
  MapLegendFeature,
} from './components/SimpleMapLegend';
import { MapLayerMouseEvent } from 'react-map-gl';
import {
  MapConfiguration,
  defaultMapConfiguration,
} from 'src/services/Map/map-configuration';
import {
  LayerId,
  SourceId,
  applyMapConfigurationToLayers,
  buildMapLayers,
} from './map-layers';
import Box from '@components/ui/Box';
import useRouterReady from '@hooks/useRouterReady';
import MapSearchForm from './components/MapSearchForm';
import CardSearchDetails from './components/CardSearchDetails';

const mapSettings = {
  defaultLongitude: 2.3,
  defaultLatitude: 47,
  defaultZoom: 5,
  minZoom: 5,
  maxZoom: 20,
};

let hoveredStateId: MapGeoJSONFeature['id'] | null = null;

/**
 * The hover state is used in the layers to change the style of the feature using ['feature-state', 'hover']
 */
const setFeatureHoveringState = (
  map: MapRef,
  hover: boolean,
  source: SourceId,
  sourceLayer: string
) => {
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

type HoverConfig = {
  source: SourceId;
  sourceLayer: string;
  layer: LayerId;
};

const addLayerHoverListeners = (map: MapRef, config: HoverConfig) => {
  map.on('mouseenter', config.layer, function (e) {
    if (e.features && e.features.length > 0) {
      setFeatureHoveringState(map, false, config.source, config.sourceLayer);
      hoveredStateId = e.features[0].id;
      setFeatureHoveringState(map, true, config.source, config.sourceLayer);
    }
  });

  map.on('mouseleave', config.layer, function () {
    setFeatureHoveringState(map, false, config.source, config.sourceLayer);
  });
};

const getAddressId = (LatLng: Point) => `${LatLng.join('--')}`;

const carteConfig =
  'https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json';
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

const Map = ({
  withoutLogo,
  withLegend,
  withHideLegendSwitch,
  withDrawing,
  withBorder,
  legendTitle,
  initialMapConfiguration,
  enabledLegendFeatures,
  withCenterPin,
  noPopup,
  legendLogoOpt,
  proMode,
  setProMode,
  popupType = MapPopupType.DEFAULT,
  filter,
  pinsList,
  initialCenter,
  initialZoom,
  geolocDisabled,
  withFCUAttribution,
  persistViewStateInURL,
}: {
  withoutLogo?: boolean;
  initialMapConfiguration?: MapConfiguration;
  enabledLegendFeatures?: MapLegendFeature[];
  withLegend?: boolean;
  withHideLegendSwitch?: boolean;
  withDrawing?: boolean;
  withBorder?: boolean;
  legendTitle?: string;
  legendLogoOpt?: TypeLegendLogo;
  withCenterPin?: boolean;
  noPopup?: boolean;
  proMode?: boolean;
  setProMode?: (proMode: boolean) => void;
  popupType?: MapPopupType;
  filter?: ExpressionSpecification; // layer filter used to filter networks of a company
  pinsList?: MapMarkerInfos[];
  initialCenter?: [number, number];
  initialZoom?: number;
  geolocDisabled?: boolean;
  withFCUAttribution?: boolean;
  persistViewStateInURL?: boolean;
}) => {
  const router = useRouter();

  const { heatNetworkService } = useServices();
  const { handleOnFetchAddress, handleOnSuccessAddress } = useContactFormFCU();

  const [mapConfiguration, setMapConfiguration] = useState<MapConfiguration>(
    initialMapConfiguration ?? defaultMapConfiguration
  );

  const [draw, setDraw] = useState<any>();
  const [drawing, setDrawing] = useState(false);
  const [collapsedCardIndex, setCollapsedCardIndex] = useState(0);
  const mapRef = useRef<MapRef>(null);
  const [popupInfos, setPopupInfos] = useState<MapPopupInfos>();
  const [markersList, setMarkersList] = useState<MapMarkerInfos[]>([]);

  const [legendCollapsed, setLegendCollapsed] = useState(true);
  useEffect(() => {
    setLegendCollapsed(window.innerWidth < 992);
  }, []);

  // resize the map when the container renders
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.getMap().resize();
    }
  }, [mapRef.current, legendCollapsed]);

  const [mapState, setMapState] = useState<'pending' | 'loaded'>('pending');

  useEffect(() => {
    if (setProMode) {
      setMapConfiguration({
        ...mapConfiguration,
        proMode: !!proMode,
      });
    }
  }, [proMode, setMapConfiguration]);

  const [soughtAddresses, setSoughtAddresses] = usePersistedState(
    'mapSoughtAddresses',
    [] as StoredAddress[],
    {
      beforeStorage: (value: any) => {
        const newValue = value.map((address: any) => {
          return address;
        });
        return newValue;
      },
    }
  );

  const onMapClick = (e: MapLayerMouseEvent, key: string) => {
    const selectedFeature = e.features?.[0];
    if (!selectedFeature) {
      return;
    }
    if ((window as any).devMode) {
      console.log('map-click', selectedFeature); // eslint-disable-line no-console
    }

    // depending on the feature type, we force the popup type to help building the popup content more easily
    setPopupInfos({
      latitude: e.lngLat.lat,
      longitude: e.lngLat.lng,
      content: ['zonesPotentielChaud', 'zonesPotentielFortChaud'].includes(
        selectedFeature.source
      )
        ? {
            type: selectedFeature.source,
            properties: selectedFeature.properties,
          }
        : { [key]: selectedFeature.properties },
    });
  };

  const jumpTo = useCallback(
    ({
      coordinates,
      zoom,
    }: {
      coordinates: [number, number];
      zoom?: number;
    }) => {
      if (mapRef.current) {
        mapRef.current.jumpTo({
          center: { lon: coordinates[0], lat: coordinates[1] },
          zoom: zoom || 16,
        });
      }
    },
    []
  );

  const markAddressAsContacted = (address: Partial<StoredAddress>) => {
    setSoughtAddresses(
      soughtAddresses.map((addr) =>
        addr.id === address.id ? { ...addr, contacted: true } : addr
      )
    );
  };

  const onAddressSelectHandle: HandleAddressSelect = useCallback(
    (address: string, coordinates: Point, addressDetails: AddressDetail) => {
      const search = {
        date: Date.now(),
      };
      const id = getAddressId(coordinates);
      const existingAddress = soughtAddresses.findIndex(
        ({ id: soughtAddressesId }) => soughtAddressesId === id
      );

      if (existingAddress === -1) {
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
        setSoughtAddresses([...soughtAddresses, newAddress]);
        setCollapsedCardIndex(0);
      } else {
        setCollapsedCardIndex(soughtAddresses.length - 1 - existingAddress);
      }

      jumpTo({ coordinates });
    },
    [
      handleOnFetchAddress,
      handleOnSuccessAddress,
      jumpTo,
      setSoughtAddresses,
      soughtAddresses,
    ]
  );

  const removeSoughtAddresses = useCallback(
    (result: { coordinates?: Point }) => {
      if (!result.coordinates) {
        return;
      }

      const id = getAddressId(result.coordinates);
      const addressIndex = soughtAddresses.findIndex(
        ({ coordinates }) => getAddressId(coordinates) === id
      );

      if (collapsedCardIndex === soughtAddresses.length - 1 - addressIndex) {
        setCollapsedCardIndex(-1);
      }

      soughtAddresses.splice(addressIndex, 1);
      setSoughtAddresses([...soughtAddresses]);

      setMarkersList((current) => current.filter((marker) => marker.id !== id));
    },
    [setSoughtAddresses, soughtAddresses, collapsedCardIndex]
  );

  const onMapLoad = (e: MapLibreEvent) => {
    const drawControl = new MapboxDraw({
      displayControlsDefault: false,
    });

    e.target.addControl(drawControl as any);
    setDraw(drawControl);
    e.target.addControl(
      new MapboxStyleSwitcherControl(styles, {
        defaultStyle: 'Carte',
        eventListeners: {
          onChange: () => {
            setMapState('pending');
            return true;
          },
        },
      })
    );

    const clickEvents: {
      name: LayerId;
      key: string;
    }[] = [
      { name: 'zonesPotentielChaud', key: 'zonesPotentielChaud' },
      { name: 'zonesPotentielFortChaud', key: 'zonesPotentielFortChaud' },
      { name: 'reseauxDeChaleur-avec-trace', key: 'network' },
      { name: 'reseauxDeChaleur-sans-trace', key: 'network' },
      { name: 'reseauxDeFroid-avec-trace', key: 'coldNetwork' },
      { name: 'reseauxDeFroid-sans-trace', key: 'coldNetwork' },
      { name: 'reseauxEnConstruction-trace', key: 'futurNetwork' },
      { name: 'reseauxEnConstruction-zone', key: 'futurNetwork' },
      {
        name: 'demandesEligibilite',
        key: 'demands',
      },
      { name: 'caracteristiquesBatiments', key: 'buildings' },
      { name: 'consommationsGaz', key: 'consommation' },
      { name: 'energy', key: 'energy' },
      { name: 'batimentsRaccordes', key: 'raccordement' },
    ];

    e.target.loadImage('/icons/rect.png', (error, image) => {
      if (error) {
        throw error;
      }

      setMapState('loaded');
      if (image) {
        e.target.addImage('energy-picto', image, { sdf: true });
      }

      if (!noPopup) {
        clickEvents.map(({ name, key }) => {
          e.target.on('click', name, (e: any) => {
            onMapClick(e, key);
          });

          e.target.on('touchend', name, (e: any) => {
            onMapClick(e, key);
          });

          e.target.on('mouseenter', name, function () {
            e.target.getCanvas().style.cursor = 'pointer';
          });

          e.target.on('mouseleave', name, function () {
            e.target.getCanvas().style.cursor = '';
          });
        });
      }

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

        addLayerHoverListeners(map, {
          layer: 'reseauxDeChaleur-avec-trace',
          source: 'network',
          sourceLayer: 'outline',
        });
        addLayerHoverListeners(map, {
          layer: 'reseauxEnConstruction-trace',
          source: 'futurNetwork',
          sourceLayer: 'futurOutline',
        });
        addLayerHoverListeners(map, {
          layer: 'reseauxDeFroid-avec-trace',
          source: 'coldNetwork',
          sourceLayer: 'coldOutline',
        });
      }
    });
  };

  const onMapSourceData = (e: MapSourceDataEvent) => {
    const map = mapRef.current?.getMap();
    if (mapState === 'loaded' || !map) {
      return;
    }

    if (
      (e.sourceId === 'openmaptiles' || e.sourceId === 'raster-tiles') &&
      e.isSourceLoaded &&
      e.tile
    ) {
      const network = router.query.network as string;

      buildMapLayers(network, filter).forEach((spec) => {
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

      setMapState('loaded');
    }
  };

  useEffect(() => {
    const { id } = router.query;
    if (!id) {
      return;
    }

    heatNetworkService.bulkEligibilityValues(id as string).then((response) => {
      if (response.result) {
        const newMarkersList: MapMarkerInfos[] = [];
        response.result.forEach((address) => {
          const newMarker = {
            id: getAddressId([address.lon, address.lat]),
            latitude: address.lat,
            longitude: address.lon,
            color: address.isEligible ? 'green' : 'red',
            popup: true,
            popupContent: address.label,
          };
          newMarkersList.push(newMarker);
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
      jumpTo({ coordinates: initialCenter });
    }
  }, [initialCenter, jumpTo, withCenterPin]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const { coord, id } = router.query;
    if (
      !geolocDisabled &&
      !coord &&
      !initialCenter &&
      !id &&
      navigator.geolocation
    ) {
      if (navigator.permissions) {
        navigator.permissions
          .query({ name: 'geolocation' })
          .then(({ state }) => {
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
    const newSoughtAddresses = soughtAddresses.map(
      (sAddress: any | never[]) => {
        const id = sAddress.id;
        const markerIndex = newMarkersList.findIndex(
          (marker) => marker.id === id
        );
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
      }
    );
    if (shouldUpdate) {
      setSoughtAddresses(newSoughtAddresses);
      setMarkersList(newMarkersList);
    }
  }, [markersList, setMarkersList, setSoughtAddresses, soughtAddresses]);

  useEffect(() => {
    if (mapState === 'pending') {
      return;
    }

    const map = mapRef.current?.getMap();
    if (map) {
      applyMapConfigurationToLayers(map, mapConfiguration);
    }
  }, [mapState, mapRef, mapConfiguration]);

  useEffect(() => {
    if (pinsList) {
      if (pinsList.length > 0) {
        const centerPin: [number, number] = [
          pinsList[0].longitude,
          pinsList[0].latitude,
        ];
        jumpTo({ coordinates: centerPin, zoom: 8 });
      }
      setMarkersList(pinsList);
    }
  }, [jumpTo, pinsList]);

  const [viewState, setViewState] = useState<ViewState | null>(null);
  useEffect(() => {
    if (persistViewStateInURL && router.query.coord) {
      const [lng, lat] = (router.query.coord as string).split(',');
      setViewState({
        longitude: parseFloat(lng) || mapSettings.defaultLongitude,
        latitude: parseFloat(lat) || mapSettings.defaultLatitude,
        zoom:
          parseFloat(router.query.zoom as string) || mapSettings.defaultZoom,
      });
    }
  }, []);

  // store the view state in the URL (e.g. /carte?coord=2.3429253,48.7998120&zoom=11.36)
  // also store the proMode
  const updateLocationURL = useMemo(
    () =>
      debounce((viewState: ViewState, proMode: boolean) => {
        router.replace(
          {
            search: `coord=${viewState.longitude.toFixed(
              7
            )},${viewState.latitude.toFixed(7)}&zoom=${viewState.zoom.toFixed(
              2
            )}&proMode=${proMode}`,
          },
          undefined,
          {
            shallow: true,
          }
        );
      }, 500),
    []
  );

  useEffect(() => {
    if (viewState) {
      updateLocationURL(viewState, !!proMode);
    }
  }, [updateLocationURL, viewState, proMode]);

  const isRouterReady = useRouterReady();
  if (!isRouterReady) {
    return null;
  }

  const initialViewState: ViewState = {
    longitude: initialCenter ? initialCenter[0] : mapSettings.defaultLongitude,
    latitude: initialCenter ? initialCenter[1] : mapSettings.defaultLatitude,
    zoom: initialZoom || mapSettings.defaultZoom,
  };

  if (router.query.coord) {
    const [lng, lat] = (router.query.coord as string).split(',');
    initialViewState.longitude =
      parseFloat(lng) || mapSettings.defaultLongitude;
    initialViewState.latitude = parseFloat(lat) || mapSettings.defaultLatitude;
    initialViewState.zoom = initialZoom || 13;
  }

  if (router.query.zoom) {
    initialViewState.zoom =
      parseFloat(router.query.zoom as string) ?? mapSettings.defaultZoom;
  }

  return (
    <>
      <MapStyle
        legendCollapsed={!withLegend || legendCollapsed}
        drawing={drawing}
        withTopLegend={!!setProMode || withHideLegendSwitch}
        withProMode={!!setProMode}
        withHideLegendSwitch={withHideLegendSwitch}
        withBorder={withBorder}
      />
      <div className="map-wrap">
        {withLegend && (
          <>
            {!withHideLegendSwitch && (
              <CollapseLegend
                legendCollapsed={legendCollapsed}
                onClick={() => setLegendCollapsed(!legendCollapsed)}
              >
                <Hoverable position="right">
                  {legendCollapsed
                    ? 'Afficher la légende'
                    : 'Masquer la légende'}
                </Hoverable>
                <Icon
                  size="2x"
                  name={
                    legendCollapsed
                      ? 'ri-arrow-right-s-fill'
                      : 'ri-arrow-left-s-fill'
                  }
                />
              </CollapseLegend>
            )}
            <LegendSideBar
              legendCollapsed={legendCollapsed}
              withHideLegendSwitch={withHideLegendSwitch}
            >
              <LegendContainer withoutLogo={withoutLogo}>
                <Box m="2w">
                  <MapSearchForm onAddressSelect={onAddressSelectHandle} />
                </Box>
                <LegendSeparator />
                {soughtAddresses.length > 0 && (
                  <>
                    {soughtAddresses
                      .map((soughtAddress, index) => (
                        <Box mx="2w" key={soughtAddress.id}>
                          <CardSearchDetails
                            address={soughtAddress}
                            onClick={jumpTo}
                            onClickClose={removeSoughtAddresses}
                            onContacted={markAddressAsContacted}
                            collapsed={
                              collapsedCardIndex !==
                              soughtAddresses.length - 1 - index
                            }
                            setCollapsed={(collapsed) => {
                              if (collapsed) {
                                setCollapsedCardIndex(-1);
                              } else {
                                setCollapsedCardIndex(
                                  soughtAddresses.length - 1 - index
                                );
                              }
                            }}
                          />
                        </Box>
                      ))
                      .reverse()}
                    <LegendSeparator />
                  </>
                )}
                <SimpleMapLegend
                  mapConfiguration={mapConfiguration}
                  legendTitle={legendTitle}
                  enabledFeatures={enabledLegendFeatures}
                  onMapConfigurationChange={(config) =>
                    setMapConfiguration(config)
                  }
                />
              </LegendContainer>
            </LegendSideBar>
            {!withoutLogo && (
              <LegendLogoList legendCollapsed={legendCollapsed}>
                <LegendLogoLink
                  href="https://france-chaleur-urbaine.beta.gouv.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/logo-fcu-with-typo.jpg"
                    alt="logo france chaleur urbaine"
                  />
                </LegendLogoLink>
                {legendLogoOpt && (
                  <LegendLogo>
                    <img src={legendLogoOpt.src} alt={legendLogoOpt.alt} />
                  </LegendLogo>
                )}
              </LegendLogoList>
            )}
          </>
        )}
        {withDrawing && mapRef.current && (
          <MapControlWrapper legendCollapsed={legendCollapsed}>
            <ZoneInfos
              map={mapRef.current}
              draw={draw}
              setDrawing={setDrawing}
            />
          </MapControlWrapper>
        )}
        {(setProMode || withHideLegendSwitch) && (
          <TopLegend legendCollapsed={!withLegend || legendCollapsed}>
            {setProMode && (
              <TopLegendSwitch
                legendCollapsed={legendCollapsed}
                isProMode={true}
              >
                <div className="fr-toggle fr-toggle--label-left">
                  <input
                    type="checkbox"
                    checked={proMode}
                    id="mode-pro-toggle"
                    onChange={(e) => {
                      setProMode(e.target.checked);
                      e.target.checked && trackEvent('Carto|Active Pro Mode');
                    }}
                    className="fr-toggle__input"
                  />
                  <label
                    className="fr-toggle__label"
                    htmlFor={'mode-pro-toggle'}
                    data-fr-checked-label="Activé"
                    data-fr-unchecked-label="Désactivé"
                  >
                    Mode professionnel
                  </label>
                </div>
              </TopLegendSwitch>
            )}
            {withHideLegendSwitch && (
              <TopLegendSwitch legendCollapsed={legendCollapsed}>
                <div className="fr-toggle fr-toggle--label-left">
                  <input
                    type="checkbox"
                    checked={!legendCollapsed}
                    id="top-switch-legend-toggle"
                    onChange={(e) => {
                      setLegendCollapsed(!e.target.checked);
                    }}
                    className="fr-toggle__input"
                  />
                  <label
                    className="fr-toggle__label"
                    htmlFor={'top-switch-legend-toggle'}
                    data-fr-checked-label="Activé"
                    data-fr-unchecked-label="Désactivé"
                  >
                    {legendCollapsed
                      ? 'Afficher la légende'
                      : 'Masquer la légende'}
                  </label>
                </div>
              </TopLegendSwitch>
            )}
          </TopLegend>
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
            {!geolocDisabled && (
              <GeolocateControl fitBoundsOptions={{ maxZoom: 13 }} />
            )}
            <NavigationControl
              showZoom={true}
              visualizePitch={true}
              position="top-left"
            />
            <AttributionControl
              compact={false}
              position="bottom-right"
              customAttribution={
                withFCUAttribution
                  ? "<a href='https://france-chaleur-urbaine.beta.gouv.fr/' target='_blank' rel='noopener noreferrer'>France Chaleur Urbaine</a>"
                  : undefined
              }
            />
            <ScaleControl maxWidth={100} unit="metric" position="bottom-left" />
            {popupInfos && (
              <MapPopup
                latitude={popupInfos.latitude}
                longitude={popupInfos.longitude}
                content={popupInfos.content}
                type={popupType}
              />
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
        </MapProvider>
      </div>
    </>
  );
};

export default Map;
