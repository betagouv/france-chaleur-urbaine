import type { ReactNode } from 'react';

import trpc from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';

import type { CcrtDemand } from '../types';
import { CcrtDetailsSection } from './CcrtDetailsSection';
import { formatCcrtAddress } from './ccrt-workspace';

type CcrtBuildingIdentificationProps = { demand: CcrtDemand; onMap?: () => void; children?: ReactNode };

/**
 * Fixed building address and map link, followed by editable co-ownership fields.
 */
export function CcrtBuildingIdentification({ demand, onMap, children }: CcrtBuildingIdentificationProps) {
  const eligibility = trpc.batEnr.ccrt.getHeatNetworkEligibility.useQuery({ demandId: demand.id });
  const coordinates = eligibility.data?.coordinates;
  return (
    <CcrtDetailsSection
      title="Identification du bâtiment"
      description={`Demande reçue le ${dayjs(demand.created_at).format('D MMM YYYY')}`}
    >
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1">
        <p className="mb-0 min-w-0 break-words text-sm leading-6 text-(--text-default-grey)">Adresse du bâtiment :</p>
        {coordinates && (
          <a
            className="shrink-0 whitespace-nowrap text-right fr-link fr-link--sm fr-link--icon-right fr-icon-external-link-line"
            href={`/carte?coord=${coordinates.lon},${coordinates.lat}&zoom=17${demand.batiment_construction_id ? `&construction_id=${encodeURIComponent(demand.batiment_construction_id)}` : ''}`}
            onClick={onMap}
            rel="noopener noreferrer"
            target="_blank"
          >
            Afficher dans la carte
          </a>
        )}
        <p className="col-span-2 mb-0 break-words text-base font-medium leading-6">{formatCcrtAddress(demand.address)}</p>
      </div>
      {children}
    </CcrtDetailsSection>
  );
}
