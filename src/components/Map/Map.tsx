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
import ControlWrapper from './ControlWrapper';
import {
  MapAsideContainer,
  MapControlWrapper,
  MapGlobalStyle,
  MapWrapper,
} from './Map.style';
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
    setSoughtAddress([{ coordinates, address, addressDetails, search }]);
    setPosition(coordinates);
    setSearchMarker(true);
  };

  return (
    <MapWrapper>
      <MapGlobalStyle />
      <MapContainer
        center={defaultPosition}
        maxZoom={18}
        minZoom={4}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_API_TOKEN}`}
          attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>'
        />
        <VectorGrid
          url="/api/map/network/{z}/{x}/{y}"
          style={{
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
          }}
          attribution="&copy; beta.gouv"
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
                        flyOnClick={15}
                      />
                    ))
                    .reverse()}
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

export default Map;
