import VectorGrid from '@components/Leaflet.VectorGrid';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Wrapper } from './Map.style';

const MAPBOX_API_TOKEN = `${process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}`;

const Map = () => {
  return (
    <Wrapper>
      <MapContainer
        center={[48.85294, 2.34987]}
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
              fill: true,
              fillOpacity: 1,
              weight: 2,
            },
            boilerRoom: (properties: any, zoom: number) => ({
              color: '#ff6600',
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
      </MapContainer>
    </Wrapper>
  );
};

export default Map;
