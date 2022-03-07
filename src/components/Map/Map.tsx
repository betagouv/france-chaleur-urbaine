import VectorGrid from '@components/Leaflet.VectorGrid';
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import React, { useMemo, useState } from 'react';
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
  GroupeLabel,
  LabelLegend,
  LegendGlobalStyle,
  MapAsideContainer,
  MapControlWrapper,
  MapGlobalStyle,
  MapWrapper,
  ScaleLegend,
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
  const [legendOpened, setLegendOpened] = useState(true);

  const [layerDisplay, setLayerDisplay]: [
    Record<string, any>,
    React.Dispatch<any | never[]>
  ] = useState({
    outline: true,
    substation: true,
    boilerRoom: true,
    gasUsage: true,
    energy: ['fuelOil', 'gas'],
    heating: ['collective'],
  });

  const maxZoom = 18;
  const minZoom = 4;
  const defaultZoom = 13;

  const networkLayerTheme = useMemo(
    () => vectorGridTheme(layerDisplay, maxZoom),
    [layerDisplay]
  );
  const energyLayerTheme = useMemo(
    () => vectorGridTheme(layerDisplay, maxZoom),
    [layerDisplay]
  );

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

  const layerNameOptions = [
    'outline',
    'substation',
    'boilerRoom',
    'gasUsage',
  ] as const;
  type LayerNameOption = typeof layerNameOptions[number];
  const toggleLayer = (layerName: LayerNameOption) => () => {
    setLayerDisplay({
      ...layerDisplay,
      [layerName]: !layerDisplay?.[layerName] ?? false,
    });
  };

  const energyNameOptions = ['fuelOil', 'gas'] as const;
  type EnergyNameOption = typeof energyNameOptions[number];
  const toogleEnergyVisibility = (energyName: EnergyNameOption) => () => {
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
  };

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
          style={networkLayerTheme}
          interactive
        />
        <VectorGrid
          url="/api/map/energy/{z}/{x}/{y}"
          style={energyLayerTheme}
          interactive
        />
        <VectorGrid
          url="/api/map/gas/{z}/{x}/{y}"
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
                  <MapCard
                    typeCard={'legend'}
                    isClosable
                    className={
                      !legendOpened || soughtAddress.length > 0 ? 'close' : ''
                    }
                  >
                    <LegendGlobalStyle />
                    <header onClick={() => setLegendOpened(!legendOpened)}>
                      Legende
                    </header>

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

                      <hr />
                      <div>
                        <GroupeLabel>
                          <header>Type de chauffage</header>
                          <div className="groupe-label-body">
                            {energyNameOptions.map((energy) => (
                              <div className="label-item" key={energy}>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!layerDisplay.energy.includes(energy)
                                    }
                                    onChange={toogleEnergyVisibility(energy)}
                                  />
                                  <LabelLegend
                                    className="legend legend-energy"
                                    bgColor={themeDefEnergy[energy].color}
                                  />
                                  {localTypeEnergy[energy] ||
                                    localTypeEnergy.unknow}
                                </label>
                              </div>
                            ))}
                          </div>

                          <ScaleLegend
                            framed
                            label="Nombre de lots d'habitation"
                            color="#afafaf"
                            scaleLabels={[
                              { label: '-100', size: 0.5 },
                              { label: '100 à 1000', size: 1 },
                              { label: '+1000', size: 2 },
                            ]}
                          />
                          <ScaleLegend
                            checkbox
                            checked={!!layerDisplay.gasUsage}
                            onChange={toggleLayer('gasUsage')}
                            label="Niveau de consomation de gaz (MWh)"
                            color="#136ce040"
                            scaleLabels={[
                              { label: '-100', size: 0.5 },
                              { label: '100 à 1000', size: 1 },
                              { label: '+1000', size: 2 },
                            ]}
                          />
                        </GroupeLabel>
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
  fioul: 'fuelOil',
  fioul_domestique: 'fuelOil',
  gaz: 'gas',
  gaz_naturel: 'gas',
  gaz_propane_butane: 'gas',
  charbon: 'wood',
  bois_de_chauffage: 'wood',
  electricite: 'electric',
  energie_autre: 'unknow',
  'sans objet': 'unknow',
  default: 'unknow',
};

const localTypeEnergy = {
  fuelOil: 'Fioul collectif',
  gas: 'Gaz collectif',
  wood: 'Bois',
  electric: 'Electrique',
  unknow: 'Autre',
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
  const getEnergyVisibility = (
    properties: Record<string, any>,
    dataDisplay: any
  ) => {
    let visibility = true;

    // Test Energy:
    const energyGeneric: string = properties?.['energie_utilisee'];
    visibility =
      visibility && dataDisplay?.energy.includes(typeEnergy[energyGeneric]);

    // Test Heating:
    const heatingGeneric: string = properties?.['type_chauffage'];
    visibility =
      visibility && dataDisplay?.heating.includes(typeHeating[heatingGeneric]);

    return visibility;
  };
  const getLayerVisibility = (layerName: string, dataDisplay: any) =>
    !!dataDisplay?.[layerName];

  return {
    outline: (properties: any, zoom: number) => ({
      color: '#2d9748',
      opacity: !getLayerVisibility('outline', layerDisplay)
        ? 0
        : zoom > 15
        ? 1
        : 0.75,
      fill: true,
      weight: zoom > 15 ? 5 : 3,
    }),
    substation: {
      color: '#ff00d4',
      opacity: !getLayerVisibility('substation', layerDisplay) ? 0 : 1,
      fill: true,
      fillOpacity: !getLayerVisibility('substation', layerDisplay) ? 0 : 1,
      weight: 2,
    },
    boilerRoom: (properties: any, zoom: number) => ({
      color: '#ff6600',
      opacity: !getLayerVisibility('boilerRoom', layerDisplay) ? 0 : 1,
      lineJoin: 'miter',
      fill: true,
      fillOpacity: !getLayerVisibility('boilerRoom', layerDisplay)
        ? 0
        : zoom > 15
        ? 0.5
        : 1,
      fillRule: 'nonzero',
      weight: 2,
    }),
    gasUsage: (properties: any, zoom: number) => {
      const { conso } = properties;
      const radius = conso < 100 ? 12 : conso < 1000 ? 24 : 48;
      const defaultLayerProps = {
        energie_utilisee: 'gaz',
        type_chauffage: 'collectif',
      };
      return {
        color: '#136ce0',
        opacity: 0,
        fill: true,
        fillOpacity:
          !getLayerVisibility('gasUsage', layerDisplay) ||
          !getEnergyVisibility(defaultLayerProps, layerDisplay)
            ? 0
            : 0.25,
        radius: Number.parseFloat((radius / (maxZoom - zoom + 1)).toFixed(2)),
      };
    },
    condominiumRegister: (properties: any, zoom: number) => {
      const { nb_lot_habitation_bureau_commerce: nbLot } = properties;
      const radius = nbLot < 100 ? 12 : nbLot < 1000 ? 24 : 48;
      return {
        ...getThemeEnergy(properties.energie_utilisee),
        opacity: 0,
        fill: true,
        fillOpacity: !getEnergyVisibility(properties, layerDisplay) ? 0 : 0.65,
        radius: Number.parseFloat((radius / (maxZoom - zoom + 1)).toFixed(2)),
      };
    },
  };
};

export default Map;
