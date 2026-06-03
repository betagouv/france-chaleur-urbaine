import { Alert } from '@codegouvfr/react-dsfr/Alert';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import dynamic from 'next/dynamic';
import { useCallback, useMemo } from 'react';

import { createMapConfiguration } from '@/components/Map/map-configuration';
import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/types';

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

export function BatEnrBatimentsMap({
  batiments,
  className,
  initialCenter,
  onSelect,
}: {
  batiments: BatEnrBatiment[];
  className?: string;
  initialCenter?: [number, number];
  onSelect: (batiment: BatEnrBatiment) => void;
}) {
  const features = useMemo(
    () =>
      batiments
        .filter(
          (batiment): batiment is BatEnrBatiment & { geometry: NonNullable<BatEnrBatiment['geometry']> } => batiment.geometry !== null
        )
        .map((batiment, index) => ({
          geometry: batiment.geometry,
          id: batiment.batiment_construction_id ?? `batiment-$index`,
          properties: {
            batiment_construction_id: batiment.batiment_construction_id,
            classe_bilan_dpe: batiment.classe_bilan_dpe,
            nom_reseau: `Bâtiment ${index + 1} - ${batiment.batiment_construction_id}`,
          },
          type: 'Feature' as const,
        })),
    [batiments]
  );

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

  return features.length > 0 ? (
    <div className={className}>
      <Map
        initialCenter={initialCenter}
        initialZoom={18}
        geomUpdateFeatures={features}
        onFeatureClick={handleFeatureClick}
        initialMapConfiguration={createMapConfiguration({
          geomUpdate: true,
        })}
      />
    </div>
  ) : (
    <Alert small severity="warning" description="Aucun bâtiment n’est recensé à cette adresse." />
  );
}
