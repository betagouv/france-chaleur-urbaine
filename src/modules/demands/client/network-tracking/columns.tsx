import type { ColumnDef } from '@/components/ui/table/TableSimple';
import {
  demandStatusGroupLabels,
  demandStatusGroupOrder,
  demandStatusGroups,
  networkTrackingStateLabels,
  networkTrackingStates,
} from '@/modules/demands/constants';
import { compareFrenchStrings } from '@/utils/strings';

import { DemandStatusGroupsBar } from './DemandStatusGroupsBar';
import { getNetworkName, historyStartLabel, recentWindowLabel } from './format';
import { ManagerActivityCell } from './ManagerActivityCell';
import { NetworkCell } from './NetworkCell';
import { NetworkDemandsCell } from './NetworkDemandsCell';
import { managersTooltip, NetworkTrackingManagersCell } from './NetworkTrackingManagersCell';
import { NetworkTrackingNotesCell } from './NetworkTrackingNotesCell';
import { NetworkTrackingRemindersCell } from './NetworkTrackingRemindersCell';
import { networkTypeLabels } from './NetworkTypeBadges';
import type { NetworkTrackingSummary } from './types';

const statusGroupsTooltip = (
  <span className="flex flex-col gap-1">
    <span>Demandes déposées depuis {recentWindowLabel}.</span>
    {demandStatusGroupOrder.map((group) => (
      <span key={group}>
        <strong>{demandStatusGroupLabels[group]}</strong> : {demandStatusGroups[group].join(', ')}
      </span>
    ))}
  </span>
);

/**
 * Columns of the network tracking table. A visible column gathers several figures; the hidden columns that follow it
 * expose each figure on its own to the sort dialog, the filters and the Excel export.
 * Figures cover the recent demands unless the column says otherwise.
 */
const columns: ColumnDef<NetworkTrackingSummary>[] = [
  {
    accessorFn: (row) => `${getNetworkName(row)} ${row.networkId} ${row.sncuId ?? ''} ${row.organization?.name ?? ''}`,
    cell: ({ row }) => <NetworkCell network={row.original} />,
    exportFn: getNetworkName,
    flex: 3,
    header: 'Réseau',
    id: 'network',
    sortingFn: (rowA, rowB) => compareFrenchStrings(getNetworkName(rowA.original), getNetworkName(rowB.original)),
  },
  {
    accessorFn: (row) => row.networkId,
    enableSorting: false,
    exportOnly: true,
    header: 'Identifiant FCU',
    id: 'networkId',
    visible: false,
  },
  {
    accessorFn: (row) => row.sncuId ?? '',
    enableSorting: false,
    exportOnly: true,
    header: 'Identifiant SNCU',
    id: 'sncuId',
    visible: false,
  },
  {
    accessorFn: (row) => networkTypeLabels[row.networkType],
    enableSorting: false,
    exportOnly: true,
    filterType: 'Facets',
    header: 'Type de réseau',
    id: 'networkType',
    visible: false,
  },
  {
    accessorFn: (row) => row.organization?.name ?? '',
    enableSorting: false,
    exportOnly: true,
    filterType: 'Facets',
    header: 'Organisation',
    id: 'organization',
    visible: false,
  },
  {
    accessorFn: (row) => networkTrackingStateLabels[row.state],
    exportOnly: true,
    filterType: 'Facets',
    header: 'État',
    id: 'state',
    sortingFn: (rowA, rowB) => networkTrackingStates.indexOf(rowA.original.state) - networkTrackingStates.indexOf(rowB.original.state),
    visible: false,
  },
  {
    accessorFn: (row) => row.powerMW ?? undefined,
    exportHeader: 'Puissance (MW)',
    exportOnly: true,
    filterType: 'Range',
    header: 'Puissance',
    id: 'powerMW',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.managers.map((manager) => manager.email).join(' | '),
    cell: ({ row }) => <NetworkTrackingManagersCell network={row.original} />,
    enableSorting: false,
    filterProps: { emptyLabel: 'Sans gestionnaire', filledLabel: 'Avec gestionnaires' },
    filtersDialogLabel: 'Gestionnaires',
    filterType: 'EmptyOrFilled',
    flex: 3,
    header: 'Gestionnaires',
    headerTooltip: managersTooltip,
    id: 'managers',
  },
  {
    accessorFn: (row) => row.managers.length,
    exportOnly: true,
    filterType: 'Range',
    header: 'Nombre de gestionnaires',
    id: 'managersCount',
    visible: false,
  },
  {
    accessorFn: (row) => (row.managers.some((manager) => manager.email_blocked_reason) ? 'Oui' : 'Non'),
    enableSorting: false,
    filtersDialogLabel: 'Gestionnaires aux emails bloqués (Brevo)',
    filterType: 'Facets',
    header: 'Emails bloqués',
    id: 'emailBlocked',
    visible: false,
  },
  {
    accessorFn: (row) => row.recentPending,
    cell: ({ row }) => <NetworkDemandsCell network={row.original} />,
    exportHeader: `Demandes à traiter (${recentWindowLabel})`,
    filterProps: { openEndedBounds: true },
    filtersDialogDescription: 'Déplacez le curseur gauche pour fixer un minimum.',
    filtersDialogLabel: `Demandes à traiter (${recentWindowLabel})`,
    filterType: 'Range',
    header: 'Demandes',
    headerTooltip: `Demandes validées déposées depuis ${recentWindowLabel} : celles « À traiter », avec les dates de la plus ancienne et de la plus récente, puis leur ensemble. En dessous, les demandes plus anciennes, dénombrées à part, avec la date de la première.`,
    id: 'recentPending',
    sortDialogLabel: `Demandes à traiter (${recentWindowLabel})`,
    width: '160px',
  },
  {
    accessorFn: (row) => row.oldestRecentPendingDemandAt ?? undefined,
    cellType: 'Date',
    exportOnly: true,
    filterType: 'Range',
    header: `Plus ancienne demande à traiter (${recentWindowLabel})`,
    id: 'oldestRecentPendingDemandAt',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.newestRecentPendingDemandAt ?? undefined,
    cellType: 'Date',
    exportOnly: true,
    filterType: 'Range',
    header: `Plus récente demande à traiter (${recentWindowLabel})`,
    id: 'newestRecentPendingDemandAt',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.olderTotal,
    exportOnly: true,
    filterType: 'Range',
    header: 'Demandes plus anciennes',
    id: 'olderTotal',
    visible: false,
  },
  {
    accessorFn: (row) => row.olderPending,
    exportOnly: true,
    filterType: 'Range',
    header: 'Demandes plus anciennes à traiter',
    id: 'olderPending',
    visible: false,
  },
  {
    accessorFn: (row) => row.oldestDemandAt ?? undefined,
    cellType: 'Date',
    exportOnly: true,
    filterType: 'Range',
    header: 'Plus ancienne demande',
    id: 'oldestDemandAt',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.newestDemandAt ?? undefined,
    cellType: 'Date',
    exportOnly: true,
    filterType: 'Range',
    header: 'Plus récente demande',
    id: 'newestDemandAt',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.recentTotal,
    cell: ({ row }) =>
      row.original.recentTotal > 0 && (
        <DemandStatusGroupsBar
          pending={row.original.recentPending}
          inProgress={row.original.recentInProgress}
          closed={row.original.recentClosed}
        />
      ),
    exportHeader: `Demandes validées (${recentWindowLabel})`,
    filtersDialogLabel: `Demandes validées (${recentWindowLabel})`,
    filterType: 'Range',
    flex: 2,
    header: 'Demandes par statut',
    headerTooltip: statusGroupsTooltip,
    id: 'recentTotal',
    sortDialogLabel: `Demandes validées (${recentWindowLabel})`,
  },
  {
    accessorFn: (row) => row.recentInProgress,
    exportOnly: true,
    filterType: 'Range',
    header: `Demandes en cours (${recentWindowLabel})`,
    id: 'recentInProgress',
    visible: false,
  },
  {
    accessorFn: (row) => row.recentClosed,
    exportOnly: true,
    filterType: 'Range',
    header: `Demandes closes (${recentWindowLabel})`,
    id: 'recentClosed',
    visible: false,
  },
  {
    accessorFn: (row) => row.lastManagerActionAt ?? undefined,
    cell: ({ row }) => <ManagerActivityCell network={row.original} />,
    cellType: 'Date',
    exportHeader: "Dernière action d'un gestionnaire",
    filtersDialogLabel: "Dernière action d'un gestionnaire",
    filterType: 'Range',
    header: 'Activité des gestionnaires',
    headerTooltip: `Dernière mise à jour ou dernier courriel d'un gestionnaire sur une demande du réseau, quelle que soit son ancienneté (historique depuis ${historyStartLabel}), puis part des demandes déposées depuis ${recentWindowLabel} ayant eu une réponse et délai médian de cette première réponse.`,
    id: 'lastManagerActionAt',
    sortDialogLabel: "Dernière action d'un gestionnaire",
    sortUndefined: 'last',
    width: '190px',
  },
  {
    accessorFn: (row) => row.recentReceived,
    exportOnly: true,
    filterType: 'Range',
    header: `Demandes reçues (${recentWindowLabel})`,
    id: 'recentReceived',
    visible: false,
  },
  {
    accessorFn: (row) => row.recentResponded,
    exportOnly: true,
    header: `Demandes avec réponse (${recentWindowLabel})`,
    id: 'recentResponded',
    visible: false,
  },
  {
    accessorFn: (row) => (row.recentReceived > 0 ? Math.round((100 * row.recentResponded) / row.recentReceived) : undefined),
    exportOnly: true,
    filterType: 'Range',
    header: `Taux de réponse (${recentWindowLabel}, %)`,
    id: 'responseRate',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.medianResponseDays ?? undefined,
    exportOnly: true,
    filterType: 'Range',
    header: `Délai médian de réponse (${recentWindowLabel}, jours)`,
    id: 'medianResponseDays',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.reminders[0]?.created_at,
    cell: ({ row }) => <NetworkTrackingRemindersCell network={row.original} />,
    cellType: 'Date',
    exportHeader: 'Dernière relance',
    filtersDialogLabel: 'Dernière relance',
    filterType: 'Range',
    flex: 2,
    header: 'Relances',
    id: 'lastReminderAt',
    sortDialogLabel: 'Dernière relance',
    sortUndefined: 'last',
  },
  {
    accessorFn: (row) => row.reminders.length,
    exportOnly: true,
    filterType: 'Range',
    header: 'Nombre de relances',
    id: 'remindersCount',
    visible: false,
  },
  {
    accessorFn: (row) => row.notes ?? '',
    cell: ({ row }) => <NetworkTrackingNotesCell network={row.original} />,
    enableSorting: false,
    flex: 2,
    header: 'Notes',
    id: 'notes',
  },
];

/** The global search only looks at what identifies a network and its contacts: figures and dates would match by accident. */
const searchableColumnIds = ['network', 'networkId', 'sncuId', 'users', 'notes'];

export const networkTrackingColumns = columns.map((column) =>
  searchableColumnIds.includes(column.id ?? '') ? column : { ...column, enableGlobalFilter: false }
);
