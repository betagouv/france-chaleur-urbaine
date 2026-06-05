import { Alert } from '@codegouvfr/react-dsfr/Alert';
import dynamic from 'next/dynamic';
import { useCallback } from 'react';

import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/constants';
import { Map } from '@/modules/map/client/Map';

const BdnbBatimentSelector = dynamic(
  () => import('@/modules/map/client/interactions/BdnbBatimentSelector').then((mod) => mod.BdnbBatimentSelector),
  { ssr: false }
);

type BatEnrBatimentsMapProps = {
  batiments: BatEnrBatiment[];
  className?: string;
  initialCenter?: [number, number];
  onSelect: (batiment: BatEnrBatiment) => void;
};

export function BatEnrBatimentsMap({ batiments, className, initialCenter, onSelect }: BatEnrBatimentsMapProps) {
  const handleSelectBatiment = useCallback(
    (batimentGroupeId: string) => {
      const selectedBatiment = batiments.find((batiment) => batiment.batiment_groupe_id === batimentGroupeId);

      if (selectedBatiment) {
        onSelect(selectedBatiment);
      }
    },
    [batiments, onSelect]
  );

  return batiments.length > 0 ? (
    <div className={className}>
      <Map config={{}} initialView={initialCenter ? { center: initialCenter, zoom: 18 } : undefined} legend={false} search="none">
        <BdnbBatimentSelector value={null} onSelect={handleSelectBatiment} />
      </Map>
    </div>
  ) : (
    <Alert small severity="warning" description="Aucun bâtiment n’est recensé à cette adresse." />
  );
}
