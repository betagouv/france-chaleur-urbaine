import { Fragment } from 'react';

import Link from '@/components/ui/Link';
import { emailTriggerTypeBadgeClasses, emailTriggerTypeLabels } from '@/modules/email/constants';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

import { tableClasses } from './table-classes';

const moduleLabels: Record<string, string> = {
  auth: 'Comptes',
  demands: 'Demandes',
};

const recipientLabels: Record<string, string> = {
  demandeur: 'Le demandeur',
  gestionnaire: 'Le gestionnaire',
  utilisateur: "L'utilisateur",
};

/**
 * Table of all transactional emails with their exact trigger, fetched from the
 * email registry (email.config.tsx). Each email links to its admin preview.
 */
export function EmailsInventory() {
  const { data: emails, isLoading, isError } = trpc.email.list.useQuery();

  if (isError) {
    return <p className="text-sm text-(--text-default-error)">Impossible de charger la liste des emails.</p>;
  }

  if (isLoading || !emails) {
    return <p className="text-sm text-faded">Chargement…</p>;
  }

  const moduleNames = [...new Set(emails.map((email) => email.type.split('.')[0]))];

  return (
    <div className={tableClasses.wrapper}>
      <table className={tableClasses.table}>
        <thead>
          <tr>
            <th className={tableClasses.header}>Email</th>
            <th className={tableClasses.header}>Destinataire</th>
            <th className={tableClasses.header}>Déclencheur</th>
          </tr>
        </thead>
        <tbody>
          {moduleNames.map((moduleName) => (
            <Fragment key={moduleName}>
              <tr>
                <td colSpan={3} className={tableClasses.groupRow}>
                  {moduleLabels[moduleName] ?? moduleName}
                </td>
              </tr>
              {emails
                .filter((email) => email.type.split('.')[0] === moduleName)
                .map((email) => {
                  const recipientKey = email.type.split('.')[1];
                  return (
                    <tr key={email.type}>
                      <td className={tableClasses.cell}>
                        <Link href={`/admin/emails?type=${email.type}`}>{email.label}</Link>
                      </td>
                      <td className={tableClasses.cell}>{recipientLabels[recipientKey] ?? recipientKey}</td>
                      <td className={tableClasses.cell}>
                        <span className={cx('fr-badge fr-badge--sm mr-2', emailTriggerTypeBadgeClasses[email.trigger.type])}>
                          {emailTriggerTypeLabels[email.trigger.type]}
                        </span>
                        {email.trigger.description}
                      </td>
                    </tr>
                  );
                })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
