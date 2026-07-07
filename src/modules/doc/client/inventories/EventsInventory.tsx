import { Fragment } from 'react';

import Link from '@/components/ui/Link';
import { eventTypeLabels, eventTypes } from '@/modules/events/constants';

import { catchAllEventGroupLabel, specificEventGroups } from './event-groups';
import { tableClasses } from './table-classes';

// Specific groups first, then the catch-all: each event belongs to the first group that matches it.
const eventGroups = [...specificEventGroups, { label: catchAllEventGroupLabel, match: () => true }];

/**
 * Catalog of all audit event types, generated from the events registry and
 * grouped by domain. Each event links to the site activity filtered on it.
 */
export function EventsInventory() {
  const groupsWithTypes = eventGroups
    .map((group, groupIndex) => ({
      label: group.label,
      types: eventTypes.filter((type) => eventGroups.findIndex((candidate) => candidate.match(type)) === groupIndex),
    }))
    .filter((group) => group.types.length > 0);

  return (
    <div className={tableClasses.wrapper}>
      <table className={tableClasses.table}>
        <thead>
          <tr>
            <th className={tableClasses.header}>Événement</th>
            <th className={tableClasses.header}>Clé technique</th>
          </tr>
        </thead>
        <tbody>
          {groupsWithTypes.map((group) => (
            <Fragment key={group.label}>
              <tr>
                <td colSpan={2} className={tableClasses.groupRow}>
                  {group.label}
                </td>
              </tr>
              {group.types.map((type) => (
                <tr key={type}>
                  <td className={tableClasses.cell}>
                    <Link href={`/admin/events?types=${type}`}>{eventTypeLabels[type]}</Link>
                  </td>
                  <td className={tableClasses.cell}>
                    <code className="text-xs">{type}</code>
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
