import Button from '@/components/ui/Button';
import trpc from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';

import type { CcrtDemand } from '../types';
import { CcrtDetailsSection } from './CcrtDetailsSection';

const identificationFields = [
  { label: 'Adresse du bâtiment', name: 'address' },
  { label: 'Syndicat de copropriété', name: 'rnic_nom_copropriete' },
  { label: 'SIRET (source : RNIC)', name: 'rnic_siret_representant_legal' },
  { label: 'Immatriculation de copropriété (source : RNIC)', name: 'rnic_numero_immatriculation' },
] as const;

type CcrtBuildingIdentificationProps = { demand: CcrtDemand; onMap?: () => void };

/**
 * Read-only building identity and a map link at the saved building coordinates.
 */
export function CcrtBuildingIdentification({ demand, onMap }: CcrtBuildingIdentificationProps) {
  const eligibility = trpc.batEnr.ccrt.getHeatNetworkEligibility.useQuery({ demandId: demand.id });
  const coordinates = eligibility.data?.coordinates;
  return (
    <CcrtDetailsSection
      title="Identification du bâtiment"
      description={`Demande n° ${demand.id}, reçue le ${dayjs(demand.created_at).format('D MMM YYYY')}`}
    >
      {identificationFields.map((definition) => (
        <p key={definition.name} className="mb-0 break-words text-sm leading-6 text-(--text-default-grey)">
          {definition.label} : <span className="text-base font-medium">{demand[definition.name] || 'Non renseigné'}</span>
        </p>
      ))}
      {coordinates && (
        <Button
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-external-link-line"
          iconPosition="right"
          className="mt-2"
          linkProps={{
            href: `/carte?coord=${coordinates.lon},${coordinates.lat}&zoom=17&address=${encodeURIComponent(demand.address)}`,
            onClick: onMap,
            rel: 'noopener noreferrer',
            target: '_blank',
          }}
        >
          Afficher dans la carte
        </Button>
      )}
    </CcrtDetailsSection>
  );
}
