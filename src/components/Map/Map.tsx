import { usePersistedState } from '@hooks';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Point } from 'src/types';
import {
  CardSearchDetails,
  MapLegend,
  MapSearchForm,
  TypeAddressDetail,
  TypeHandleAddressSelect,
} from './components';
import { useMapPopup } from './hooks';
import mapParam, { TypeLayerDisplay } from './Map.param';
import {
  boilerRoomLayerStyle,
  energyLayerStyle,
  gasUsageLayerStyle,
  MapControlWrapper,
  MapSearchResult,
  MapStyle,
  objTypeEnergy,
  outlineLayerStyle,
  substationLayerStyle,
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

const layerNameOptions = ['outline', 'substation', 'boilerRoom'] as const;
const energyNameOptions = ['fuelOil', 'gas'] as const;
const gasUsageNameOptions = ['R', 'T'] as const;

type LayerNameOption = typeof layerNameOptions[number];
type EnergyNameOption = typeof energyNameOptions[number];
type gasUsageNameOption = typeof gasUsageNameOptions[number];

const DEBUG = true;

const getAddressId = (LatLng: Point) => `${LatLng.join('--')}`;

const formatBodyPopup = ({
  coordinates,
  consommation,
  energy,
}: {
  coordinates: any;
  consommation?: Record<string, any>;
  energy?: Record<string, any>;
  id: string;
}) => {
  const textAddress =
    consommation?.result_label ?? energy?.adresse_reference ?? null;

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
            <em class="coord">Lat, Lon : ${[...coordinates]
              .reverse()
              .map((point: number) => point.toFixed(5))
              .join(',')}</em>
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
              ? `Chauffage actuel :  ${formatBddText(energie_utilisee)}<br />`
              : ''
          }
          ${
            conso &&
            (!energie_utilisee || objTypeEnergy?.gas.includes(energie_utilisee))
              ? `Consommations de gaz :  ${conso?.toFixed(2)}&nbsp;MWh<br />`
              : ''
          }
          ${
            periode_construction
              ? `Période de construction : ${formatBddText(
                  periode_construction
                )}<br />`
              : ''
          }
        </section>
      `}
  `;
  return bodyPopup;
};

export default function Map() {
  const mapContainer: null | { current: any } = useRef(null);
  const map: null | { current: any } = useRef(null);

  const [mapState, setMapState] = useState('pending');
  const [layerDisplay, setLayerDisplay]: [
    TypeLayerDisplay,
    React.Dispatch<any | never[]>
  ] = useState(defaultLayerDisplay);

  const [soughtAddress, setSoughtAddress] = usePersistedState(
    'mapSoughtAddress',
    [],
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

  const { query } = useRouter();
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

  const logSoughtAddress = useCallback(() => {
    console.info('State of: soughtAddress =>', soughtAddress);
  }, [soughtAddress]);

  const onAddressSelectHandle:
    | TypeHandleAddressSelect
    | { _coordinates: Point } = useCallback(
    (address, _coordinates, addressDetails) => {
      const coordinates: Point = [_coordinates[1], _coordinates[0]]; // TODO: Fix on source
      const search = {
        date: Date.now(),
      };
      const id = getAddressId(coordinates);
      if (!Array.isArray(soughtAddress)) return;
      const newAddress = soughtAddress.find(
        ({ id: soughtAddressId }: { id: string }) => soughtAddressId === id
      ) || {
        id,
        coordinates,
        address,
        addressDetails,
        search,
      };
      setSoughtAddress([
        ...soughtAddress.filter(
          ({ id: _id }: { id: string }) => `${_id}` !== id
        ),
        newAddress,
      ]);
      flyTo({ coordinates });
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

    map.current = new maplibregl.Map({
      attributionControl: false,
      container: mapContainer.current,
      style: `https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json`,
      center: [lng, lat],
      zoom: defaultZoom,
      maxZoom,
      minZoom,
    });
    map.current.on('click', () => {
      if (DEBUG) {
        console.info('zoom =>', map.current.getZoom());
        logSoughtAddress();
      }
    });

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
          map.current.addLayer({
            id: 'substation',
            source: 'heatNetwork',
            'source-layer': 'substation',
            ...substationLayerStyle,
          });
          map.current.addLayer({
            id: 'boilerRoom',
            source: 'heatNetwork',
            'source-layer': 'boilerRoom',
            ...boilerRoomLayerStyle,
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
    const { coord } = query;
    if (coord && coord !== coordState) {
      const coordinates: any =
        typeof coord === 'string'
          ? coord
              .split(',')
              .map((point: string) => parseFloat(point))
              .reverse()
          : coord; // TODO: Fix on source
      flyTo({ coordinates });
      setQueryState(query);
      new maplibregl.Marker({
        color: '#ea7c3f', // TODO: Change color if address is eligible and use #00eb5e or #4550e5
      })
        .setLngLat(coordinates)
        .addTo(map.current);
    }
  }, [flyTo, query, queryState]);

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
      <MapStyle />
      <div className="map-wrap">
        {/* Search Result */}
        <MapControlWrapper className="search-result-box" right top>
          <MapSearchResult>
            {soughtAddress.length > 0 &&
              soughtAddress
                .map((adressDetails: TypeAddressDetail, i: number) => (
                  <CardSearchDetails
                    key={`${adressDetails.address}-${i}`}
                    result={adressDetails}
                    onClick={flyTo}
                    onClickClose={removeSoughtAddress}
                  />
                ))
                .reverse()}
          </MapSearchResult>
        </MapControlWrapper>

        {/* Legend Box */}
        <MapControlWrapper right bottom>
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
            forceClosed={soughtAddress.length > 0}
          />
        </MapControlWrapper>

        {/* Search Box */}
        <MapControlWrapper right top>
          <MapSearchForm onAddressSelect={onAddressSelectHandle} />
        </MapControlWrapper>

        <div ref={mapContainer} className="map" />
      </div>
    </>
  );
}
