import { demandeChaleurRenouvelableStatuses } from '@/modules/chaleur-renouvelable/constants';

import { tableClasses } from './table-classes';

type FcrStatusValue = (typeof demandeChaleurRenouvelableStatuses)[number]['value'];

// Authored descriptions; the Record forces a description for any new status added to the list.
const statusDescriptions: Record<FcrStatusValue, string> = {
  abandoned: 'La demande ne donne pas lieu à un accompagnement.',
  alec: "L'accompagnement par l'ALEC est en cours.",
  alec_reorientation: "Le prospect est réorienté vers un projet d'isolation ou de rénovation globale.",
  be: "L'appel d'offres pour le bureau d'études a été réalisé.",
  done: 'Les travaux sont réalisés.',
  finance: "L'étude technico-financière a été réalisée.",
  voted: 'Les travaux ont été votés en assemblée générale.',
  waiting_alec: "Statut initial des demandes de maisons individuelles et d'immeubles en chauffage individuel, à orienter vers l'ALEC.",
  waiting_ccr: "Statut initial des demandes d'immeubles en chauffage collectif.",
  waiting_diagnostic: 'Le demandeur a été recontacté pour réaliser un diagnostic.',
  waiting_prospect: "En attente d'éléments de la part du demandeur.",
};

/**
 * Table of the chaleur renouvelable demand statuses, generated from the
 * demandeChaleurRenouvelableStatuses list in its display order.
 */
export function FcrDemandStatuses() {
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
          {demandeChaleurRenouvelableStatuses.map((status) => (
            <tr key={status.value}>
              <td className={tableClasses.cell}>
                <strong>{status.label}</strong>
              </td>
              <td className={tableClasses.cell}>{statusDescriptions[status.value]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
