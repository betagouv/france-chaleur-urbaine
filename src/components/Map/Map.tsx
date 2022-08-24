import { Icon } from '@dataesr/react-dsfr';
import { usePersistedState } from '@hooks';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Point } from 'src/types/Point';
import { BuildingSummary } from 'src/types/Summary/Building';
import { DemandSummary } from 'src/types/Summary/Demand';
import { EnergySummary } from 'src/types/Summary/Energy';
import { GasSummary } from 'src/types/Summary/Gas';
import mapParam, {
  EnergyNameOption,
  gasUsageNameOption,
  LayerNameOption,
  layerNameOptions,
  TypeLayerDisplay,
} from '../../services/Map/param';
import {
  CardSearchDetails,
  MapLegend,
  MapSearchForm,
  TypeAddressDetail,
  TypeHandleAddressSelect,
} from './components';
import ZoneInfos from './components/ZoneInfos';
import { useMapPopup } from './hooks';
import {
  buildingsLayerStyle,
  CollapseLegend,
  demandsLayerStyle,
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

const formatBodyPopup = ({
  buildings,
  consommation,
  demands,
  energy,
}: {
  buildings?: BuildingSummary;
  consommation?: GasSummary;
  energy?: EnergySummary;
  demands?: DemandSummary;
}) => {
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

  const {
    nb_logements: nb_logements_buildings,
    annee_construction: annee_construction_buildings,
    type_usage,
    energie_utilisee: energie_utilisee_buildings,
    type_chauffage: type_chauffage_buildings,
    addr_label: addr_label_buildings,
    dpe_energie: dpe_energie_buildings,
    dpe_ges: dpe_ges_buildings,
  } = buildings || {};
  const {
    addr_label: addr_label_energy,
    nb_logements: nb_logements_energy,
    annee_construction: annee_construction_energy,
    energie_utilisee: energie_utilisee_energy,
    dpe_energie: dpe_energie_energy,
    dpe_ges: dpe_ges_energy,
  } = energy || {};
  const {
    result_lab: addr_label_consommation,
    code_grand,
    conso_nb,
  } = consommation || {};
  const {
    Adresse: addr_label_demands,
    'Mode de chauffage': type_chauffage_demands,
  } = demands || {};

  const textAddress =
    addr_label_buildings ||
    addr_label_energy ||
    addr_label_consommation ||
    addr_label_demands;
  const nb_logements = nb_logements_buildings || nb_logements_energy;
  const annee_construction =
    annee_construction_buildings || annee_construction_energy;
  const energie_utilisee =
    energie_utilisee_buildings || energie_utilisee_energy;
  const dpe_energie = dpe_energie_buildings || dpe_energie_energy;
  const dpe_ges = dpe_ges_buildings || dpe_ges_energy;
  const type_chauffage = type_chauffage_buildings || type_chauffage_demands;
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
              : energy
              ? '<strong><u>Copropriété</u></strong><br />'
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
            conso_nb &&
            (!energie_utilisee || objTypeEnergy?.gas.includes(energie_utilisee))
              ? `<strong>Consommations de gaz&nbsp;:</strong> ${conso_nb.toFixed(
                  2
                )}&nbsp;MWh<br />`
              : ''
          }
          ${
            type_chauffage
              ? `<strong>Mode de chauffage&nbsp;:</strong> ${type_chauffage}<br />`
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

  const [legendCollapsed, setLegendCollapsed] = useState(false);
  useEffect(() => {
    if (map && map.current) {
      map.current.resize();
    }
  }, [map, legendCollapsed]);

  const [mapState, setMapState] = useState('pending');
  const [layerDisplay, setLayerDisplay] =
    useState<TypeLayerDisplay>(defaultLayerDisplay);

  const [soughtAddress, setSoughtAddress] = usePersistedState(
    'mapSoughtAddress',
    [] as {
      id: string;
      coordinates: Point;
      address: string;
      addressDetails: TypeAddressDetail;
      search: { date: number };
    }[],
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

  const flyTo = useCallback(({ coordinates }: any) => {
    map.current.flyTo({
      center: { lon: coordinates[0], lat: coordinates[1] },
      zoom: 16,
    });
  }, []);

  const onAddressSelectHandle: TypeHandleAddressSelect = useCallback(
    (
      address: string,
      coordinates: Point,
      addressDetails: TypeAddressDetail
    ) => {
      const computedCoordinates: Point = [coordinates[1], coordinates[0]]; // TODO: Fix on source
      const search = {
        date: Date.now(),
      };
      const id = getAddressId(computedCoordinates);
      if (!Array.isArray(soughtAddress)) {
        return;
      }

      const newAddress = soughtAddress.find(
        ({ id: soughtAddressId }) => soughtAddressId === id
      ) || {
        id,
        coordinates: computedCoordinates,
        address,
        addressDetails,
        search,
      };
      setSoughtAddress([
        ...soughtAddress.filter(({ id: _id }) => `${_id}` !== id),
        newAddress,
      ]);
      flyTo({ coordinates: computedCoordinates });
    },
    [flyTo, setSoughtAddress, soughtAddress]
  );

  const removeSoughtAddress = useCallback(
    (result: { marker?: any; coordinates?: Point }) => {
      if (!result.coordinates) {
        return;
      }

      const id = getAddressId(result.coordinates);
      const getCurrentSoughtAddress = ({
        coordinates,
      }: {
        coordinates: Point;
      }) => getAddressId(coordinates) !== id;
      const newSoughtAddress = soughtAddress.filter(getCurrentSoughtAddress);
      result?.marker?.remove();
      setSoughtAddress(newSoughtAddress);
    },
    [setSoughtAddress, soughtAddress]
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
    if (mapState === 'loaded' || map.current) return;

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

    map.current.on('load', () => {
      map.current.loadImage(
        './icons/rect.png',
        (error: any, image: Record<string, unknown>) => {
          if (error) throw error;

          setMapState('loaded');
          map.current.addImage('energy-picto', image, { sdf: true });

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

          map.current.on('click', 'demands', (e: any) => {
            const properties = e.features[0].properties;
            const coordinates = e.features[0].geometry.coordinates.slice();
            updateClickedPoint(coordinates, { demands: properties });
          });

          map.current.on('mouseenter', 'demands', function () {
            map.current.getCanvas().style.cursor = 'pointer';
          });

          map.current.on('mouseleave', 'demands', function () {
            map.current.getCanvas().style.cursor = '';
          });

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

          map.current.on('click', 'buildings', (e: any) => {
            const properties = e.features[0].properties;
            const { lat, lng } = e.lngLat;
            const coordinates = [lng, lat];
            updateClickedPoint(coordinates, { buildings: properties });
          });

          map.current.on('mouseenter', 'buildings', function () {
            map.current.getCanvas().style.cursor = 'pointer';
          });

          map.current.on('mouseleave', 'buildings', function () {
            map.current.getCanvas().style.cursor = '';
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

          map.current.on('click', 'gasUsage', (e: any) => {
            const properties = e.features[0].properties;
            const coordinates = e.features[0].geometry.coordinates.slice();
            updateClickedPoint(coordinates, { consommation: properties });
          });

          map.current.on('mouseenter', 'gasUsage', function () {
            map.current.getCanvas().style.cursor = 'pointer';
          });

          map.current.on('mouseleave', 'gasUsage', function () {
            map.current.getCanvas().style.cursor = '';
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

          map.current.on('click', 'energy', (e: any) => {
            const properties = e.features[0].properties;
            const coordinates = e.features[0].geometry.coordinates.slice();
            updateClickedPoint(coordinates, { energy: properties });
          });

          map.current.on('mouseenter', 'energy', function () {
            map.current.getCanvas().style.cursor = 'pointer';
          });

          map.current.on('mouseleave', 'energy', function () {
            map.current.getCanvas().style.cursor = '';
          });
        }
      );
    });
  });

  // -------------------------
  // --- Load Query Params ---
  // -------------------------
  const [queryState, setQueryState] = useState({});
  useEffect(() => {
    const { coord: coordState }: any = queryState;
    const { coord } = router.query;
    if (coord && coord !== coordState) {
      const coordinates: any =
        typeof coord === 'string'
          ? coord
              .split(',')
              .map((point: string) => parseFloat(point))
              .reverse()
          : coord; // TODO: Fix on source

      flyTo({ coordinates });
      setQueryState(router.query);
      new maplibregl.Marker({
        color: '#ea7c3f', // TODO: Change color if address is eligible and use #00eb5e or #4550e5
      })
        .setLngLat(coordinates)
        .addTo(map.current);
    }
  }, [flyTo, router.query, queryState]);

  // ---------------------
  // --- Search result ---
  // ---------------------
  useEffect(() => {
    let shouldUpdate = false;
    const newSoughtAddress = soughtAddress.map((sAddress: any | never[]) => {
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
    });
    if (shouldUpdate) setSoughtAddress(newSoughtAddress);
  }, [setSoughtAddress, soughtAddress]);

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
          <Icon
            name={
              legendCollapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'
            }
          />
        </CollapseLegend>
        <Legend legendCollapsed={legendCollapsed}>
          <MapSearchForm onAddressSelect={onAddressSelectHandle} />
          <LegendSeparator />
          {soughtAddress.length > 0 && (
            <>
              {soughtAddress
                .map((adressDetails: TypeAddressDetail, i: number) => (
                  <CardSearchDetails
                    key={`${adressDetails.address}-${i}`}
                    result={adressDetails}
                    onClick={flyTo}
                    onClickClose={removeSoughtAddress}
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
