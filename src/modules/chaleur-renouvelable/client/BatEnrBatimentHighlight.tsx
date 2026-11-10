import { bbox as getBbox } from '@turf/bbox';

import { MapFitBounds } from '@/modules/map/client/interactions/MapFitBounds';
import trpc from '@/modules/trpc/client';

import { BatEnrBatimentSelector, isSelectableBatEnrBatiment } from './BatEnrBatimentSelector';

type BatEnrBatimentHighlightProps = { constructionId: string };

/**
 * Frames and highlights a saved building without taking over national-map clicks.
 */
export function BatEnrBatimentHighlight({ constructionId }: BatEnrBatimentHighlightProps) {
  const { data: batiment } = trpc.batEnr.getBatEnrBatimentDetails.useQuery({ batiment_construction_id: constructionId });

  if (!batiment || !isSelectableBatEnrBatiment(batiment)) {
    return null;
  }

  const bounds = getBbox(batiment.geometry);

  return (
    <>
      <MapFitBounds bbox={[bounds[0], bounds[1], bounds[2], bounds[3]]} maxZoom={18} />
      <BatEnrBatimentSelector batiments={[batiment]} value={batiment.batiment_construction_id} />
    </>
  );
}
