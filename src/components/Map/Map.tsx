import VectorGrid from '@components/Leaflet.VectorGrid';
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import React, { useState } from 'react';
import {
  FeatureGroup,
  MapContainer,
  Marker,
  ScaleControl,
  TileLayer,
  useMapEvent,
} from 'react-leaflet';
import { Point } from 'src/types';
import CardSearchDetails, { AddressDetail } from './CardSearchDetails';
import { MapCard } from './CardSearchDetails.style';
import ControlWrapper from './ControlWrapper';
import {
  LegendGlobalStyle,
  MapAsideContainer,
  MapControlWrapper,
  MapGlobalStyle,
  MapWrapper,
} from './Map.style';
import MapGlobalOptions from './MapGlobalOptions';
import MapSearchForm, { TypeHandleAddressSelect } from './MapSearchForm';

const MAPBOX_API_TOKEN = `${process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}`;
const searchResultIcon = L.divIcon({ className: 'my-div-icon', html: '<i/>' });

function SetViewOnClick() {
  const map = useMapEvent('click', (e) => {
    console.info('e.latlng =>', e.latlng, '/ Current Zoom =>', map.getZoom());
    // TODO: Set new address point
    // map.setView(e.latlng, map.getZoom(), {
    //   animate: true,
    // });
  });

  return null;
}

const Map = () => {
  const defaultPosition: L.LatLngExpression = [48.85294, 2.34987];
  const [position, setPosition]: [L.LatLngExpression, React.Dispatch<Point>] =
    useState(defaultPosition);
  const [searchMarker, setSearchMarker] = useState(false);
  const [soughtAddress, setSoughtAddress]: [
    any | never[],
    React.Dispatch<any | never[]>
  ] = useState([]);

  const [layerDisplay, setLayerDisplay]: [
    Record<string, any>,
    React.Dispatch<any | never[]>
  ] = useState({
    outline: true,
    substation: true,
    boilerRoom: true,
  });

  const onAddressSelectHandle: TypeHandleAddressSelect = (
    address,
    coordinates,
    addressDetails
  ) => {
    console.info(
      'onAddressSelectHandle =>',
      address,
      coordinates,
      addressDetails
    );
    const search = {
      date: Date.now(),
    };
    setSoughtAddress([
      // ...soughtAddress,  //TODO: Enable for support multi address
      { coordinates, address, addressDetails, search },
    ]);
    setPosition(coordinates);
    setSearchMarker(true);
  };

  const layerNameOptions = ['outline', 'substation', 'boilerRoom'] as const;
  type LayerNameOption = typeof layerNameOptions[number];
  const toggleLayer = (layerName: LayerNameOption) => () => {
    setLayerDisplay({
      ...layerDisplay,
      [layerName]: !layerDisplay?.[layerName] ?? false,
    });
  };

  const maxZoom = 18;
  const minZoom = 4;
  const defaultZoom = 13;

  return (
    <MapWrapper>
      <MapGlobalStyle />
      <MapContainer
        center={defaultPosition}
        maxZoom={maxZoom}
        minZoom={minZoom}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
      >
        <MapGlobalOptions attributionPrefix='<a href="https://beta.gouv.fr/" target="_blank">beta.gouv</a>' />
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_API_TOKEN}`}
          attribution='Outils cartographique : <a href="https://leafletjs.com/" target="_blank">Leaflet</a> | Données Cartographiques : &copy; <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors (sous license <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>), fond de carte &copy; <a href="https://www.mapbox.com/" target="_blank">Mapbox</a>'
        />
        <VectorGrid
          url="/api/map/network/{z}/{x}/{y}"
          style={vectorGridTheme(layerDisplay, maxZoom)}
          interactive
        />

        {searchMarker && <Marker position={position} icon={searchResultIcon} />}

        <ScaleControl maxWidth={200} imperial={false} metric />
        <FeatureGroup
          pane="popupPane"
          interactive={false}
          bubblingMouseEvents={true}
        >
          <div className="pan-map-aside">
            <MapControlWrapper>
              <MapAsideContainer className="search-result">
                {soughtAddress.length > 0 &&
                  soughtAddress
                    .map((adressDetails: AddressDetail, i: number) => (
                      <CardSearchDetails
                        key={`${adressDetails.address}-${i}`}
                        result={adressDetails}
                        flyOnClick={17}
                      />
                    ))
                    .reverse()}
              </MapAsideContainer>

              <MapAsideContainer bottom>
                <ControlWrapper event="dblclick mousewheel scroll">
                  <MapCard typeCard={'legend'}>
                    <LegendGlobalStyle />
                    <header>Legende</header>

                    <section>
                      <div>
                        <label>
                          <input
                            type="checkbox"
                            checked={!!layerDisplay.outline}
                            onChange={toggleLayer('outline')}
                          />{' '}
                          <span className="legend legend-heat-network" />
                          Reseaux de chaleur
                        </label>
                      </div>
                      <div>
                        <label>
                          <input
                            type="checkbox"
                            checked={!!layerDisplay.boilerRoom}
                            onChange={toggleLayer('boilerRoom')}
                          />{' '}
                          <span className="legend legend-boiler-room" />
                          Chaufferie
                        </label>
                      </div>
                      <div>
                        <label>
                          <input
                            type="checkbox"
                            checked={!!layerDisplay.substation}
                            onChange={toggleLayer('substation')}
                          />{' '}
                          <span className="legend legend-substation" />
                          Sous station
                        </label>
                      </div>
                    </section>
                  </MapCard>
                </ControlWrapper>
              </MapAsideContainer>

              <MapAsideContainer>
                <ControlWrapper>
                  <MapSearchForm onAddressSelect={onAddressSelectHandle} />
                </ControlWrapper>
              </MapAsideContainer>
            </MapControlWrapper>
          </div>
        </FeatureGroup>
        <SetViewOnClick />
      </MapContainer>
    </MapWrapper>
  );
};

const typeEnergy: any = {
  fioul_domestique: 'fuelOil',
  gaz_naturel: 'gas',
  gaz_propane_butane: 'gas',
  charbon: 'wood',
  bois_de_chauffage: 'wood',
  electricite: 'electric',
  energie_autre: 'unknow',
  'sans objet': 'unknow',
  default: 'unknow',
};

const typeHeating: any = {
  collectif: 'collective',
  individuel: 'individual',
  mixte: 'mixed',
  sans_chauffage: 'unknow',
  'sans objet': 'unknow',
};

const themeDefEnergy: any = {
  fuelOil: { color: '#c72e6e' },
  gas: { color: '#9c47e2' },
  wood: { color: '#ce7f17' },
  electric: { color: '#4cd362' },
  unknow: { color: '#818181' },
};

const getThemeEnergy = (energy: string) =>
  themeDefEnergy[typeEnergy?.[energy] || 'unknow'];

const vectorGridTheme = (
  layerDisplay: Record<string, unknown>,
  maxZoom: number
) => {
  const getVisibility = (properties: Record<string, any>, dataDisplay: any) => {
    let visibility = true;

    // Test Energy:
    const energyGeneric: string = properties?.['energie_utilisee'];
    visibility =
      visibility && dataDisplay.energy.includes(typeEnergy[energyGeneric]);

    // Test Heating:
    const heatingGeneric: string = properties?.['type_chauffage'];
    visibility =
      visibility && dataDisplay.heating.includes(typeHeating[heatingGeneric]);

    return visibility;
  };

  return {
    outline: (properties: any, zoom: number) => ({
      color: '#2d9748',
      opacity: zoom > 15 ? 1 : 0.75,
      fill: true,
      weight: zoom > 15 ? 5 : 3,
    }),
    substation: {
      color: '#ff00d4',
      opacity: 1,
      fill: true,
      fillOpacity: 1,
      weight: 2,
    },
    boilerRoom: (properties: any, zoom: number) => ({
      color: '#ff6600',
      opacity: 1,
      lineJoin: 'miter',
      fill: true,
      fillOpacity: zoom > 15 ? 0.5 : 1,
      fillRule: 'nonzero',
      weight: 2,
    }),
    gasUsage: {
      color: '#6c13e0',
      opacity: 0,
      radius: 3,
    },
    condominiumRegister: (properties: any, zoom: number) => ({
      ...getThemeEnergy(properties.energie_utilisee),
      opacity: !getVisibility(properties, layerDisplay) ? 0 : 0.3,

      fill: true,
      fillOpacity: !getVisibility(properties, layerDisplay) ? 0 : 0.8,
      radius: Number.parseFloat((9 / (maxZoom - zoom + 1)).toFixed(2)),
    }),
  };
};

export default Map;
