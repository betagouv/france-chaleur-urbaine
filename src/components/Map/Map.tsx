import MapReactGL, {
  AttributionControl,
  GeolocateControl,
  MapEvent,
  MapProvider,
  MapRef,
  MapSourceDataEvent,
  NavigationControl,
  ScaleControl,
} from 'react-map-gl';

import Hoverable from '@components/Hoverable';
import { Icon, Toggle } from '@dataesr/react-dsfr';
import { useContactFormFCU, usePersistedState } from '@hooks';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/router';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useServices } from 'src/services';
import {
  AddressDetail,
  HandleAddressSelect,
} from 'src/types/HeatNetworksResponse';
import { Point } from 'src/types/Point';
import { StoredAddress } from 'src/types/StoredAddress';
import { TypeGroupLegend } from 'src/types/TypeGroupLegend';
import { TypeLegendLogo } from 'src/types/TypeLegendLogo';
import mapParam, {
  EnergyNameOption,
  gasUsageNameOption,
  LayerNameOption,
  layerNameOptions,
  TypeLayerDisplay,
} from '../../services/Map/param';

import {
  MapMarkerInfos,
  MapPopupInfos,
  MapPopupType,
} from 'src/types/MapComponentsInfos';
import { CardSearchDetails, MapLegend, MapSearchForm } from './components';
import MapMarker from './components/MapMarker';
import MapPopup from './components/MapPopup';
import ZoneInfos from './components/SummaryBoxes';
import {
  buildingsLayerStyle,
  coldOutlineLayerStyle,
  CollapseLegend,
  demandsLayerStyle,
  energyLayerStyle,
  futurOutlineLayerStyle,
  futurZoneLayerStyle,
  gasUsageLayerStyle,
  Legend,
  LegendLogo,
  LegendLogoList,
  LegendSeparator,
  MapControlWrapper,
  MapStyle,
  objTypeEnergy,
  outlineLayerStyle,
  ProMode,
  raccordementsLayerStyle,
  zoneDPLayerStyle,
} from './Map.style';
import satelliteConfig from './satellite.config.json';
import { MapboxStyleSwitcherControl } from './StyleSwitcher';

let hoveredStateId: any;
const setHoveringState = (
  map: any,
  hover: boolean,
  source: string,
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

const addHover = (map: any, source: string, sourceLayer: string) => {
  map.current.on('mouseenter', sourceLayer, function (e: any) {
    if (e.features.length > 0) {
      setHoveringState(map.current, false, source, sourceLayer);
      hoveredStateId = e.features[0].id;
      setHoveringState(map.current, true, source, sourceLayer);
    }
  });

  map.current.on('mouseleave', sourceLayer, function () {
    setHoveringState(map.current, false, source, sourceLayer);
  });
};

const { defaultZoom, maxZoom, minZoom, minZoomData } = mapParam;

const getAddressId = (LatLng: Point) => `${LatLng.join('--')}`;

const carteConfig =
  'https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json';
const styles = [
  {
    title: 'Carte',
    uri: carteConfig,
  },
  {
    title: 'Satellite',
    uri: satelliteConfig,
  },
];

const addSource = (map: any, sourceId: string, data: any, layers: any[]) => {
  if (map.getSource(sourceId)) {
    return;
  }

  map.addSource(sourceId, data);
  layers.forEach((layer) => map.addLayer(layer));
};

const getNetworkFilter = (
  network?: string,
  filter?: any[],
  initialFilter?: any[]
) => {
  if (network) {
    return { filter: ['==', ['get', 'Identifiant reseau'], network] };
  }

  if (filter && initialFilter) {
    return { filter: ['all', filter, initialFilter] };
  }

  if (filter) {
    return {
      filter,
    };
  }

  if (initialFilter) {
    return { filter: initialFilter };
  }

  return {};
};

const Map = ({
  withoutLogo,
  withLegend,
  withDrawing,
  legendTitle,
  initialLayerDisplay,
  legendData,
  center,
  withCenterPin,
  noPopup,
  legendLogoOpt,
  setProMode,
  popupType = MapPopupType.DEFAULT,
  filter,
}: {
  withoutLogo?: boolean;
  initialLayerDisplay: TypeLayerDisplay;
  legendData?: (string | TypeGroupLegend)[];
  withLegend?: boolean;
  withDrawing?: boolean;
  center?: [number, number];
  legendTitle?: string;
  legendLogoOpt?: TypeLegendLogo;
  withCenterPin?: boolean;
  noPopup?: boolean;
  setProMode?: Dispatch<SetStateAction<boolean>>;
  popupType?: MapPopupType;
  filter?: any[];
}) => {
  const { heatNetworkService } = useServices();
  const { handleOnFetchAddress, handleOnSuccessAddress } = useContactFormFCU();

  const [drawing, setDrawing] = useState(false);
  const [collapsedCardIndex, setCollapsedCardIndex] = useState(0);
  const mapRef = useRef<MapRef>(null);
  const draw: null | { current: any } = useRef(null);
  const [popupInfos, setPopupInfos] = useState<MapPopupInfos>();
  const [markersList, setMarkersList] = useState<MapMarkerInfos[]>([]);

  const [legendCollapsed, setLegendCollapsed] = useState(true);
  useEffect(() => {
    setLegendCollapsed(window.innerWidth < 1251);
  }, []);
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.getMap().resize();
    }
  }, [mapRef, legendCollapsed]);

  const [mapState, setMapState] = useState('pending');
  const [layerDisplay, setLayerDisplay] =
    useState<TypeLayerDisplay>(initialLayerDisplay);

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

  const router = useRouter();

  const onMapClick = (e: any, key: string) => {
    const properties = e.features[0].properties;
    const { lat, lng } = e.lngLat;
    setPopupInfos({
      latitude: lat,
      longitude: lng,
      content: { [key]: properties },
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

  const jumpToWithPin = useCallback(() => {
    if (mapRef.current && center) {
      if (withCenterPin) {
        const newMarker = {
          key: getAddressId(center),
          latitude: center[1],
          longitude: center[0],
        };
        setMarkersList([newMarker]);
      }
      jumpTo({ coordinates: center, zoom: 13 });
    }
  }, [center, jumpTo, withCenterPin]);

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

      setMarkersList((current) =>
        current.filter((marker) => marker.key !== id)
      );
    },
    [setSoughtAddresses, soughtAddresses, collapsedCardIndex]
  );

  const toggleLayer = useCallback(
    (layerName: LayerNameOption) => {
      setLayerDisplay({
        ...layerDisplay,
        [layerName]: !layerDisplay?.[layerName] ?? false,
      });
    },
    [layerDisplay]
  );

  const toogleEnergyVisibility = useCallback(
    (energyName: EnergyNameOption) => {
      const availableEnergy = new Set(layerDisplay.energy);
      if (availableEnergy.has(energyName)) {
        availableEnergy.delete(energyName);
      } else {
        availableEnergy.add(energyName);
      }
      setLayerDisplay({
        ...layerDisplay,
        energy: Array.from(availableEnergy),
      });
    },
    [layerDisplay]
  );

  const toogleGasUsageVisibility = useCallback(
    (gasUsageName: gasUsageNameOption) => {
      const availableGasUsage = new Set(layerDisplay.gasUsage);
      if (availableGasUsage.has(gasUsageName)) {
        availableGasUsage.delete(gasUsageName);
      } else {
        availableGasUsage.add(gasUsageName);
      }
      setLayerDisplay({
        ...layerDisplay,
        gasUsage: Array.from(availableGasUsage),
      });
    },
    [layerDisplay]
  );

  const toogleGasUsageGroupeVisibility = useCallback(() => {
    setLayerDisplay({
      ...layerDisplay,
      gasUsageGroup: !layerDisplay.gasUsageGroup,
    });
  }, [layerDisplay]);

  const loadFilters = useCallback(() => {
    if (!mapRef.current) {
      return;
    }
    layerNameOptions.forEach((layerId) => {
      if (mapRef.current?.getMap().getLayer(layerId)) {
        if (layerId === 'futurOutline') {
          mapRef.current
            .getMap()
            .setLayoutProperty(
              'futurZone',
              'visibility',
              layerDisplay[layerId] ? 'visible' : 'none'
            );
        }
        mapRef.current
          .getMap()
          .setLayoutProperty(
            layerId,
            'visibility',
            layerDisplay[layerId] ? 'visible' : 'none'
          );
      } else {
        console.warn(`Layer '${layerId}' is not set on map`);
      }
    });

    // Energy
    const TYPE_ENERGY = 'energie_utilisee';
    const energyFilter = layerDisplay.energy.flatMap(
      (energyName: 'gas' | 'fuelOil') =>
        objTypeEnergy[energyName].map((energyLabel: string) => {
          const values =
            energyName === 'gas'
              ? layerDisplay.energyGasValues
              : layerDisplay.energyFuelValues;

          return [
            'all',
            values
              ? [
                  'all',
                  ['>=', ['get', 'nb_logements'], values[0]],
                  ['<=', ['get', 'nb_logements'], values[1]],
                ]
              : true,
            ['==', ['get', TYPE_ENERGY], energyLabel],
          ];
        })
    );
    mapRef.current.getMap().setFilter('energy', ['any', ...energyFilter]);

    // GasUsage
    const TYPE_GAS = 'code_grand';
    const gasUsageFilter = layerDisplay.gasUsage.map((gasUsageName) => [
      '==',
      ['get', TYPE_GAS],
      gasUsageName,
    ]);
    mapRef.current
      .getMap()
      .setFilter(
        'gasUsage',
        layerDisplay.gasUsageGroup && [
          'all',
          layerDisplay.gasUsageValues
            ? [
                'all',
                ['>=', ['get', 'conso_nb'], layerDisplay.gasUsageValues[0]],
                ['<=', ['get', 'conso_nb'], layerDisplay.gasUsageValues[1]],
              ]
            : true,
          ['any', ...gasUsageFilter],
        ]
      );
  }, [mapRef, layerDisplay]);

  useEffect(() => {
    if (withDrawing && draw.current === null && mapRef.current) {
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
      });
      mapRef.current.addControl(draw.current);
    }
  }, [withDrawing, mapRef, draw]);

  const onLoadMap = (e: MapEvent) => {
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

    const clickEvents = [
      { name: 'outline', key: 'network' },
      { name: 'coldOutline', key: 'coldNetwork' },
      { name: 'futurOutline', key: 'futurNetwork' },
      { name: 'futurZone', key: 'futurNetwork' },
      {
        name: 'demands',
        key: 'demands',
      },
      { name: 'buildings', key: 'buildings' },
      { name: 'gasUsage', key: 'consommation' },
      { name: 'energy', key: 'energy' },
      { name: 'raccordements', key: 'raccordement' },
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

      if (mapRef) {
        addHover(mapRef, 'heatNetwork', 'outline');
        addHover(mapRef, 'heatFuturNetwork', 'futurOutline');
        addHover(mapRef, 'coldNetwork', 'coldOutline');
        jumpToWithPin();
      }
    });
  };

  const onSourceDataMap = (e: MapSourceDataEvent) => {
    if (mapState === 'loaded' || !mapRef.current) {
      return;
    }

    if (
      (e.sourceId === 'openmaptiles' || e.sourceId === 'raster-tiles') &&
      e.isSourceLoaded
    ) {
      const network = router.query.network as string;

      // ---------------
      // --- Zone DP ---
      // ---------------
      addSource(
        e.target,
        'zoneDP',
        {
          type: 'vector',
          tiles: ['/api/map/zoneDP/{z}/{x}/{y}'],
        },
        [
          {
            id: 'zoneDP',
            source: 'zoneDP',
            'source-layer': 'zoneDP',
            ...zoneDPLayerStyle,
          },
        ]
      );

      // --------------------
      // --- Heat Network ---
      // --------------------
      addSource(
        e.target,
        'coldNetwork',
        {
          type: 'vector',
          tiles: [`${origin}/api/map/coldNetwork/{z}/{x}/{y}`],
        },
        [
          {
            id: 'coldOutline',
            source: 'coldNetwork',
            'source-layer': 'coldOutline',
            ...coldOutlineLayerStyle,
            ...getNetworkFilter(network, filter),
          },
        ]
      );

      addSource(
        e.target,
        'heatFuturNetwork',
        {
          type: 'vector',
          tiles: [`${origin}/api/map/futurNetwork/{z}/{x}/{y}`],
        },
        [
          {
            id: 'futurZone',
            source: 'heatFuturNetwork',
            'source-layer': 'futurOutline',
            ...getNetworkFilter(undefined, filter, [
              '==',
              ['get', 'is_zone'],
              true,
            ]),
            ...futurZoneLayerStyle,
          },
          {
            id: 'futurOutline',
            source: 'heatFuturNetwork',
            'source-layer': 'futurOutline',
            ...getNetworkFilter(undefined, filter, [
              '==',
              ['get', 'is_zone'],
              false,
            ]),

            ...futurOutlineLayerStyle,
          },
        ]
      );
      addSource(
        e.target,
        'heatNetwork',
        {
          type: 'vector',
          tiles: [`${origin}/api/map/network/{z}/{x}/{y}`],
        },
        [
          {
            id: 'outline',
            source: 'heatNetwork',
            'source-layer': 'outline',
            ...outlineLayerStyle,
            ...getNetworkFilter(network, filter),
          },
        ]
      );

      // -----------------
      // --- Buildings ---
      // -----------------
      addSource(
        e.target,
        'buildings',
        {
          type: 'vector',
          tiles: [`${origin}/api/map/buildings/{z}/{x}/{y}`],
          maxzoom: maxZoom,
          minzoom: minZoomData,
        },
        [
          {
            id: 'buildings',
            source: 'buildings',
            'source-layer': 'buildings',
            ...buildingsLayerStyle,
          },
        ]
      );

      // -----------------
      // --- Gas Usage ---
      // -----------------
      addSource(
        e.target,
        'gasUsage',
        {
          type: 'vector',
          tiles: [`${origin}/api/map/gas/{z}/{x}/{y}`],
          maxzoom: maxZoom,
          minzoom: minZoomData,
        },
        [
          {
            id: 'gasUsage',
            source: 'gasUsage',
            'source-layer': 'gasUsage',
            ...gasUsageLayerStyle,
          },
        ]
      );

      // --------------
      // --- Energy ---
      // --------------
      addSource(
        e.target,
        'energy',
        {
          type: 'vector',
          tiles: [`${origin}/api/map/energy/{z}/{x}/{y}`],
          maxzoom: maxZoom,
          minzoom: minZoomData,
        },
        [
          {
            id: 'energy',
            source: 'energy',
            'source-layer': 'energy',
            ...energyLayerStyle,
          },
        ]
      );

      // -----------------
      // --- Demands ---
      // -----------------
      addSource(
        e.target,
        'demands',
        {
          type: 'vector',
          tiles: [`${origin}/api/map/demands/{z}/{x}/{y}`],
        },
        [
          {
            id: 'demands',
            source: 'demands',
            'source-layer': 'demands',
            ...demandsLayerStyle,
          },
        ]
      );

      // -----------------
      // --- Raccordements ---
      // -----------------
      addSource(
        e.target,
        'raccordements',
        {
          type: 'vector',
          tiles: [`${origin}/api/map/raccordements/{z}/{x}/{y}`],
          maxzoom: maxZoom,
          minzoom: minZoomData,
        },
        [
          {
            id: 'raccordements',
            source: 'raccordements',
            'source-layer': 'raccordements',
            ...raccordementsLayerStyle,
          },
        ]
      );
      setMapState('loaded');
    }
  };

  useEffect(() => {
    const { id } = router.query;
    if (!id || !mapRef.current) {
      return;
    }

    heatNetworkService.bulkEligibilityValues(id as string).then((response) => {
      if (response.result) {
        const newMarkersList: MapMarkerInfos[] = [];
        response.result.forEach((address) => {
          const newMarker = {
            key: getAddressId([address.lon, address.lat]),
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
    jumpToWithPin();
  }, [center, jumpToWithPin]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const { coord, zoom, id } = router.query;
    if (coord) {
      const coordinates = (coord as string)
        .split(',')
        .map((point: string) => parseFloat(point)) as [number, number];

      jumpTo({
        coordinates,
        zoom: zoom ? parseInt(zoom as string, 10) : 12,
      });
    } else if (!center && !id && navigator.geolocation) {
      if (navigator.permissions) {
        navigator.permissions
          .query({ name: 'geolocation' })
          .then(({ state }) => {
            if (state === 'granted' || state === 'prompt') {
              navigator.geolocation.getCurrentPosition((pos) => {
                const { longitude, latitude } = pos.coords;
                jumpTo({ coordinates: [longitude, latitude], zoom: 12 });
              });
            }
          });
      } else {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { longitude, latitude } = pos.coords;
          jumpTo({ coordinates: [longitude, latitude], zoom: 12 });
        });
      }
    }
  }, [jumpTo, center, router]);

  useEffect(() => {
    let shouldUpdate = false;
    const newMarkersList: MapMarkerInfos[] = markersList;
    const newSoughtAddresses = soughtAddresses.map(
      (sAddress: any | never[]) => {
        if (mapRef.current) {
          const id = sAddress.id;
          const markerIndex = newMarkersList.findIndex(
            (marker) => marker.key === id
          );
          if (markerIndex == -1) {
            const newMarker = {
              key: sAddress.id,
              latitude: sAddress.coordinates[1],
              longitude: sAddress.coordinates[0],
            };
            newMarkersList.push(newMarker);
            shouldUpdate = true;
          }
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

    loadFilters();
  }, [loadFilters, mapState]);

  return (
    <>
      <MapStyle
        legendCollapsed={!withLegend || legendCollapsed}
        drawing={drawing}
        withProMode={!!setProMode}
      />
      <div className="map-wrap">
        {withLegend && (
          <>
            <CollapseLegend
              legendCollapsed={legendCollapsed}
              onClick={() => setLegendCollapsed(!legendCollapsed)}
            >
              <Hoverable position="right">
                {legendCollapsed ? 'Afficher la légende' : 'Masquer la légende'}
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
            <Legend legendCollapsed={legendCollapsed} withoutLogo={withoutLogo}>
              <MapSearchForm onAddressSelect={onAddressSelectHandle} />
              <LegendSeparator />
              {soughtAddresses.length > 0 && (
                <>
                  {soughtAddresses
                    .map((soughtAddress, index) => (
                      <CardSearchDetails
                        key={soughtAddress.id}
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
                    ))
                    .reverse()}
                  <LegendSeparator />
                </>
              )}
              <MapLegend
                legendTitle={legendTitle}
                data={legendData || mapParam.legendData}
                onToogleFeature={toggleLayer}
                onToogleInGroup={(groupeName: string, idEntry?: any) => {
                  switch (groupeName) {
                    case 'energy': {
                      toogleEnergyVisibility(idEntry as 'gas' | 'fuelOil');
                      break;
                    }
                    case 'gasUsage': {
                      toogleGasUsageVisibility(idEntry as 'R' | 'T' | 'I');
                      break;
                    }
                    case 'gasUsageGroup': {
                      toogleGasUsageGroupeVisibility();
                      break;
                    }
                  }
                }}
                onValuesChange={(
                  groupName: string,
                  idEntry: string,
                  values: [number, number]
                ) => {
                  switch (groupName) {
                    case 'energy': {
                      idEntry === 'gas'
                        ? setLayerDisplay({
                            ...layerDisplay,
                            energyGasValues: values,
                          })
                        : setLayerDisplay({
                            ...layerDisplay,
                            energyFuelValues: values,
                          });
                      break;
                    }
                    case 'gasUsage': {
                      setLayerDisplay({
                        ...layerDisplay,
                        gasUsageValues: values,
                      });
                      break;
                    }
                  }
                }}
                layerDisplay={layerDisplay}
              />
            </Legend>
            {!withoutLogo && (
              <LegendLogoList legendCollapsed={legendCollapsed}>
                <LegendLogo>
                  <img
                    src="/logo-fcu-with-typo.jpg"
                    alt="logo france chaleur urbaine"
                  />
                </LegendLogo>
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
              draw={draw.current}
              setDrawing={setDrawing}
            />
          </MapControlWrapper>
        )}
        {setProMode && (
          <ProMode legendCollapsed={!withLegend || legendCollapsed}>
            <Toggle
              label="Mode professionnel"
              hasLabelLeft
              onChange={(e) => {
                setLayerDisplay(
                  e.target.checked
                    ? mapParam.defaultLayerDisplay
                    : initialLayerDisplay
                );
                setProMode(e.target.checked);
              }}
            />
          </ProMode>
        )}
        <MapProvider>
          <MapReactGL
            initialViewState={{
              latitude: mapParam.lat,
              longitude: mapParam.lng,
              zoom: defaultZoom,
            }}
            mapLib={maplibregl}
            mapStyle={carteConfig}
            attributionControl={false}
            maxZoom={maxZoom}
            minZoom={minZoom}
            onLoad={onLoadMap}
            onSourceData={onSourceDataMap}
            ref={mapRef}
          >
            <GeolocateControl fitBoundsOptions={{ maxZoom: 13 }} />
            <NavigationControl
              showZoom={true}
              visualizePitch={true}
              position="top-left"
            />
            <AttributionControl compact={false} position="bottom-right" />
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
                  key={marker.key}
                  longitude={marker.longitude}
                  latitude={marker.latitude}
                  color={marker.color}
                  popup={marker.popup}
                  popupContent={marker.popupContent}
                />
              ))}
          </MapReactGL>
        </MapProvider>
      </div>
    </>
  );
};

export default Map;
