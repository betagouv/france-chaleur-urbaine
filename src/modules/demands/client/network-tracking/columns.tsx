import type { ColumnDef } from '@/components/ui/table/TableSimple';
import { businessRules } from '@/modules/app/business-rules';
import {
  demandStatusGroupLabels,
  demandStatusGroupOrder,
  demandStatusGroups,
  networkTrackingStateLabels,
  networkTrackingStates,
} from '@/modules/demands/constants';
import { compareFrenchStrings } from '@/utils/strings';

import { DemandStatusGroupsBar } from './DemandStatusGroupsBar';
import { getNetworkName, historyStartLabel } from './format';
import { ManagerActivityCell } from './ManagerActivityCell';
import { NetworkCell } from './NetworkCell';
import { NetworkDemandsCell } from './NetworkDemandsCell';
import { NetworkTrackingNotesCell } from './NetworkTrackingNotesCell';
import { NetworkTrackingRemindersCell } from './NetworkTrackingRemindersCell';
import { NetworkTrackingUsersCell } from './NetworkTrackingUsersCell';
import { networkTypeLabels } from './NetworkTypeBadges';
import type { NetworkTrackingSummary } from './types';

const responseWindow = businessRules.networkTrackingResponseWindowMonths.display;

const statusGroupsTooltip = (
  <span className="flex flex-col gap-1">
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
 */
export const networkTrackingColumns: ColumnDef<NetworkTrackingSummary>[] = [
  {
    accessorFn: (row) => `${getNetworkName(row)} ${row.networkId} ${row.sncuId ?? ''}`,
    cell: ({ row }) => <NetworkCell network={row.original} />,
    exportFn: getNetworkName,
    flex: 3,
    header: 'Réseau',
    id: 'network',
    sortingFn: (rowA, rowB) => compareFrenchStrings(getNetworkName(rowA.original), getNetworkName(rowB.original)),
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
    header: 'Puissance',
    id: 'powerMW',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.pending,
    cell: ({ row }) => <NetworkDemandsCell network={row.original} />,
    exportHeader: 'Demandes à traiter',
    filtersDialogDescription: 'Déplacez le curseur gauche pour fixer un minimum.',
    filtersDialogLabel: 'Demandes à traiter',
    filterType: 'Range',
    header: 'Demandes',
    headerTooltip:
      'Demandes « À traiter » puis ensemble des demandes validées du réseau, avec les dates de la plus ancienne et de la plus récente.',
    id: 'pending',
    sortDialogLabel: 'Demandes à traiter',
    width: '240px',
  },
  {
    accessorFn: (row) => row.oldestPendingDemandAt ?? undefined,
    cellType: 'Date',
    exportOnly: true,
    header: 'Plus ancienne demande à traiter',
    id: 'oldestPendingDemandAt',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.newestPendingDemandAt ?? undefined,
    cellType: 'Date',
    exportOnly: true,
    header: 'Plus récente demande à traiter',
    id: 'newestPendingDemandAt',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.oldestDemandAt ?? undefined,
    cellType: 'Date',
    exportOnly: true,
    header: 'Plus ancienne demande',
    id: 'oldestDemandAt',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.newestDemandAt ?? undefined,
    cellType: 'Date',
    exportOnly: true,
    header: 'Plus récente demande',
    id: 'newestDemandAt',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.total,
    cell: ({ row }) =>
      row.original.total > 0 && (
        <DemandStatusGroupsBar pending={row.original.pending} inProgress={row.original.inProgress} closed={row.original.closed} />
      ),
    exportHeader: 'Demandes validées',
    flex: 2,
    header: 'Demandes par statut',
    headerTooltip: statusGroupsTooltip,
    id: 'total',
    sortDialogLabel: 'Demandes validées',
  },
  { accessorFn: (row) => row.inProgress, exportOnly: true, header: 'Demandes en cours', id: 'inProgress', visible: false },
  { accessorFn: (row) => row.closed, exportOnly: true, header: 'Demandes closes', id: 'closed', visible: false },
  {
    accessorFn: (row) => row.lastManagerActionAt ?? undefined,
    cell: ({ row }) => <ManagerActivityCell network={row.original} />,
    cellType: 'Date',
    exportHeader: "Dernière action d'un gestionnaire",
    header: 'Gestionnaires',
    headerTooltip: `Dernière mise à jour ou dernier courriel d'un gestionnaire sur une demande du réseau (historique depuis ${historyStartLabel}), puis part des demandes reçues depuis ${responseWindow} ayant eu une réponse et délai médian de cette première réponse.`,
    id: 'lastManagerActionAt',
    sortDialogLabel: "Dernière action d'un gestionnaire",
    sortUndefined: 'last',
    width: '190px',
  },
  {
    accessorFn: (row) => row.recentReceived,
    exportOnly: true,
    header: `Demandes reçues (${responseWindow})`,
    id: 'recentReceived',
    visible: false,
  },
  {
    accessorFn: (row) => row.recentResponded,
    exportOnly: true,
    header: `Demandes avec réponse (${responseWindow})`,
    id: 'recentResponded',
    visible: false,
  },
  {
    accessorFn: (row) => (row.recentReceived > 0 ? Math.round((100 * row.recentResponded) / row.recentReceived) : undefined),
    exportOnly: true,
    header: `Taux de réponse (${responseWindow}, %)`,
    id: 'responseRate',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.medianResponseDays ?? undefined,
    exportOnly: true,
    header: `Délai médian de réponse (${responseWindow}, jours)`,
    id: 'medianResponseDays',
    sortUndefined: 'last',
    visible: false,
  },
  {
    accessorFn: (row) => row.users.map((user) => user.email).join(' | '),
    cell: ({ row }) => <NetworkTrackingUsersCell network={row.original} />,
    enableSorting: false,
    flex: 3,
    header: 'Utilisateurs',
    id: 'users',
  },
  { accessorFn: (row) => row.users.length, exportOnly: true, header: "Nombre d'utilisateurs", id: 'usersCount', visible: false },
  {
    accessorFn: (row) => (row.users.length > 0 ? 'Oui' : 'Non'),
    enableSorting: false,
    filterType: 'Facets',
    header: 'Utilisateurs assignés',
    id: 'hasUsers',
    visible: false,
  },
  {
    accessorFn: (row) => (row.users.some((user) => user.email_blocked_reason) ? 'Oui' : 'Non'),
    enableSorting: false,
    filtersDialogLabel: 'Utilisateurs aux emails bloqués (Brevo)',
    filterType: 'Facets',
    header: 'Emails bloqués',
    id: 'emailBlocked',
    visible: false,
  },
  {
    accessorFn: (row) => row.reminders[0]?.created_at,
    cell: ({ row }) => <NetworkTrackingRemindersCell network={row.original} />,
    cellType: 'Date',
    exportHeader: 'Dernière relance',
    flex: 2,
    header: 'Relances',
    id: 'lastReminderAt',
    sortDialogLabel: 'Dernière relance',
    sortUndefined: 'last',
  },
  { accessorFn: (row) => row.reminders.length, exportOnly: true, header: 'Nombre de relances', id: 'remindersCount', visible: false },
  {
    accessorFn: (row) => row.notes ?? '',
    cell: ({ row }) => <NetworkTrackingNotesCell network={row.original} />,
    enableSorting: false,
    flex: 2,
    header: 'Notes',
    id: 'notes',
  },
];
