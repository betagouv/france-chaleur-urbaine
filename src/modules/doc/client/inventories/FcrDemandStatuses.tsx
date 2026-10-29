import { demandeChaleurRenouvelableStatuses } from '@/modules/chaleur-renouvelable/constants';

import { tableClasses } from './table-classes';

type FcrStatusValue = (typeof demandeChaleurRenouvelableStatuses)[number]['value'];

// Authored descriptions; the Record forces a description for any new status added to the list.
const statusDescriptions: Record<FcrStatusValue, string> = {
  abandoned_by_prospect: 'Le prospect a abandonné le projet avant la phase de validation.',
  installation_done: 'L’installation est réalisée ; la demande figure dans l’onglet Réalisées.',
  irrelevant: 'La demande ne donne pas lieu à un accompagnement chaleur renouvelable.',
  opportunity_study_done: "L'étude d'opportunité a été finalisée.",
  opportunity_study_in_progress: "L'étude d'opportunité est en cours.",
  phone_contact_realised: '1er contact téléphonique réalisé.',
  project_validation_feasibility_study_voted: "L'étude de faisabilité a été votée en assemblée générale.",
  recontacted_first_exchange: 'Le prospect a été recontacté pour un premier échange.',
  redirected_france_renov: "Le prospect est réorienté vers France Rénov'.",
  to_process: "La demande est en attente d'un premier traitement.",
};

/**
 * Table of the chaleur renouvelable demand statuses, generated from the
 * demandeChaleurRenouvelableStatuses list in its display order.
 */
export function FcrDemandStatuses() {
  return (
    <>
      <h3>Statut</h3>
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
    </>
  );
}
