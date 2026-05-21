import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { bbox } from '@turf/bbox';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import dynamic from 'next/dynamic';
import { useCallback, useMemo } from 'react';

import { createMapConfiguration } from '@/components/Map/map-configuration';
import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/types';
import type { BoundingBox } from '@/modules/geo/types';

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

type BatEnrBatimentSelectionProps = {
  batiments: BatEnrBatiment[];
  initialCenter?: [number, number];
  onSelect: (batiment: BatEnrBatiment) => void;
};

type BatEnrBatimentWithGeometry = BatEnrBatiment & {
  geometry: GeoJSON.Geometry;
};

const getBatimentLabel = (batiment: BatEnrBatiment, index: number) => {
  return `Bâtiment ${index + 1}${batiment.batiment_construction_id ? ` - ${batiment.batiment_construction_id}` : ''}`;
};

const hasGeometry = (batiment: BatEnrBatiment): batiment is BatEnrBatimentWithGeometry => {
  return batiment.geometry !== null;
};

/**
 * Displays the Batenr buildings attached to one address and lets the user
 * pick the construction that should drive the renewable heat simulation.
 */
export function BatEnrBatimentSelection({ batiments, initialCenter, onSelect }: BatEnrBatimentSelectionProps) {
  const features = useMemo(
    () =>
      batiments.filter(hasGeometry).map((batiment, index) => ({
        geometry: batiment.geometry,
        id: batiment.batiment_construction_id ?? `batiment-${index}`,
        properties: {
          batiment_construction_id: batiment.batiment_construction_id,
          classe_bilan_dpe: batiment.classe_bilan_dpe,
          nom_reseau: getBatimentLabel(batiment, index),
        },
        type: 'Feature' as const,
      })),
    [batiments]
  );

  const bounds = useMemo(() => {
    if (features.length === 0) {
      return undefined;
    }

    const featureCollection = {
      features,
      type: 'FeatureCollection' as const,
    };
    const featureBounds = bbox(featureCollection);

    return featureBounds.length === 4
      ? ([featureBounds[0], featureBounds[1], featureBounds[2], featureBounds[3]] satisfies BoundingBox)
      : undefined;
  }, [features]);

  const handleFeatureClick = useCallback(
    (feature: MapGeoJSONFeature) => {
      const batimentConstructionId = feature.properties?.batiment_construction_id;

      if (typeof batimentConstructionId !== 'string') {
        return;
      }

      const selectedBatiment = batiments.find((batiment) => batiment.batiment_construction_id === batimentConstructionId);

      if (selectedBatiment) {
        onSelect(selectedBatiment);
      }
    },
    [batiments, onSelect]
  );

  return (
    <div>
      {features.length > 0 && (
        <div className="h-[560px] min-h-[420px] overflow-hidden border border-solid border-border-default-grey">
          <Map
            withoutLogo
            withBorder
            withSoughtAddresses={false}
            initialCenter={initialCenter}
            initialZoom={18}
            bounds={bounds}
            geomUpdateFeatures={features}
            onFeatureClick={handleFeatureClick}
            initialMapConfiguration={createMapConfiguration({
              geomUpdate: true,
            })}
          />
        </div>
      )}
      {features.length === 0 && (
        <Alert small severity="warning" description="Aucun bâtiment avec géométrie n’est disponible pour cette adresse." />
      )}
    </div>
  );
}
