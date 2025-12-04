import type { FilterSpecification, LayerSpecification, Map, StyleSetterOptions, VectorSourceSpecification } from 'maplibre-gl';

import { clientConfig } from '@/client-config';
import { customGeojsonLayersSpec } from '@/components/Map/layers/customGeojson';
import { geomUpdateLayersSpec } from '@/components/Map/layers/geomUpdate';
import { quartiersPrioritairesPolitiqueVilleLayersSpec } from '@/components/Map/layers/quartiersPrioritairesPolitiqueVille';
import type { MapConfiguration } from '@/components/Map/map-configuration';
import { tileSourcesMaxZoom } from '@/modules/tiles/constants';
import { deepMergeObjects, isDefined } from '@/utils/core';

import { buildingsDataExtractionLayers } from './components/tools/BuildingsDataExtractionTool';
import { distancesMeasurementLayers } from './components/tools/DistancesMeasurementTool';
import { linearHeatDensityLayers } from './components/tools/LinearHeatDensityTool';
import { adressesEligiblesLayersSpec } from './layers/adressesEligibles';
import { batimentsRaccordesReseauxChaleurFroidLayersSpec } from './layers/batimentsRaccordesReseauxChaleurFroid';
import { caracteristiquesBatimentsLayersSpec } from './layers/bdnb/caracteristiquesBatiments';
import { typeChauffageBatimentsCollectifsLayersSpec } from './layers/bdnb/typeChauffageBatimentsCollectifs';
import { besoinsEnChaleurLayersSpec } from './layers/besoinsEnChaleur';
import { besoinsEnChaleurIndustrieCommunesLayersSpec } from './layers/besoinsEnChaleurIndustrieCommunes';
import type { LayerSymbolSpecification, MapSourceLayersSpecification, PopupHandler } from './layers/common';
import { communesFortPotentielPourCreationReseauxChaleurLayersSpec } from './layers/communesFortPotentielPourCreationReseauxChaleur';
import { consommationsGazLayersSpec } from './layers/consommationsGaz';
import { demandesEligibiliteLayersSpec } from './layers/demandesEligibilite';
import {
  enrrMobilisablesChaleurFataleLayerSymbols,
  enrrMobilisablesChaleurFataleLayersSpec,
} from './layers/enrr-mobilisables/chaleurFatale';
import { enrrMobilisablesFrichesLayersSpec } from './layers/enrr-mobilisables/friches';
import { enrrMobilisablesParkingsLayersSpec } from './layers/enrr-mobilisables/parkings';
import { enrrMobilisablesThalassothermieLayersSpec } from './layers/enrr-mobilisables/thalassothermie';
import { enrrMobilisablesZonesGeothermieProfondeLayersSpec } from './layers/enrr-mobilisables/zonesGeothermieProfonde';
import { etudesEnCoursLayersSpec } from './layers/etudesEnCours';
import { installationsGeothermieProfondeLayersSpec } from './layers/geothermie/installationsGeothermieProfonde';
import { installationsGeothermieSurfaceLayersSpec } from './layers/geothermie/installationsGeothermieSurface';
import { ouvragesGeothermieSurfaceLayersSpec } from './layers/geothermie/ouvragesGeothermieSurface';
import { perimetresGeothermieProfondeLayersSpec } from './layers/geothermie/perimetresGeothermieProfonde';
import { perimetresDeDeveloppementPrioritaireLayersSpec } from './layers/perimetresDeDeveloppementPrioritaire';
import { reseauxDeChaleurLayersSpec } from './layers/reseauxDeChaleur';
import { reseauxDeFroidLayersSpec } from './layers/reseauxDeFroid';
import { reseauxEnConstructionLayersSpec } from './layers/reseauxEnConstruction';
import { ressourcesGeothermalesNappesLayersSpec } from './layers/ressourcesGeothermalesNappes';
import { testsAdressesLayersSpec } from './layers/testsAdresses';
import { zonesAUrbaniserLayersSpec } from './layers/zonesAUrbaniser';
import { zonesPotentielChaudLayersSpec } from './layers/zonesPotentielChaud';
import { zonesPotentielFroidLayersSpec } from './layers/zonesPotentielFroid';

/**
 * Symbols used by layers and that must be loaded at map initialization.
 */
export const layerSymbolsImagesURLs = [
  {
    key: 'square',
    sdf: true,
    url: '/icons/square.png',
  },
  {
    key: 'marker-red',
    url: '/icons/marker-red.png',
  },
  {
    key: 'marker-green',
    url: '/icons/marker-green.png',
  },
  {
    key: 'marker-blue',
    url: '/icons/marker-blue.png',
  },
  ...enrrMobilisablesChaleurFataleLayerSymbols,
] as const satisfies readonly LayerSymbolSpecification[];

type LayerSymbolImage = (typeof layerSymbolsImagesURLs)[number]['key'];

export const selectableLayers = [
  {
    key: 'reseau_chaleur',
    label: 'Les réseaux de chaleur existants',
  },
  {
    key: 'futur_reseau',
    label: 'Les réseaux de chaleur en construction',
  },
  {
    key: 'pdp',
    label: 'Les périmètres de développement prioritaire',
  },
  {
    key: 'reseau_froid',
    label: 'Les réseaux de froid',
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
  'customGeojson',
  'geomUpdate',
  'testsAdresses',
] as const;

export type MapLegendFeature = (typeof mapLegendFeatures)[number];

export const legendURLKeyToLegendFeature: Record<LegendURLKey | string, MapLegendFeature> = {
  futur_reseau: 'reseauxEnConstruction',
  pdp: 'zonesDeDeveloppementPrioritaire',
  raccordementsChaud: 'batimentsRaccordesReseauxChaleur',
  raccordementsFroid: 'batimentsRaccordesReseauxFroid',
  reseau_chaleur: 'reseauxDeChaleur',
  reseau_froid: 'reseauxDeFroid',
};

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
        popupOffset?: never;
      }
    | {
        unselectable?: false; // false by default, allows hover effect + cursor change + click to open a popup
        popup: PopupHandler;
        popupOffset?: [number, number];
      }
  );

export const mapLayers = [
  ...customGeojsonLayersSpec,
  ...geomUpdateLayersSpec,
  ...enrrMobilisablesZonesGeothermieProfondeLayersSpec,
  ...ressourcesGeothermalesNappesLayersSpec,
  ...zonesPotentielChaudLayersSpec,
  ...zonesPotentielFroidLayersSpec,
  ...zonesAUrbaniserLayersSpec,
  ...caracteristiquesBatimentsLayersSpec,
  ...besoinsEnChaleurIndustrieCommunesLayersSpec,
  ...quartiersPrioritairesPolitiqueVilleLayersSpec,
  ...perimetresDeDeveloppementPrioritaireLayersSpec,
  ...perimetresGeothermieProfondeLayersSpec,
  ...reseauxEnConstructionLayersSpec,
  ...besoinsEnChaleurLayersSpec,
  ...enrrMobilisablesFrichesLayersSpec,
  ...enrrMobilisablesParkingsLayersSpec,
  ...enrrMobilisablesThalassothermieLayersSpec,
  ...batimentsRaccordesReseauxChaleurFroidLayersSpec,
  ...typeChauffageBatimentsCollectifsLayersSpec,
  ...consommationsGazLayersSpec,
  ...demandesEligibiliteLayersSpec,
  ...testsAdressesLayersSpec,
  ...reseauxDeChaleurLayersSpec,
  ...reseauxDeFroidLayersSpec,
  ...enrrMobilisablesChaleurFataleLayersSpec,
  ...ouvragesGeothermieSurfaceLayersSpec,
  ...installationsGeothermieSurfaceLayersSpec,
  ...installationsGeothermieProfondeLayersSpec,
  ...communesFortPotentielPourCreationReseauxChaleurLayersSpec,
  ...etudesEnCoursLayersSpec,
  ...adressesEligiblesLayersSpec,

  // other sources: distances measurement, linear heat density, buildings data extraction
  ...distancesMeasurementLayers,
  ...linearHeatDensityLayers,
  ...buildingsDataExtractionLayers,
] as const satisfies readonly MapSourceLayersSpecification[];

export type LayerId = (typeof mapLayers)[number]['layers'][number]['id'];

// extends the Map type to get fully typed layer and source ids
interface FCUMap extends Map {
  getLayer(id: LayerId): ReturnType<Map['getLayer']>;
  setLayoutProperty(layerId: LayerId, name: string, value: any, options?: StyleSetterOptions): this;

  setFilter(layerId: LayerId, filter?: FilterSpecification | null, options?: StyleSetterOptions): this;
}

export function loadMapLayers(map: FCUMap, config: MapConfiguration) {
  mapLayers.forEach((spec) => {
    // sometimes the same source is used by multiple layers, so we need to add it only once
    if (!map.getSource(spec.sourceId)) {
      map.addSource(spec.sourceId, {
        ...spec.source,
        ...(spec.source.type === 'vector'
          ? {
              maxzoom: (spec.source as VectorSourceSpecification).maxzoom ?? tileSourcesMaxZoom,
              // prepend the website origin to the tiles as we need the full url for tiles
              tiles: spec.source.tiles.map((url) => `${clientConfig.websiteUrl}${url}`),
            }
          : {}),
      });
    }

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
    .flatMap((source) => source.layers as readonly (typeof mapLayers)[number]['layers'][number][])
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
