import { keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';

import Loader from '@/components/ui/Loader';
import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { MapFitBounds } from '@/modules/map/client/interactions/MapFitBounds';
import { type MapDynamicLayer, MapLayers } from '@/modules/map/client/layers/useMapLayers';
import { Map } from '@/modules/map/client/Map';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

import type { CustomTerritoryRecipe } from '../constants';

// Same look as the permissions map of the user profile (`permissions/client/PermissionsMap`).
const territoryColor = '#e11d48';
const excludedColor = '#6b7280';

const mapConfiguration = createMapConfiguration({
  reseauxDeChaleur: { show: true },
  reseauxEnConstruction: true,
  zonesDeDeveloppementPrioritaire: true,
});

// Both sources always exist (possibly empty) so a recipe change only swaps their data, never the layers.
const layers: MapDynamicLayer[] = [
  { id: 'recipe-excluded-fill', paint: { 'fill-color': excludedColor, 'fill-opacity': 0.3 }, source: 'recipe-excluded', type: 'fill' },
  {
    id: 'recipe-excluded-outline',
    paint: { 'line-color': excludedColor, 'line-opacity': 0.8, 'line-width': 1 },
    source: 'recipe-excluded',
    type: 'line',
  },
  { id: 'recipe-territory-fill', paint: { 'fill-color': territoryColor, 'fill-opacity': 0.12 }, source: 'recipe-territory', type: 'fill' },
  {
    id: 'recipe-territory-outline',
    paint: { 'line-color': territoryColor, 'line-opacity': 0.8, 'line-width': 2 },
    source: 'recipe-territory',
    type: 'line',
  },
];

const toFeatureCollection = (geometry: GeoJSON.Geometry | null): GeoJSON.FeatureCollection => ({
  features: geometry ? [{ geometry, properties: {}, type: 'Feature' }] : [],
  type: 'FeatureCollection',
});

type RecipeMapPreviewProps = {
  recipe: CustomTerritoryRecipe;
};

/**
 * Live map of a recipe: the resulting territory highlighted, the excluded territories in grey,
 * so the admin can check the perimeter before saving. Renders nothing while the recipe covers no commune.
 */
function RecipeMapPreview({ recipe }: RecipeMapPreviewProps) {
  const hasIncludedTerritory = recipe.include.length > 0;
  const preview = trpc.customTerritories.admin.previewRecipeGeometry.useQuery(recipe, {
    enabled: hasIncludedTerritory,
    // keep the map mounted while the next outline is computed
    placeholderData: keepPreviousData,
  });
  const territory = preview.data?.territory;
  const excluded = preview.data?.excluded;
  const sources = useMemo(
    () => [
      { data: toFeatureCollection(excluded ?? null), id: 'recipe-excluded' },
      { data: toFeatureCollection(territory ?? null), id: 'recipe-territory' },
    ],
    [territory, excluded]
  );

  if (!hasIncludedTerritory) {
    return null;
  }
  if (!preview.data) {
    return (
      <div className="h-[350px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }
  const { bounds } = preview.data;
  if (!bounds) {
    return null;
  }

  return (
    <div>
      <div className={cx('h-[350px]', preview.isPlaceholderData && 'opacity-60')}>
        <Map config={mapConfiguration} initialView={{ bbox: bounds }} legend={false}>
          <MapLayers sources={sources} layers={layers} />
          <MapFitBounds bbox={bounds} />
        </Map>
      </div>
      <p className="text-sm text-faded mt-1">En rouge, le territoire obtenu ; en gris, les territoires exclus.</p>
    </div>
  );
}

export default RecipeMapPreview;
