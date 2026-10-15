import type { ComponentProps } from 'react';

import { CcrtDemandMobileCard } from './CcrtDemandMobileCard';
import { CcrtDemandMobileDetails } from './CcrtDemandMobileDetails';
import type { CcrtDemandsTable } from './CcrtDemandsTable';

type CcrtDemandsMobileProps = Omit<ComponentProps<typeof CcrtDemandsTable>, 'order' | 'onSort'> & { onClose: () => void };

/**
 * Switches the mobile list to a single demand sheet using the existing URL selection.
 */
export function CcrtDemandsMobile({
  demands,
  expandedDemandId,
  isLoading,
  hasDemands,
  actions,
  onToggle,
  onClose,
  onValidate,
}: CcrtDemandsMobileProps) {
  const selectedDemand = demands.find((demand) => demand.id === expandedDemandId);
  return selectedDemand ? (
    <CcrtDemandMobileDetails demand={selectedDemand} actions={actions} onClose={onClose} onValidate={onValidate} />
  ) : demands.length > 0 ? (
    <div className="space-y-4">
      {demands.map((demand) => (
        <CcrtDemandMobileCard
          key={demand.id}
          demand={demand}
          onOpen={() => onToggle(demand)}
          onContact={() => actions.openEmail(demand)}
          onValidate={onValidate}
        />
      ))}
    </div>
  ) : (
    <p role="status" className="bg-(--background-default-grey) p-6 text-center">
      {isLoading
        ? 'Chargement des demandes…'
        : hasDemands
          ? 'Aucune demande ne correspond aux filtres sélectionnés.'
          : 'Aucune demande d’accompagnement à afficher.'}
    </p>
  );
}
