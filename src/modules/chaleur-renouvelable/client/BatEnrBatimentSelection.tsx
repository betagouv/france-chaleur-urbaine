import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/constants';

import { BatEnrBatimentsMap } from './BatEnrBatimentsMap';

export function BatEnrBatimentSelection({
  batiments,
  initialCenter,
  onSelect,
  selectedBatiment,
}: {
  batiments: BatEnrBatiment[];
  initialCenter?: [number, number];
  onSelect: (batiment: BatEnrBatiment) => void;
  selectedBatiment?: BatEnrBatiment | null;
}) {
  return (
    <div>
      <p className="my-3 font-bold text-xl">Veuillez confirmer le bâtiment qui vous intéresse en le sélectionnant sur la carte</p>
      <BatEnrBatimentsMap
        batiments={batiments}
        className="h-[60vh] min-h-96 w-full overflow-hidden"
        initialCenter={initialCenter}
        onSelect={onSelect}
        selectedBatiment={selectedBatiment}
      />
    </div>
  );
}
