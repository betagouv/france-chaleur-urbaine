import { type LayerSymbolSpecification, type MapSourceLayersSpecification } from '../common';

export const enrrMobilisablesChaleurFataleLayerSymbols = [
  {
    key: 'enrr_mobilisables_datacenter',
    url: '/icons/enrr_mobilisables_datacenter.png',
  },
  {
    key: 'enrr_mobilisables_industrie',
    url: '/icons/enrr_mobilisables_industrie.png',
  },
  {
    key: 'enrr_mobilisables_installations_electrogenes',
    url: '/icons/enrr_mobilisables_installations_electrogenes.png',
  },
  {
    key: 'enrr_mobilisables_stations_epuration',
    url: '/icons/enrr_mobilisables_stations_epuration.png',
  },
  {
    key: 'enrr_mobilisables_unites_incineration',
    url: '/icons/enrr_mobilisables_unites_incineration.png',
  },
] as const satisfies ReadonlyArray<LayerSymbolSpecification>;

export const enrrMobilisablesChaleurFataleLayersSpec = [
  {
    sourceId: 'enrrMobilisables',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables/{z}/{x}/{y}'],
      promoteId: 'GmlID',
    },

    // the source contains one layer that contains all features
    // we know the kind of one feature using the GmlID (e.g. datacenter.1)
    // we have 5 layers, one for each kind of features to simplify show/hide code
    layers: [
      {
        id: 'enrrMobilisables-stations-d-epuration',
        type: 'symbol',
        layout: {
          'icon-image': 'enrr_mobilisables_stations_epuration',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
        },

        filter: () => ['in', 'stations_d_epuration', ['get', 'GmlID']],
        isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showStationsDEpuration,
      },
      {
        id: 'enrrMobilisables-datacenter',
        type: 'symbol',
        layout: {
          'icon-image': 'enrr_mobilisables_datacenter',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
        },

        filter: () => ['in', 'datacenter', ['get', 'GmlID']],
        isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showDatacenters,
      },
      {
        id: 'enrrMobilisables-industrie',
        type: 'symbol',
        layout: {
          'icon-image': 'enrr_mobilisables_industrie',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
        },

        filter: () => ['in', 'industrie', ['get', 'GmlID']],
        isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showIndustrie,
      },
      {
        id: 'enrrMobilisables-installations-electrogenes',
        type: 'symbol',
        layout: {
          'icon-image': 'enrr_mobilisables_installations_electrogenes',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
        },

        filter: () => ['in', 'installations_electrogenes', ['get', 'GmlID']],
        isVisible: (config) =>
          config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showInstallationsElectrogenes,
      },
      {
        id: 'enrrMobilisables-unites-d-incineration',
        type: 'symbol',
        layout: {
          'icon-image': 'enrr_mobilisables_unites_incineration',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
        },

        filter: () => ['in', 'unites_d_incineration', ['get', 'GmlID']],
        isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showUnitesDIncineration,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
