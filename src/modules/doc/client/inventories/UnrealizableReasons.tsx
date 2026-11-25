import { selectableUnrealizableReasons, UNREALIZABLE_REASON_INVALID_DEMAND } from '@/modules/demands/constants';

import { tableClasses } from './table-classes';

/**
 * Table of the reasons offered when a demand is closed as « Non réalisable »,
 * generated from the list shown in the reason dialog.
 */
export function UnrealizableReasons() {
  return (
    <div className={tableClasses.wrapper}>
      <table className={tableClasses.table}>
        <thead>
          <tr>
            <th className={tableClasses.header}>Motif</th>
            <th className={tableClasses.header}>Aide affichée pour la précision</th>
            <th className={tableClasses.header}>Email au demandeur</th>
          </tr>
        </thead>
        <tbody>
          {selectableUnrealizableReasons.map((reason) => (
            <tr key={reason.key}>
              <td className={tableClasses.cell}>
                <strong>{reason.label}</strong>
              </td>
              <td className={tableClasses.cell}>{reason.detailHint}</td>
              <td className={tableClasses.cell}>{reason.key === UNREALIZABLE_REASON_INVALID_DEMAND ? 'Non' : 'Oui'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
