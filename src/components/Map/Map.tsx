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
  coldOutlineCenterLayerStyle,
  CollapseLegend,
  demandsLayerStyle,
  energyLayerStyle,
  futurOutlineLayerStyle,
  futurZoneLayerStyle,
  gasUsageLayerStyle,
  Legend,
  LegendContainer,
  LegendLogo,
  LegendLogoLink,
  LegendLogoList,
  LegendSeparator,
  MapControlWrapper,
  MapStyle,
  objTypeEnergy,
  outlineLayerStyle,
  outlineCenterLayerStyle,
  raccordementsLayerStyle,
  zoneDPLayerStyle,
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
  LayerSpecification,
  MapLibreEvent,
  SourceSpecification,
} from 'maplibre-gl';
import { trackEvent } from 'src/services/analytics';
import {
  themeDefZonePotentielChaud,
  themeDefZonePotentielFortChaud,
} from 'src/services/Map/businessRules/zonePotentielChaud';
import { MapLayerMouseEvent } from 'react-map-gl';

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

const addSource = (
  map: any,
  sourceId: string,
  data: SourceSpecification,
  layers: any[]
) => {
  if (map.getSource(sourceId)) {
    return;
  }

  map.addSource(sourceId, data);
  layers.forEach((layer) => {
    if (!layer.layout) {
      layer.layout = {};
    }
    // hide all layers by default to prevent loading them
    layer.layout.visibility = 'none';
    map.addLayer(layer);
  });
};

const getNetworkFilter = (
  network?: string,
  filter?: any[],
  initialFilter?: any[]
) => {
  const networkFilter = network
    ? ['==', ['get', 'Identifiant reseau'], network]
    : ['literal', true];
  return {
    filter: [
      'all',
      filter || ['literal', true],
      initialFilter || ['literal', true],
      networkFilter,
    ],
  };
};

const Map = ({
  withoutLogo,
  withLegend,
  withHideLegendSwitch,
  withDrawing,
  withBorder,
  legendTitle,
  initialLayerDisplay,
  legendData,
  center,
  withCenterPin,
  noPopup,
  legendLogoOpt,
  proMode,
  setProMode,
  popupType = MapPopupType.DEFAULT,
  filter,
  pinsList,
  initialZoom,
  geolocDisabled,
  withFCUAttribution,
}: {
  withoutLogo?: boolean;
  initialLayerDisplay: TypeLayerDisplay;
  legendData?: (string | TypeGroupLegend)[];
  withLegend?: boolean;
  withHideLegendSwitch?: boolean;
  withDrawing?: boolean;
  withBorder?: boolean;
  center?: [number, number];
  legendTitle?: string;
  legendLogoOpt?: TypeLegendLogo;
  withCenterPin?: boolean;
  noPopup?: boolean;
  proMode?: boolean;
  setProMode?: Dispatch<SetStateAction<boolean>>;
  popupType?: MapPopupType;
  filter?: any[];
  pinsList?: MapMarkerInfos[];
  initialZoom?: number;
  geolocDisabled?: boolean;
  withFCUAttribution?: boolean;
}) => {
  const router = useRouter();

  const { heatNetworkService } = useServices();
  const { handleOnFetchAddress, handleOnSuccessAddress } = useContactFormFCU();

  const [draw, setDraw] = useState<any>();
  const [drawing, setDrawing] = useState(false);
  const [collapsedCardIndex, setCollapsedCardIndex] = useState(0);
  const mapRef = useRef<MapRef>(null);
  const [popupInfos, setPopupInfos] = useState<MapPopupInfos>();
  const [markersList, setMarkersList] = useState<MapMarkerInfos[]>([]);

  const [legendCollapsed, setLegendCollapsed] = useState(true);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setIsReady(true);
    }
  }, [router]);

  useEffect(() => {
    setLegendCollapsed(window.innerWidth < 992);
  }, []);

  // resize the map when the container renders
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.getMap().resize();
    }
  }, [mapRef.current, legendCollapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  const [mapState, setMapState] = useState('pending');
  const [layerDisplay, setLayerDisplay] =
    useState<TypeLayerDisplay>(initialLayerDisplay);
  const [savedLayer, setSavedLayer] = useState<TypeLayerDisplay>(
    mapParam.defaultLayerDisplay
  );

  const toggleLayerDisplay = useCallback(
    (newLayerDisplay: TypeLayerDisplay) => {
      if (proMode) {
        setSavedLayer(newLayerDisplay);
      } else {
        //If not proMode keep old proMode values
        const newSavedLayer = savedLayer;
        newSavedLayer.outline = newLayerDisplay.outline;
        newSavedLayer.futurOutline = newLayerDisplay.futurOutline;
        newSavedLayer.coldOutline = newLayerDisplay.coldOutline;
        newSavedLayer.zoneDP = newLayerDisplay.zoneDP;
        setSavedLayer(newSavedLayer);
      }
      setLayerDisplay(newLayerDisplay);
    },
    [proMode, savedLayer]
  );

  const updateLayerDisplay = useCallback(
    (newLayerDisplay: TypeLayerDisplay) => {
      //Display previous values
      if (proMode) {
        setLayerDisplay(savedLayer);
      } else {
        const newLayer = newLayerDisplay;
        newLayer.outline = savedLayer.outline;
        newLayer.futurOutline = savedLayer.futurOutline;
        newLayer.coldOutline = savedLayer.coldOutline;
        newLayer.zoneDP = savedLayer.zoneDP;
        setLayerDisplay(newLayerDisplay);
      }
    },
    [proMode, savedLayer]
  );

  useEffect(() => {
    if (setProMode) {
      updateLayerDisplay(
        proMode ? mapParam.defaultLayerDisplay : mapParam.simpleLayerDisplay
      );
    }
  }, [proMode, setProMode, updateLayerDisplay]);

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

  const toggleLayer = useCallback(
    (layerName: LayerNameOption) => {
      toggleLayerDisplay({
        ...layerDisplay,
        [layerName]: !layerDisplay?.[layerName] ?? false,
      });
    },
    [layerDisplay, toggleLayerDisplay]
  );

  const toggleEnergyVisibility = useCallback(
    (energyName: EnergyNameOption) => {
      const availableEnergy = new Set(layerDisplay.energy);
      if (availableEnergy.has(energyName)) {
        availableEnergy.delete(energyName);
      } else {
        availableEnergy.add(energyName);
      }
      toggleLayerDisplay({
        ...layerDisplay,
        energy: Array.from(availableEnergy),
      });
    },
    [layerDisplay, toggleLayerDisplay]
  );

  const toggleGasUsageVisibility = useCallback(
    (gasUsageName: gasUsageNameOption) => {
      const availableGasUsage = new Set(layerDisplay.gasUsage);
      if (availableGasUsage.has(gasUsageName)) {
        availableGasUsage.delete(gasUsageName);
      } else {
        availableGasUsage.add(gasUsageName);
      }
      toggleLayerDisplay({
        ...layerDisplay,
        gasUsage: Array.from(availableGasUsage),
      });
    },
    [layerDisplay, toggleLayerDisplay]
  );

  const toggleGasUsageGroupeVisibility = useCallback(() => {
    toggleLayerDisplay({
      ...layerDisplay,
      gasUsageGroup: !layerDisplay.gasUsageGroup,
    });
  }, [layerDisplay, toggleLayerDisplay]);

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
              isLayerEnabled(layerDisplay[layerId]) ? 'visible' : 'none'
            );
        }
        if (layerId === 'outline') {
          mapRef.current
            .getMap()
            .setLayoutProperty(
              'outlineCenter',
              'visibility',
              isLayerEnabled(layerDisplay[layerId]) ? 'visible' : 'none'
            );
        }
        if (layerId === 'coldOutline') {
          mapRef.current
            .getMap()
            .setLayoutProperty(
              'coldOutlineCenter',
              'visibility',
              isLayerEnabled(layerDisplay[layerId]) ? 'visible' : 'none'
            );
        }
        if (layerId === 'zonesPotentielChaud') {
          mapRef.current
            .getMap()
            .setLayoutProperty(
              'zonesPotentielChaud-outline',
              'visibility',
              layerDisplay[layerId] ? 'visible' : 'none'
            );
        }
        if (layerId === 'zonesPotentielFortChaud') {
          mapRef.current
            .getMap()
            .setLayoutProperty(
              'zonesPotentielFortChaud-outline',
              'visibility',
              layerDisplay[layerId] ? 'visible' : 'none'
            );
        }
        mapRef.current
          .getMap()
          .setLayoutProperty(
            layerId,
            'visibility',
            isLayerEnabled(layerDisplay[layerId]) ? 'visible' : 'none'
          );
      } else {
        console.warn(`Layer '${layerId}' is not set on map`);
      }
    });

    // Energy
    const TYPE_ENERGY = 'energie_utilisee';
    const energyFilter = layerDisplay.energy.flatMap<ExpressionSpecification>(
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
    const gasUsageFilter = layerDisplay.gasUsage.map<ExpressionSpecification>(
      (gasUsageName) => ['==', ['get', TYPE_GAS], gasUsageName]
    );
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

  const onLoadMap = (e: MapLibreEvent) => {
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

    const clickEvents = [
      { name: 'zonesPotentielChaud', key: 'zonesPotentielChaud' },
      { name: 'zonesPotentielFortChaud', key: 'zonesPotentielFortChaud' },
      { name: 'outline', key: 'network' },
      { name: 'outlineCenter', key: 'network' },
      { name: 'coldOutline', key: 'coldNetwork' },
      { name: 'coldOutlineCenter', key: 'coldNetwork' },
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
      }
    });
  };

  const onSourceDataMap = (e: MapSourceDataEvent) => {
    if (mapState === 'loaded' || !mapRef.current) {
      return;
    }

    if (
      (e.sourceId === 'openmaptiles' || e.sourceId === 'raster-tiles') &&
      e.isSourceLoaded &&
      e.tile
    ) {
      const network = router.query.network as string;

      // ---------------------------
      // --- zonesPotentielChaud ---
      // ---------------------------
      addSource(
        e.target,
        'zonesPotentielChaud',
        {
          type: 'vector',
          tiles: [`${origin}/api/map/zonesPotentielChaud/{z}/{x}/{y}`],
          maxzoom: 17,
          promoteId: 'ID_ZONE',
          attribution:
            '<a href="https://reseaux-chaleur.cerema.fr/espace-documentaire/enrezo" target="_blank">Cerema</a>',
        },
        [
          {
            id: 'zonesPotentielChaud',
            source: 'zonesPotentielChaud',
            'source-layer': 'layer',
            type: 'fill',
            paint: {
              'fill-color': themeDefZonePotentielChaud.fill.color,
              'fill-opacity': themeDefZonePotentielChaud.fill.opacity,
            },
          },
          {
            id: 'zonesPotentielChaud-outline',
            source: 'zonesPotentielChaud',
            'source-layer': 'layer',
            type: 'line',
            paint: {
              'line-color': themeDefZonePotentielChaud.fill.color,
              'line-width': 2,
            },
          },
        ] satisfies LayerSpecification[]
      );

      // -------------------------------
      // --- zonesPotentielFortChaud ---
      // -------------------------------
      addSource(
        e.target,
        'zonesPotentielFortChaud',
        {
          type: 'vector',
          tiles: [`${origin}/api/map/zonesPotentielFortChaud/{z}/{x}/{y}`],
          maxzoom: 17,
          promoteId: 'ID_ZONE',
          attribution:
            '<a href="https://reseaux-chaleur.cerema.fr/espace-documentaire/enrezo" target="_blank">Cerema</a>',
        },
        [
          {
            id: 'zonesPotentielFortChaud',
            source: 'zonesPotentielFortChaud',
            'source-layer': 'layer',
            type: 'fill',
            paint: {
              'fill-color': themeDefZonePotentielFortChaud.fill.color,
              'fill-opacity': themeDefZonePotentielFortChaud.fill.opacity,
            },
          },
          {
            id: 'zonesPotentielFortChaud-outline',
            source: 'zonesPotentielFortChaud',
            'source-layer': 'layer',
            type: 'line',
            paint: {
              'line-color': themeDefZonePotentielFortChaud.fill.color,
              'line-width': 2,
            },
          },
        ] satisfies LayerSpecification[]
      );

      // ---------------
      // --- Zone DP ---
      // ---------------
      addSource(
        e.target,
        'zoneDP',
        {
          type: 'vector',
          tiles: [`${origin}/api/map/zoneDP/{z}/{x}/{y}`],
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
            ...getNetworkFilter(network, filter, [
              '==',
              ['get', 'has_trace'],
              true,
            ]),
          },
          {
            id: 'outlineCenter',
            source: 'heatNetwork',
            'source-layer': 'outline',
            ...outlineCenterLayerStyle,
            ...getNetworkFilter(network, filter, [
              '==',
              ['get', 'has_trace'],
              false,
            ]),
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
            ...getNetworkFilter(network, filter, [
              '==',
              ['get', 'has_trace'],
              true,
            ]),
          },
          {
            id: 'coldOutlineCenter',
            source: 'coldNetwork',
            'source-layer': 'coldOutline',
            ...coldOutlineCenterLayerStyle,
            ...getNetworkFilter(network, filter, [
              '==',
              ['get', 'has_trace'],
              false,
            ]),
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
    if (mapRef.current && center) {
      if (withCenterPin) {
        const newMarker = {
          id: getAddressId(center),
          latitude: center[1],
          longitude: center[0],
        };
        setMarkersList([newMarker]);
      }
      jumpTo({ coordinates: center });
    }
  }, [center, jumpTo, withCenterPin]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const { coord, id } = router.query;
    if (!geolocDisabled && !coord && !center && !id && navigator.geolocation) {
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
  }, [jumpTo, center, router, geolocDisabled]);

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

    loadFilters();
  }, [loadFilters, mapState]);

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

  if (!isReady) {
    return null;
  }

  const initialViewState = {
    latitude: center ? center[1] : mapParam.lat,
    longitude: center ? center[0] : mapParam.lng,
    zoom: initialZoom || defaultZoom,
  };

  if (router.query.coord) {
    const coordinates = (router.query.coord as string)
      .split(',')
      .map((point: string) => parseFloat(point)) as [number, number];
    initialViewState.longitude = coordinates[0];
    initialViewState.latitude = coordinates[1];
    initialViewState.zoom = initialZoom || 13;
  }

  if (router.query.zoom) {
    initialViewState.zoom = parseInt(router.query.zoom as string, 10);
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
            <Legend
              legendCollapsed={legendCollapsed}
              withHideLegendSwitch={withHideLegendSwitch}
            >
              <LegendContainer withoutLogo={withoutLogo}>
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
                  onToggleFeature={toggleLayer}
                  onToggleInGroup={(groupeName: string, idEntry?: any) => {
                    switch (groupeName) {
                      case 'energy': {
                        toggleEnergyVisibility(idEntry as 'gas' | 'fuelOil');
                        break;
                      }
                      case 'gasUsage': {
                        toggleGasUsageVisibility(idEntry as 'R' | 'T' | 'I');
                        break;
                      }
                      case 'gasUsageGroup': {
                        toggleGasUsageGroupeVisibility();
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
                          ? updateLayerDisplay({
                              ...layerDisplay,
                              energyGasValues: values,
                            })
                          : updateLayerDisplay({
                              ...layerDisplay,
                              energyFuelValues: values,
                            });
                        break;
                      }
                      case 'gasUsage': {
                        updateLayerDisplay({
                          ...layerDisplay,
                          gasUsageValues: values,
                        });
                        break;
                      }
                    }
                  }}
                  layerDisplay={layerDisplay}
                />
              </LegendContainer>
            </Legend>
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
            maxZoom={maxZoom}
            minZoom={minZoom}
            onLoad={onLoadMap}
            onSourceData={onSourceDataMap}
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

function isLayerEnabled(
  value: TypeLayerDisplay[keyof TypeLayerDisplay]
): boolean {
  return typeof value === 'boolean'
    ? value
    : value instanceof Array
    ? value.length > 0
    : value;
}
