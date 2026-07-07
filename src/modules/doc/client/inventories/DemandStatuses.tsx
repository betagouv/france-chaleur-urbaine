import { demandStatuses } from '@/modules/demands/constants';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import { tableClasses } from './table-classes';

// Authored descriptions; the Record forces a description for any new status added to the enum.
const statusDescriptions: Record<DEMANDE_STATUS, string> = {
  [DEMANDE_STATUS.TO_PROCESS]: "Statut initial d'une demande éligible ; en attente de prise en charge par le gestionnaire.",
  [DEMANDE_STATUS.UNREALISABLE]:
    "Statut initial d'une demande non éligible (trop éloignée d'un réseau), ou jugée non réalisable par le gestionnaire.",
  [DEMANDE_STATUS.RECONTACTED]: 'Le gestionnaire a recontacté le demandeur et étudie la faisabilité du raccordement.',
  [DEMANDE_STATUS.COMMERCIAL_PROPOSAL]: 'Une proposition commerciale a été envoyée au demandeur.',
  [DEMANDE_STATUS.VOTED]: 'Le raccordement a été voté en assemblée générale de copropriété.',
  [DEMANDE_STATUS.WORK_IN_PROGRESS]: 'Les travaux de raccordement sont en cours.',
  [DEMANDE_STATUS.DONE]: 'Le raccordement est réalisé.',
  [DEMANDE_STATUS.ABANDONNED]: 'Le prospect a abandonné le projet de raccordement.',
};

/**
 * Table of the demand statuses, generated from the DEMANDE_STATUS enum
 * in their display order.
 */
export function DemandStatuses() {
  return (
    <div className={tableClasses.wrapper}>
      <table className={tableClasses.table}>
        <thead>
          <tr>
            <th className={tableClasses.header}>Statut</th>
            <th className={tableClasses.header}>Description</th>
          </tr>
        </thead>
        <tbody>
          {demandStatuses.map((status) => (
            <tr key={status.label}>
              <td className={tableClasses.cell}>
                <strong>{status.label}</strong>
              </td>
              <td className={tableClasses.cell}>{statusDescriptions[status.label]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
