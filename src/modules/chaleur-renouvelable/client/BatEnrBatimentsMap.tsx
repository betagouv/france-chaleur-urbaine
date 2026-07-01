import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { bbox as getBbox } from '@turf/bbox';
import { useCallback, useMemo } from 'react';

import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/constants';
import { MapFitBounds } from '@/modules/map/client/interactions/MapFitBounds';
import { Map } from '@/modules/map/client/Map';
import type { BBox, InitialView } from '@/modules/map/shared/types';

import { BatEnrBatimentSelector, getBatEnrBatimentsFeatureCollection, isSelectableBatEnrBatiment } from './BatEnrBatimentSelector';

type BatEnrBatimentsMapProps = {
  batiments: BatEnrBatiment[];
  className?: string;
  initialCenter?: [number, number];
  onSelect: (batiment: BatEnrBatiment) => void;
  selectedBatiment?: BatEnrBatiment | null;
};

export function BatEnrBatimentsMap({ batiments, className, initialCenter, onSelect, selectedBatiment }: BatEnrBatimentsMapProps) {
  const selectableBatiments = useMemo(() => batiments.filter(isSelectableBatEnrBatiment), [batiments]);
  const selectedBatimentConstructionId = selectedBatiment?.batiment_construction_id ?? null;
  const batimentsBounds = useMemo(() => getBatimentsBounds(selectableBatiments), [selectableBatiments]);
  const selectedBatimentBounds = useMemo(
    () => getBatimentsBounds(selectedBatiment && isSelectableBatEnrBatiment(selectedBatiment) ? [selectedBatiment] : []),
    [selectedBatiment]
  );
  const cameraBounds = selectedBatimentBounds ?? batimentsBounds;
  const initialView = useMemo(
    (): InitialView | undefined =>
      cameraBounds ? { bbox: cameraBounds } : initialCenter ? { center: initialCenter, zoom: 18 } : undefined,
    [cameraBounds, initialCenter]
  );

  const handleSelectBatiment = useCallback(
    (batimentConstructionId: string) => {
      const nextBatiment = selectableBatiments.find((batiment) => batiment.batiment_construction_id === batimentConstructionId);

      if (nextBatiment) {
        onSelect(nextBatiment);
      }
    },
    [onSelect, selectableBatiments]
  );

  if (batiments.length === 0) {
    return <Alert small severity="warning" description="Aucun bâtiment n’est recensé à cette adresse." />;
  }

  if (selectableBatiments.length === 0) {
    return <Alert small severity="warning" description="Aucune géométrie de bâtiment n’est disponible pour cette adresse." />;
  }

  return (
    <div className={className}>
      <Map config={{}} initialView={initialView} legend={false} search="none">
        <MapFitBounds bbox={cameraBounds} maxZoom={18} />
        <BatEnrBatimentSelector batiments={selectableBatiments} value={selectedBatimentConstructionId} onSelect={handleSelectBatiment} />
      </Map>
    </div>
  );
}

function getBatimentsBounds(batiments: Parameters<typeof getBatEnrBatimentsFeatureCollection>[0]): BBox | undefined {
  if (batiments.length === 0) {
    return undefined;
  }

  const bounds = getBbox(getBatEnrBatimentsFeatureCollection(batiments));

  return [bounds[0], bounds[1], bounds[2], bounds[3]];
}
