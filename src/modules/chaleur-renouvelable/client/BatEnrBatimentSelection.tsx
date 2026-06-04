import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/constants';

import { BatEnrBatimentsMap } from './BatEnrBatimentsMap';

export function BatEnrBatimentSelection({
  batiments,
  initialCenter,
  onSelect,
}: {
  batiments: BatEnrBatiment[];
  initialCenter?: [number, number];
  onSelect: (batiment: BatEnrBatiment) => void;
}) {
  return (
    <div>
      <p className="my-3 font-bold text-xl">Plusieurs bâtiments sont recensés à cette adresse, veuillez choisir le bâtiment concerné</p>
      <BatEnrBatimentsMap
        batiments={batiments}
        className="h-[60vh] min-h-96 w-full overflow-hidden"
        initialCenter={initialCenter}
        onSelect={onSelect}
      />
    </div>
  );
}
