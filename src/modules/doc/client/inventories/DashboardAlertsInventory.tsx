import { Fragment } from 'react';

import Link from '@/components/ui/Link';
import { adminDashboardIndicators, adminDashboardThemeIds, adminDashboardThemeLabels } from '@/modules/admin/constants';
import { diagnosticChecks, issueSeverityLabels } from '@/modules/data-diagnostic/constants';

import { tableClasses } from './table-classes';

/**
 * Table of everything the admin dashboard can show, by theme: the permanent counters, then the data anomalies.
 * Generated from the dashboard registries (`adminDashboardIndicators`, `diagnosticChecks`).
 */
export function DashboardAlertsInventory() {
  return (
    <div className={tableClasses.wrapper}>
      <table className={tableClasses.table}>
        <thead>
          <tr>
            <th className={tableClasses.header}>Alerte</th>
            <th className={tableClasses.header}>Affichage</th>
            <th className={tableClasses.header}>Ce qu'elle signale</th>
          </tr>
        </thead>
        <tbody>
          {adminDashboardThemeIds.map((theme) => (
            <Fragment key={theme}>
              <tr>
                <td colSpan={3} className={tableClasses.groupRow}>
                  {adminDashboardThemeLabels[theme]}
                </td>
              </tr>
              {adminDashboardIndicators
                .filter((indicator) => indicator.theme === theme)
                .map((indicator) => (
                  <tr key={indicator.key}>
                    <td className={tableClasses.cell}>
                      <Link href={indicator.href}>{indicator.label}</Link>
                    </td>
                    <td className={tableClasses.cell}>Compteur permanent</td>
                    <td className={tableClasses.cell}>{indicator.description}</td>
                  </tr>
                ))}
              {diagnosticChecks
                .filter((check) => check.theme === theme)
                .map((check) => (
                  <tr key={check.type}>
                    <td className={tableClasses.cell}>{check.title}</td>
                    <td className={tableClasses.cell}>
                      {issueSeverityLabels[check.severity]}
                      {check.onDemand && ', à la demande'}
                    </td>
                    <td className={tableClasses.cell}>{check.description}</td>
                  </tr>
                ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
