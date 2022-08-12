import { Icon } from '@dataesr/react-dsfr';
import { usePersistedState } from '@hooks';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Point } from 'src/types/Point';
import { DemandSummary } from 'src/types/Summary/Demand';
import { EnergySummary } from 'src/types/Summary/Energy';
import { GasSummary } from 'src/types/Summary/Gas';
import {
  CardSearchDetails,
  MapLegend,
  MapSearchForm,
  TypeAddressDetail,
  TypeHandleAddressSelect,
} from './components';
import ZoneInfos from './components/ZoneInfos';
import { useMapPopup } from './hooks';
import mapParam, { TypeLayerDisplay } from './Map.param';
import {
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

const layerNameOptions = ['outline', 'demands', 'zoneDP'] as const;
const energyNameOptions = ['fuelOil', 'gas'] as const;
const gasUsageNameOptions = ['R', 'T'] as const;

type LayerNameOption = typeof layerNameOptions[number];
type EnergyNameOption = typeof energyNameOptions[number];
type gasUsageNameOption = typeof gasUsageNameOptions[number];

const formatBodyPopup = ({
  consommation,
  energy,
  demands,
}: {
  consommation?: GasSummary;
  energy?: EnergySummary;
  demands?: DemandSummary;
  id: string;
}) => {
  let textAddress;
  if (consommation) {
    textAddress = consommation.result_label;
  } else if (energy) {
    textAddress = energy.adresse_reference;
  } else if (demands) {
    textAddress = demands.Adresse;
  }

  const writeTypeConso = (typeConso: string | unknown) => {
    switch (typeConso) {
      case 'R': {
        return 'Logement residentiel';
      }
      case 'T': {
        return 'Établissement tertiaire';
      }
    }
    return '';
  };

  const formatBddText = (str?: string) =>
    str && str.replace(/_/g, ' ').toLowerCase();

  const {
    nb_lot_habitation_bureau_commerce,
    energie_utilisee,
    periode_construction,
  } = energy || {};
  const { code_grand_secteur, conso } = consommation || {};
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
            code_grand_secteur
              ? `<strong>${writeTypeConso(code_grand_secteur)}</strong><br />`
              : energy
              ? '<strong>Copropriété</strong><br />'
              : ''
          }
          ${
            nb_lot_habitation_bureau_commerce
              ? `Nombre de lots : ${nb_lot_habitation_bureau_commerce}<br />`
              : ''
          }
          ${
            energie_utilisee
              ? `Chauffage actuel :  ${formatBddText(
                  energie_utilisee as string
                )}<br />`
              : ''
          }
          ${
            conso &&
            (!energie_utilisee || objTypeEnergy?.gas.includes(energie_utilisee))
              ? `Consommations de gaz :  ${(conso as number)?.toFixed(
                  2
                )}&nbsp;MWh<br />`
              : ''
          }
          ${
            periode_construction
              ? `Période de construction : ${formatBddText(
                  periode_construction as string
                )}<br />`
              : ''
          }
          ${
            demands
              ? `Mode de chauffage: ${
                  demands['Mode de chauffage'] || 'inconnu'
                }`
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
  const [layerDisplay, setLayerDisplay]: [
    TypeLayerDisplay,
    React.Dispatch<any | never[]>
  ] = useState(defaultLayerDisplay);

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
      if (!result.coordinates) return;
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

          // -----------------
          // --- Demands ---
          // -----------------
          map.current.addSource('demands', {
            type: 'vector',
            tiles: [`${origin}/api/map/demands/{z}/{x}/{y}`],
            maxzoom: maxZoom,
            minzoom: minZoomData,
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
            'source-layer': 'condominiumRegister',
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

          // -----------------
          // --- Zone DP ---
          // -----------------
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
    if (mapState === 'pending') return;

    // HeatNetwork
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
    const TYPE_GAS = 'code_grand_secteur';
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
                  toogleGasUsageVisibility(idEntry as 'R' | 'T');
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
