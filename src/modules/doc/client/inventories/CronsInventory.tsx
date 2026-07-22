import { cronDefinitions } from '@/modules/jobs/cron.config';

import { tableClasses } from './table-classes';

/**
 * Table of the scheduled cron jobs, generated from the cron registry (cron.config.ts).
 */
export function CronsInventory() {
  return (
    <div className={tableClasses.wrapper}>
      <table className={tableClasses.table}>
        <thead>
          <tr>
            <th className={tableClasses.header}>Tâche</th>
            <th className={tableClasses.header}>Quand</th>
            <th className={tableClasses.header}>Description</th>
          </tr>
        </thead>
        <tbody>
          {cronDefinitions.map((cron) => (
            <tr key={cron.name}>
              <td className={tableClasses.cell}>
                <code className="text-xs">{cron.name}</code>
              </td>
              <td className={tableClasses.cell}>{cron.scheduleLabel}</td>
              <td className={tableClasses.cell}>{cron.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
