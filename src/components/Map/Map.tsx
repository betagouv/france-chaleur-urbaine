import Hoverable from '@components/Hoverable';
import { Icon } from '@dataesr/react-dsfr';
import { usePersistedState } from '@hooks';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AddressDetail,
  HandleAddressSelect,
} from 'src/types/HeatNetworksResponse';
import { Point } from 'src/types/Point';
import { StoredAddress } from 'src/types/StoredAddress';
import { DemandSummary } from 'src/types/Summary/Demand';
import { EnergySummary } from 'src/types/Summary/Energy';
import { GasSummary } from 'src/types/Summary/Gas';
import { NetworkSummary } from 'src/types/Summary/Network';
import mapParam, {
  EnergyNameOption,
  gasUsageNameOption,
  LayerNameOption,
  layerNameOptions,
  TypeLayerDisplay,
} from '../../services/Map/param';
import { CardSearchDetails, MapLegend, MapSearchForm } from './components';
import ZoneInfos from './components/ZoneInfos';
import { useMapPopup } from './hooks';
import {
  buildingsLayerStyle,
  CollapseLegend,
  demandsLayerStyle,
  dottedOutlineLayerStyle,
  energyLayerStyle,
  gasUsageLayerStyle,
  Legend,
  LegendSeparator,
  MapControlWrapper,
  MapStyle,
  objTypeEnergy,
  outlineLayerStyle,
  zoneDPLayerStyle,
} from './Map.style';

const {
  defaultZoom,
  maxZoom,
  minZoom,
  minZoomData,
  lng,
  lat,
  defaultLayerDisplay,
  legendData,
} = mapParam;

const writeTypeConso = (typeConso: string | unknown) => {
  switch (typeConso) {
    case 'R': {
      return 'Logement';
    }
    case 'T': {
      return 'Établissement tertiaire';
    }
    case 'I': {
      return 'Industrie';
    }
  }
  return '';
};

const formatBddText = (str?: string) => {
  return (
    str &&
    str
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/electricite/g, 'électricité')
      .replace(/reseau/g, 'réseau')
  );
};

const formatBodyPopup = ({
  buildings,
  consommation,
  demands,
  energy,
  network,
}: {
  buildings?: EnergySummary;
  consommation?: GasSummary;
  energy?: EnergySummary;
  demands?: DemandSummary;
  network?: NetworkSummary;
}) => {
  const {
    nb_logements,
    annee_construction,
    type_usage,
    energie_utilisee: energie_utilisee_buildings,
    type_chauffage: type_chauffage_buildings,
    addr_label: addr_label_buildings,
    dpe_energie,
    dpe_ges,
  } = buildings || energy || {};
  const { adresse, nom_commun, code_grand, conso_nb } = consommation || {};
  const addr_label_consommation = adresse ? `${adresse} ${nom_commun}` : '';
  const {
    Adresse: addr_label_demands,
    'Mode de chauffage': mode_chauffage_demands,
    'Type de chauffage': type_chauffage_demands,
    Structure: structure,
  } = demands || {};

  const energie_utilisee = energie_utilisee_buildings || mode_chauffage_demands;
  const textAddress =
    addr_label_buildings || addr_label_consommation || addr_label_demands;
  const type_chauffage = type_chauffage_buildings || type_chauffage_demands;

  const displayNetwork =
    network && !(buildings || consommation || demands || energy);
  const bodyPopup = `
    ${
      textAddress
        ? `
          <header>
            <h6>${textAddress}</h6>
          </header>`
        : ''
    }
    ${`
        <section>
          ${
            code_grand
              ? `<strong><u></u>${writeTypeConso(
                  code_grand
                )}</u></strong><br />`
              : ''
          }
          ${
            annee_construction
              ? `<strong>Année de construction&nbsp;:</strong> ${annee_construction}<br />`
              : ''
          }
          ${
            type_usage
              ? `<strong>Usage&nbsp;:</strong> ${type_usage}<br />`
              : ''
          }
          ${
            nb_logements
              ? `<strong>Nombre de logements&nbsp;:</strong> ${nb_logements}<br />`
              : ''
          }
          ${
            energie_utilisee
              ? `<strong>Chauffage actuel&nbsp;:</strong> ${formatBddText(
                  energie_utilisee
                )}<br />`
              : ''
          }
          ${
            type_chauffage
              ? `<strong>Mode de chauffage&nbsp;:</strong> ${type_chauffage}<br />`
              : ''
          }
          ${
            conso_nb &&
            (!energie_utilisee || objTypeEnergy?.gas.includes(energie_utilisee))
              ? `<strong>Consommations de gaz&nbsp;:</strong> ${conso_nb.toFixed(
                  2
                )}&nbsp;MWh<br />`
              : ''
          }
          ${
            dpe_energie
              ? `<strong>DPE consommations énergétiques&nbsp;:</strong> ${dpe_energie}<br />`
              : ''
          }
          ${
            dpe_ges
              ? `<strong>DPE émissions de gaz à effet de serre&nbsp;:</strong> ${dpe_ges}<br />`
              : ''
          }
          ${
            structure
              ? `<strong>Structure&nbsp;:</strong> ${structure}<br />`
              : ''
          }
          ${
            displayNetwork
              ? `
            ${
              network.commentaires
                ? `<strong>
                  ${network.commentaires}
                  </strong>
                <br />
                `
                : ''
            }
            <strong>Gestionnaire&nbsp;:</strong> ${
              network.Gestionnaire ? `${network.Gestionnaire}` : 'Non connu'
            }<br />
            <strong>Taux EnR&R&nbsp;:</strong> ${
              network['Taux EnR&R'] ? `${network['Taux EnR&R']}%` : 'Non connu'
            }
            <br />
          `
              : ''
          }
        </section>
      `}
  `;
  return bodyPopup;
};

const getAddressId = (LatLng: Point) => `${LatLng.join('--')}`;

export default function Map() {
  const mapContainer: null | { current: any } = useRef(null);
  const map: null | { current: any } = useRef(null);
  const draw: null | { current: any } = useRef(null);

  const [legendCollapsed, setLegendCollapsed] = useState(true);
  useEffect(() => {
    setLegendCollapsed(window.innerWidth < 1251);
  }, []);

  useEffect(() => {
    if (map && map.current) {
      map.current.resize();
    }
  }, [map, legendCollapsed]);

  const [mapState, setMapState] = useState('pending');
  const [layerDisplay, setLayerDisplay] =
    useState<TypeLayerDisplay>(defaultLayerDisplay);

  const [soughtAddresses, setSoughtAddresses] = usePersistedState(
    'mapSoughtAddresses',
    [] as StoredAddress[],
    {
      beforeStorage: (value: any) => {
        const newValue = value.map((address: any) => {
          const { marker, ...parsableAddress } = address;
          return parsableAddress;
        });
        return newValue;
      },
    }
  );

  const router = useRouter();
  const [, , updateClickedPoint] = useMapPopup(map.current, {
    bodyFormater: formatBodyPopup,
    className: 'popup-map-layer',
  });

  const flyTo = useCallback(
    ({
      coordinates,
      zoom,
    }: {
      coordinates: [number, number];
      zoom?: number;
    }) => {
      map.current.flyTo({
        center: { lon: coordinates[0], lat: coordinates[1] },
        zoom: zoom || 16,
      });
    },
    []
  );

  const jumpTo = useCallback(
    ({
      coordinates,
      zoom,
    }: {
      coordinates: [number, number];
      zoom?: number;
    }) => {
      map.current.jumpTo({
        center: { lon: coordinates[0], lat: coordinates[1] },
        zoom: zoom || 16,
      });
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
      const existingAddress = soughtAddresses.find(
        ({ id: soughtAddressesId }) => soughtAddressesId === id
      );
      if (!existingAddress) {
        const newAddress = {
          id,
          coordinates,
          address,
          addressDetails,
          search,
        };
        setSoughtAddresses([...soughtAddresses, newAddress]);
      }
      flyTo({ coordinates });
    },
    [flyTo, setSoughtAddresses, soughtAddresses]
  );

  const removeSoughtAddresses = useCallback(
    (result: { marker?: any; coordinates?: Point }) => {
      if (!result.coordinates) {
        return;
      }

      const id = getAddressId(result.coordinates);
      const getCurrentSoughtAddresses = ({
        coordinates,
      }: {
        coordinates: Point;
      }) => getAddressId(coordinates) !== id;
      const newSoughtAddresses = soughtAddresses.filter(
        getCurrentSoughtAddresses
      );
      result?.marker?.remove();
      setSoughtAddresses(newSoughtAddresses);
    },
    [setSoughtAddresses, soughtAddresses]
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

  // ----------------
  // --- Load Map ---
  // ----------------
  useEffect(() => {
    if (mapState === 'loaded' || map.current) {
      return;
    }

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
    });

    map.current = new maplibregl.Map({
      attributionControl: false,
      container: mapContainer.current,
      style: `https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json`,
      center: [lng, lat],
      zoom: defaultZoom,
      maxZoom,
      minZoom,
    });

    map.current.addControl(draw.current);
    map.current.addControl(
      new maplibregl.GeolocateControl({
        fitBoundsOptions: { maxZoom: 13 },
      })
    );

    const clickEvents = [
      { name: 'outline', key: 'network' },
      {
        name: 'demands',
        key: 'demands',
      },
      { name: 'buildings', key: 'buildings' },
      { name: 'gasUsage', key: 'consommation' },
      { name: 'energy', key: 'energy' },
    ];
    const onMapClick = (e: any, key: string) => {
      const properties = e.features[0].properties;
      const { lat, lng } = e.lngLat;
      updateClickedPoint([lng, lat], { [key]: properties });
    };

    map.current.on('load', () => {
      map.current.loadImage(
        './icons/rect.png',
        (error: any, image: Record<string, unknown>) => {
          if (error) {
            throw error;
          }

          setMapState('loaded');
          map.current.addImage('energy-picto', image, { sdf: true });

          clickEvents.map(({ name, key }) => {
            map.current.on('click', name, (e: any) => {
              onMapClick(e, key);
            });

            map.current.on('touchend', name, (e: any) => {
              onMapClick(e, key);
            });

            map.current.on('mouseenter', name, function () {
              map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', name, function () {
              map.current.getCanvas().style.cursor = '';
            });
          });

          // ----------------
          // --- Controls ---
          // ----------------
          const navControl = new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true,
          });
          map.current.addControl(navControl, 'top-left');

          const attributionControl = new maplibregl.AttributionControl({
            compact: false,
          });
          map.current.addControl(attributionControl, 'bottom-right');

          const scaleControl = new maplibregl.ScaleControl({
            maxWidth: 100,
            unit: 'metric',
          });
          map.current.addControl(scaleControl, 'bottom-left');

          // -------------------
          // --- MAP CONTENT ---
          // -------------------

          const origin =
            process.env.NEXT_PUBLIC_MAP_ORIGIN ?? document.location.origin;

          // --------------------
          // --- Heat Network ---
          // --------------------
          map.current.addSource('heatNetwork', {
            type: 'vector',
            tiles: [`${origin}/api/map/network/{z}/{x}/{y}`],
          });

          map.current.addLayer({
            id: 'outline',
            source: 'heatNetwork',
            'source-layer': 'outline',
            ...outlineLayerStyle,
          });

          map.current.addLayer({
            id: 'dottedOutline',
            source: 'heatNetwork',
            'source-layer': 'outline',
            ...dottedOutlineLayerStyle,
          });

          // ---------------
          // --- Zone DP ---
          // ---------------
          map.current.addSource('zoneDP', {
            type: 'vector',
            tiles: [`${origin}/api/map/zoneDP/{z}/{x}/{y}`],
          });

          map.current.addLayer({
            id: 'zoneDP',
            source: 'zoneDP',
            'source-layer': 'zoneDP',
            ...zoneDPLayerStyle,
          });

          // -----------------
          // --- Buildings ---
          // -----------------
          map.current.addSource('buildings', {
            type: 'vector',
            tiles: [`${origin}/api/map/buildings/{z}/{x}/{y}`],
            maxzoom: maxZoom,
            minzoom: minZoomData,
          });

          map.current.addLayer({
            id: 'buildings',
            source: 'buildings',
            'source-layer': 'buildings',
            ...buildingsLayerStyle,
          });

          // -----------------
          // --- Gas Usage ---
          // -----------------
          map.current.addSource('gasUsage', {
            type: 'vector',
            tiles: [`${origin}/api/map/gas/{z}/{x}/{y}`],
            maxzoom: maxZoom,
            minzoom: minZoomData,
          });

          map.current.addLayer({
            id: 'gasUsage',
            source: 'gasUsage',
            'source-layer': 'gasUsage',
            ...gasUsageLayerStyle,
          });

          // --------------
          // --- Energy ---
          // --------------
          map.current.addSource('energy', {
            type: 'vector',
            tiles: [`${origin}/api/map/energy/{z}/{x}/{y}`],
            maxzoom: maxZoom,
            minzoom: minZoomData,
          });

          map.current.addLayer({
            id: 'energy',
            source: 'energy',
            'source-layer': 'energy',
            ...energyLayerStyle,
          });

          // -----------------
          // --- Demands ---
          // -----------------
          map.current.addSource('demands', {
            type: 'vector',
            tiles: [`${origin}/api/map/demands/{z}/{x}/{y}`],
          });

          map.current.addLayer({
            id: 'demands',
            source: 'demands',
            'source-layer': 'demands',
            ...demandsLayerStyle,
          });
        }
      );
    });
  });

  useEffect(() => {
    const { coord, zoom } = router.query;
    if (coord) {
      const coordinates = (coord as string)
        .split(',')
        .map((point: string) => parseFloat(point)) as [number, number];

      jumpTo({
        coordinates,
        zoom: zoom ? parseInt(zoom as string, 10) : 12,
      });
    } else if (navigator.geolocation) {
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
  }, [jumpTo, router.query]);

  // ---------------------
  // --- Search result ---
  // ---------------------
  useEffect(() => {
    let shouldUpdate = false;
    const newSoughtAddresses = soughtAddresses.map(
      (sAddress: any | never[]) => {
        if (!sAddress.marker) {
          const marker = new maplibregl.Marker({
            color: '#4550e5',
          })
            .setLngLat(sAddress.coordinates)
            .addTo(map.current);
          shouldUpdate = true;
          return {
            marker,
            ...sAddress,
          };
        } else {
          return sAddress;
        }
      }
    );
    if (shouldUpdate) setSoughtAddresses(newSoughtAddresses);
  }, [setSoughtAddresses, soughtAddresses]);

  // ---------------------
  // --- Update Filter ---
  // ---------------------
  useEffect(() => {
    if (mapState === 'pending') {
      return;
    }

    layerNameOptions.forEach((layerId) =>
      map.current.getLayer(layerId)
        ? map.current.setLayoutProperty(
            layerId,
            'visibility',
            layerDisplay[layerId] ? 'visible' : 'none'
          )
        : console.warn(`Layer '${layerId}' is not set on map`)
    );

    // Energy
    const TYPE_ENERGY = 'energie_utilisee';
    const energyFilter = layerDisplay.energy.flatMap((energyName) =>
      objTypeEnergy[energyName].map((energyLabel: string) => [
        '==',
        ['get', TYPE_ENERGY],
        energyLabel,
      ])
    );
    map.current.setFilter('energy', ['any', ...energyFilter]);

    // GasUsage
    const TYPE_GAS = 'code_grand';
    const gasUsageFilter = layerDisplay.gasUsage.map((gasUsageName) => [
      '==',
      ['get', TYPE_GAS],
      gasUsageName,
    ]);
    map.current.setFilter(
      'gasUsage',
      layerDisplay.gasUsageGroup && ['any', ...gasUsageFilter]
    );
  }, [layerDisplay, mapState]);

  return (
    <>
      <MapStyle legendCollapsed={legendCollapsed} />
      <div className="map-wrap">
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
              legendCollapsed ? 'ri-arrow-right-s-fill' : 'ri-arrow-left-s-fill'
            }
          />
        </CollapseLegend>
        <Legend legendCollapsed={legendCollapsed}>
          <MapSearchForm onAddressSelect={onAddressSelectHandle} />
          <LegendSeparator />
          {soughtAddresses.length > 0 && (
            <>
              {soughtAddresses
                .map((soughtAddress) => (
                  <CardSearchDetails
                    key={soughtAddress.id}
                    address={soughtAddress}
                    onClick={flyTo}
                    onClickClose={removeSoughtAddresses}
                    onContacted={markAddressAsContacted}
                  />
                ))
                .reverse()}
              <LegendSeparator />
            </>
          )}
          <MapLegend
            data={legendData}
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
            layerDisplay={layerDisplay}
          />
        </Legend>
        <MapControlWrapper legendCollapsed={legendCollapsed}>
          <ZoneInfos map={map.current} draw={draw.current} />
        </MapControlWrapper>
        <div ref={mapContainer} className="map" />
      </div>
    </>
  );
}
