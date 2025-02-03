import {
  type VectorSourceSpecification,
  type FilterSpecification,
  type LayerSpecification,
  type Map,
  type StyleSetterOptions,
} from 'maplibre-gl';

import { clientConfig } from '@/client-config';
import { quartiersPrioritairesPolitiqueVilleLayersSpec } from '@/components/Map/layers/quartiersPrioritairesPolitiqueVille';
import { type MapConfiguration } from '@/components/Map/map-configuration';
import { deepMergeObjects, isDefined } from '@/utils/core';

import { buildingsDataExtractionLayers } from './components/tools/BuildingsDataExtractionTool';
import { distancesMeasurementLayers } from './components/tools/DistancesMeasurementTool';
import { linearHeatDensityLayers } from './components/tools/LinearHeatDensityTool';
import { batimentsRaccordesReseauxChaleurFroidLayersSpec } from './layers/batimentsRaccordesReseauxChaleurFroid';
import { besoinsEnChaleurLayersSpec } from './layers/besoinsEnChaleur';
import { besoinsEnChaleurIndustrieCommunesLayersSpec } from './layers/besoinsEnChaleurIndustrieCommunes';
import { caracteristiquesBatimentsLayersSpec } from './layers/caracteristiquesBatiments';
import {
  type PopupStyleHelpers,
  tileSourcesMaxZoom,
  type LayerSymbolSpecification,
  type MapSourceLayersSpecification,
} from './layers/common';
import { communesFortPotentielPourCreationReseauxChaleurLayersSpec } from './layers/communesFortPotentielPourCreationReseauxChaleur';
import { consommationsGazLayersSpec } from './layers/consommationsGaz';
import { demandesEligibiliteLayersSpec } from './layers/demandesEligibilite';
import {
  enrrMobilisablesChaleurFataleLayersSpec,
  enrrMobilisablesChaleurFataleLayerSymbols,
} from './layers/enrr-mobilisables/chaleurFatale';
import { enrrMobilisablesFrichesLayersSpec } from './layers/enrr-mobilisables/friches';
import { enrrMobilisablesParkingsLayersSpec } from './layers/enrr-mobilisables/parkings';
import { enrrMobilisablesThalassothermieLayersSpec } from './layers/enrr-mobilisables/thalassothermie';
import { enrrMobilisablesZonesGeothermieProfondeLayersSpec } from './layers/enrr-mobilisables/zonesGeothermieProfonde';
import { installationsGeothermieLayersSpec } from './layers/installationsGeothermie';
import { perimetresDeDeveloppementPrioritaireLayersSpec } from './layers/perimetresDeDeveloppementPrioritaire';
import { reseauxDeChaleurLayersSpec } from './layers/reseauxDeChaleur';
import { reseauxDeFroidLayersSpec } from './layers/reseauxDeFroid';
import { reseauxEnConstructionLayersSpec } from './layers/reseauxEnConstruction';
import { typeChauffageBatimentsCollectifsLayersSpec } from './layers/typeChauffageBatimentsCollectifs';
import { zonesPotentielChaudLayersSpec } from './layers/zonesPotentielChaud';

/**
 * Symbols used by layers and that must be loaded at map initialization.
 */
export const layerSymbolsImagesURLs = [
  {
    key: 'square',
    url: '/icons/square.png',
    sdf: true,
  },
  ...enrrMobilisablesChaleurFataleLayerSymbols,
] as const satisfies ReadonlyArray<LayerSymbolSpecification>;

type LayerSymbolImage = (typeof layerSymbolsImagesURLs)[number]['key'];

export const selectableLayers = [
  {
    label: 'Les réseaux de chaleur existants',
    key: 'reseau_chaleur',
  },
  {
    label: 'Les réseaux de chaleur en construction',
    key: 'futur_reseau',
  },
  {
    label: 'Les périmètres de développement prioritaire',
    key: 'pdp',
  },
  {
    label: 'Les réseaux de froid',
    key: 'reseau_froid',
  },
] as const;

export type LegendURLKey = (typeof selectableLayers)[number]['key'];

export const mapLegendFeatures = [
  'reseauxDeChaleur',
  'reseauxDeFroid',
  'reseauxEnConstruction',
  'zonesDeDeveloppementPrioritaire',
  'batimentsRaccordesReseauxChaleur',
  'batimentsRaccordesReseauxFroid',
] as const;

export type MapLegendFeature = (typeof mapLegendFeatures)[number];

export const legendURLKeyToLegendFeature: Record<LegendURLKey | string, MapLegendFeature> = {
  reseau_chaleur: 'reseauxDeChaleur',
  futur_reseau: 'reseauxEnConstruction',
  reseau_froid: 'reseauxDeFroid',
  pdp: 'zonesDeDeveloppementPrioritaire',
  raccordementsChaud: 'batimentsRaccordesReseauxChaleur',
  raccordementsFroid: 'batimentsRaccordesReseauxFroid',
};
export type PopupHandler<Data = any> = (data: Data, styleHelpers: PopupStyleHelpers) => React.ReactNode;

export type MapLayerSpecification<ILayerId = string> = Omit<LayerSpecification, 'source' | 'source-layer' | 'filter'> & {
  id: ILayerId;
  'source-layer'?: string;
  layout?: LayerSpecification['layout'] & {
    'icon-image'?: LayerSymbolImage;
  };
  isVisible: (config: MapConfiguration) => boolean;
  filter?: (config: MapConfiguration) => FilterSpecification;
} & (
    | {
        unselectable: true;
        popup?: never;
      }
    | {
        unselectable?: false; // false by default, allows hover effect + cursor change + click to open a popup
        popup: PopupHandler;
      }
  );

export const mapLayers = [
  ...enrrMobilisablesZonesGeothermieProfondeLayersSpec,
  ...zonesPotentielChaudLayersSpec,
  ...caracteristiquesBatimentsLayersSpec,
  ...besoinsEnChaleurIndustrieCommunesLayersSpec,
  ...quartiersPrioritairesPolitiqueVilleLayersSpec,
  ...perimetresDeDeveloppementPrioritaireLayersSpec,
  ...reseauxEnConstructionLayersSpec,
  ...besoinsEnChaleurLayersSpec,
  ...enrrMobilisablesFrichesLayersSpec,
  ...enrrMobilisablesParkingsLayersSpec,
  ...enrrMobilisablesThalassothermieLayersSpec,
  ...batimentsRaccordesReseauxChaleurFroidLayersSpec,
  ...typeChauffageBatimentsCollectifsLayersSpec,
  ...consommationsGazLayersSpec,
  ...demandesEligibiliteLayersSpec,
  ...reseauxDeChaleurLayersSpec,
  ...reseauxDeFroidLayersSpec,
  ...enrrMobilisablesChaleurFataleLayersSpec,
  ...installationsGeothermieLayersSpec,
  ...communesFortPotentielPourCreationReseauxChaleurLayersSpec,

  // other sources: distances measurement, linear heat density, buildings data extraction
  ...distancesMeasurementLayers,
  ...linearHeatDensityLayers,
  ...buildingsDataExtractionLayers,
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

export type LayerId = (typeof mapLayers)[number]['layers'][number]['id'];

// extends the Map type to get fully typed layer and source ids
interface FCUMap extends Map {
  getLayer(id: LayerId): ReturnType<Map['getLayer']>;
  setLayoutProperty(layerId: LayerId, name: string, value: any, options?: StyleSetterOptions): this;

  setFilter(layerId: LayerId, filter?: FilterSpecification | null, options?: StyleSetterOptions): this;
}

export function loadMapLayers(map: FCUMap, config: MapConfiguration) {
  mapLayers.forEach((spec) => {
    if (map.getSource(spec.sourceId)) {
      return;
    }

    map.addSource(spec.sourceId, {
      ...spec.source,
      ...(spec.source.type === 'vector'
        ? {
            // prepend the website origin to the tiles as we need the full url for tiles
            tiles: spec.source.tiles.map((url) => `${clientConfig.websiteOrigin}${url}`),
            maxzoom: (spec.source as VectorSourceSpecification).maxzoom ?? tileSourcesMaxZoom,
          }
        : {}),
    });
    spec.layers.forEach((layer) => {
      const filterFunc = (layer as MapLayerSpecification).filter;
      map.addLayer({
        source: spec.sourceId,
        ...(spec.source.type === 'vector'
          ? {
              'source-layer': 'layer', // default source layer name
            }
          : {}),
        ...layer,
        layout: deepMergeObjects((layer as any).layout ?? {}, {
          visibility: layer.isVisible(config) ? 'visible' : 'none',
        }),
        ...(isDefined(filterFunc)
          ? {
              filter: filterFunc(config),
            }
          : {}),
      } as any);
    });
  });
}

/**
 * Apply the map configuration to the map layers.
 */
export function applyMapConfigurationToLayers(map: FCUMap, config: MapConfiguration) {
  mapLayers
    .flatMap((source) => source.layers as ReadonlyArray<(typeof mapLayers)[number]['layers'][number]>)
    .forEach((layer) => {
      if (!map.getLayer(layer.id)) {
        console.warn(`Layer '${layer.id}' is not set on map`);
        return;
      }

      map.setLayoutProperty(layer.id, 'visibility', layer.isVisible(config) ? 'visible' : 'none');
      const filterFunc = (layer as MapLayerSpecification).filter;
      if (isDefined(filterFunc)) {
        map.setFilter(layer.id, filterFunc(config));
      }
    });
}
