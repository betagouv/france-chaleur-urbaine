import { demandeChaleurRenouvelableProjectStates, demandeChaleurRenouvelableStatuses } from '@/modules/chaleur-renouvelable/constants';

import { tableClasses } from './table-classes';

type FcrStatusValue = (typeof demandeChaleurRenouvelableStatuses)[number]['value'];
type FcrProjectStateValue = (typeof demandeChaleurRenouvelableProjectStates)[number]['value'];

// Authored descriptions; the Record forces a description for any new status added to the list.
const statusDescriptions: Record<FcrStatusValue, string> = {
  abandoned_by_prospect: 'Le prospect a abandonné le projet avant la phase de validation.',
  irrelevant: 'La demande ne donne pas lieu à un accompagnement chaleur renouvelable.',
  opportunity_study_done: "L'étude d'opportunité a été finalisée.",
  opportunity_study_in_progress: "L'étude d'opportunité est en cours.",
  project_validation_feasibility_study_voted:
    "L'étude de faisabilité a été votée en assemblée générale ; l'état du projet devient modifiable.",
  recontacted_first_exchange: 'Le prospect a été recontacté pour un premier échange.',
  redirected_france_renov: "Le prospect est réorienté vers France Rénov'.",
  to_process: "La demande est en attente d'un premier traitement.",
};

const projectStateDescriptions: Record<FcrProjectStateValue, string> = {
  abandoned_by_prospect: 'Le prospect a abandonné le projet après la phase de validation.',
  enr_installation_done: "L'installation d'énergie renouvelable est réalisée.",
  enr_installation_voted: "L'installation d'énergie renouvelable a été votée en assemblée générale.",
  feasibility_study_done: "L'étude de faisabilité réalisée par le bureau d'études est terminée.",
  reflection: "État forcé tant que le statut principal n'est pas le statut de validation du projet.",
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

      <h3>État du projet</h3>
      <div className={tableClasses.wrapper}>
        <table className={tableClasses.table}>
          <thead>
            <tr>
              <th className={tableClasses.header}>État du projet</th>
              <th className={tableClasses.header}>Description</th>
            </tr>
          </thead>
          <tbody>
            {demandeChaleurRenouvelableProjectStates.map((projectState) => (
              <tr key={projectState.value}>
                <td className={tableClasses.cell}>
                  <strong>{projectState.label}</strong>
                </td>
                <td className={tableClasses.cell}>{projectStateDescriptions[projectState.value]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
