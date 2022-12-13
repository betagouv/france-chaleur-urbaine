import { StyleSpecification } from 'maplibre-gl';

const config: StyleSpecification = {
  version: 8,
  glyphs: 'https://wxs.ign.fr/static/vectorTiles/fonts/{fontstack}/{range}.pbf',
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: [
        'https://wxs.ign.fr/essentiels/geoportail/wmts?layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}',
      ],
      tileSize: 256,
      attribution:
        "<a target='_blank' href='https://geoservices.ign.fr/documentation/donnees/ortho/bdortho'>© IGN</a>",
    },
    cadastre: {
      type: 'vector',
      url: 'https://openmaptiles.geo.data.gouv.fr/data/cadastre.json',
    },
    'decoupage-administratif': {
      type: 'vector',
      url: 'https://openmaptiles.geo.data.gouv.fr/data/decoupage-administratif.json',
    },
  },
  layers: [
    {
      id: 'simple-tiles',
      type: 'raster',
      source: 'raster-tiles',
    },
    {
      id: 'communes',
      type: 'line',
      source: 'decoupage-administratif',
      'source-layer': 'communes',
      minzoom: 10,
      layout: {
        'line-join': 'round',
        visibility: 'visible',
      },
      paint: {
        'line-color': '#ffffff',
      },
    },
    {
      id: 'departements',
      type: 'line',
      source: 'decoupage-administratif',
      'source-layer': 'departements',
      minzoom: 7,
      maxzoom: 10,
      layout: {
        'line-join': 'round',
        visibility: 'visible',
      },
      paint: {
        'line-color': '#ffffff',
      },
    },
    {
      id: 'regions',
      type: 'line',
      source: 'decoupage-administratif',
      'source-layer': 'regions',
      maxzoom: 7,
      layout: {
        'line-join': 'round',
        visibility: 'visible',
      },
      paint: {
        'line-color': '#ffffff',
      },
    },
  ],
};

export default config;
