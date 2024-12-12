import { type MapConfiguration } from '@/components/Map/map-configuration';
import { type MapLayerSpecification } from '@/components/Map/map-layers';

import { ifHoverElse, type LayerSymbolSpecification, type MapSourceLayersSpecification } from '../common';

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

type EnrrMobilisablesChaleurFataleImage = (typeof enrrMobilisablesChaleurFataleLayerSymbols)[number]['key'];

type ChaleurFataleLayerConf<LayerId = string> = {
  id: LayerId;
  iconImage: EnrrMobilisablesChaleurFataleImage;
  featureType: string;
  layerConfKey: keyof MapConfiguration['enrrMobilisablesChaleurFatale'];
};

const layersConf = [
  {
    id: 'enrrMobilisables-stations-d-epuration',
    iconImage: 'enrr_mobilisables_stations_epuration',
    featureType: 'stations_d_epuration',
    layerConfKey: 'showStationsDEpuration',
  },
  {
    id: 'enrrMobilisables-datacenter',
    iconImage: 'enrr_mobilisables_datacenter',
    featureType: 'datacenter',
    layerConfKey: 'showDatacenters',
  },
  {
    id: 'enrrMobilisables-industrie',
    iconImage: 'enrr_mobilisables_industrie',
    featureType: 'industrie',
    layerConfKey: 'showIndustrie',
  },
  {
    id: 'enrrMobilisables-installations-electrogenes',
    iconImage: 'enrr_mobilisables_installations_electrogenes',
    featureType: 'installations_electrogenes',
    layerConfKey: 'showInstallationsElectrogenes',
  },
  {
    id: 'enrrMobilisables-unites-d-incineration',
    iconImage: 'enrr_mobilisables_unites_incineration',
    featureType: 'unites_d_incineration',
    layerConfKey: 'showUnitesDIncineration',
  },
] as const satisfies ReadonlyArray<ChaleurFataleLayerConf>;

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
    layers: layersConf.flatMap((conf) => buildLayerAndHoverLayer(conf)),
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

/**
 * Pour chaque layer, construit 2 couches identiques, une pour voir les données,
 * l'autre pour afficher la feature survolée (icone plus grande)
 */
function buildLayerAndHoverLayer<LayerId extends string>(
  conf: ChaleurFataleLayerConf<LayerId>
): readonly [MapLayerSpecification<LayerId>, MapLayerSpecification<`${LayerId}-hover`>] {
  return [
    {
      id: conf.id,
      type: 'symbol',
      layout: {
        'icon-image': conf.iconImage,
        'icon-overlap': 'always',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
      },
      paint: {
        // display all features except the hovered one
        'icon-opacity': ifHoverElse(0, 1),
      },
      filter: () => ['in', conf.featureType, ['get', 'GmlID']],
      isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale[conf.layerConfKey],
    },
    {
      id: `${conf.id}-hover`,
      type: 'symbol',
      layout: {
        'icon-image': conf.iconImage,
        'icon-overlap': 'always',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 10, 1.2], // + 0.2
      },
      paint: {
        // only display the hovered feature
        'icon-opacity': ifHoverElse(1, 0),
      },
      filter: () => ['in', conf.featureType, ['get', 'GmlID']],
      isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale[conf.layerConfKey],
      unselectable: true,
    },
  ] as const satisfies ReadonlyArray<MapLayerSpecification>;
}
