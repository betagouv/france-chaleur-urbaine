import type { ColumnFiltersState } from '@tanstack/react-table';
import { parseAsJson, useQueryState } from 'nuqs';
import { useState } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import CallOut from '@/components/ui/CallOut';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import { businessRules } from '@/modules/app/business-rules';
import { buildAdminDemandsUrl, buildDemandFilters } from '@/modules/demands/client/admin-demands-url';
import { networkTrackingStateLabels, networkTrackingStates } from '@/modules/demands/constants';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';
import { compareFrenchStrings } from '@/utils/strings';

import { DemandStatusGroupsBar } from './DemandStatusGroupsBar';
import { buildNetworkTrackingUrl, formatDurationDays, formatElapsedSince, formatResponseRate, historyStartLabel } from './format';
import { LastManagerAction } from './LastManagerAction';
import { NetworkTrackingStateBadge } from './NetworkTrackingStateBadge';
import type { NetworkTrackingSummary } from './types';

const responseWindow = businessRules.networkTrackingResponseWindowMonths.display;

const networkTypeLabels = {
  reseau_de_chaleur: 'Existant',
  reseau_en_construction: 'En construction',
} as const satisfies Record<NetworkTrackingSummary['networkType'], string>;

const getNetworkName = (network: NetworkTrackingSummary) => network.name ?? `Réseau ${network.networkId}`;

const quickFilterPresets = {
  all: {
    filters: [],
    getStat: (networks) => networks.length,
    label: 'réseaux suivis',
  },
  late: {
    filters: [{ id: 'state', value: { [networkTrackingStateLabels.late]: true } }],
    getStat: (networks) => networks.filter((network) => network.state === 'late').length,
    label: 'en retard',
  },
  silent: {
    filters: [{ id: 'state', value: { [networkTrackingStateLabels.silent]: true } }],
    getStat: (networks) => networks.filter((network) => network.state === 'silent').length,
    label: 'muets',
  },
} satisfies Record<string, QuickFilterPreset<NetworkTrackingSummary>>;

const columns: ColumnDef<NetworkTrackingSummary>[] = [
  {
    accessorFn: (row) => networkTrackingStateLabels[row.state],
    cell: ({ row }) => <NetworkTrackingStateBadge state={row.original.state} />,
    filterType: 'Facets',
    header: 'État',
    id: 'state',
    sortingFn: (rowA, rowB) => networkTrackingStates.indexOf(rowA.original.state) - networkTrackingStates.indexOf(rowB.original.state),
    width: '120px',
  },
  {
    accessorFn: (row) => `${getNetworkName(row)} ${row.networkId} ${row.sncuId ?? ''} ${row.gestionnaire ?? ''}`,
    cell: ({ row }) => <NetworkCell network={row.original} />,
    flex: 2,
    header: 'Réseau',
    id: 'network',
    sortingFn: (rowA, rowB) => compareFrenchStrings(getNetworkName(rowA.original), getNetworkName(rowB.original)),
  },
  {
    accessorFn: (row) => row.pending,
    cell: ({ row }) => <PendingCell network={row.original} />,
    header: 'En attente',
    headerTooltip: 'Demandes « À traiter » du réseau, et depuis combien de temps la plus ancienne attend une réponse.',
    id: 'pending',
    width: '170px',
  },
  {
    accessorFn: (row) => row.lastManagerActionAt ?? '',
    cell: ({ row }) => <LastManagerAction date={row.original.lastManagerActionAt} />,
    header: 'Dernière action',
    headerTooltip: `Dernière mise à jour ou dernier courriel d'un gestionnaire sur une demande du réseau. L'historique commence en ${historyStartLabel}.`,
    id: 'lastManagerActionAt',
    width: '170px',
  },
  {
    accessorFn: (row) => (row.recentReceived > 0 ? row.recentResponded / row.recentReceived : undefined),
    cell: ({ row }) => <ResponseCell network={row.original} />,
    header: `Réponse sur ${responseWindow}`,
    headerTooltip: `Part des demandes reçues depuis ${responseWindow} sur lesquelles un gestionnaire a agi, et délai médian entre la réception et cette première action.`,
    id: 'response',
    sortUndefined: 'last',
    width: '180px',
  },
  {
    accessorFn: (row) => row.total,
    cell: ({ row }) => (
      <DemandStatusGroupsBar pending={row.original.pending} inProgress={row.original.inProgress} closed={row.original.closed} />
    ),
    flex: 1,
    header: 'Demandes par statut',
    id: 'total',
  },
  {
    accessorFn: (row) => networkTypeLabels[row.networkType],
    filterType: 'Facets',
    header: 'Type de réseau',
    id: 'networkType',
    visible: false,
  },
];

/**
 * Admin screen listing the networks with validated demands, sorted to surface the ones whose managers no longer answer.
 */
export default function NetworkTrackingPage() {
  // deep links carry the filters in the URL: start from them so the matching preset shows as active
  const [urlColumnFilters] = useQueryState(
    'suivi_reseaux_filters',
    parseAsJson<ColumnFiltersState>((value) => value as ColumnFiltersState)
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(urlColumnFilters ?? []);
  const { data: networks = [], isLoading } = trpc.demands.admin.listNetworkTracking.useQuery();

  return (
    <SimplePage title="Suivi des réseaux" mode="authenticated" layout="wide">
      <Heading as="h1" color="blue-france">
        Suivi des réseaux
      </Heading>

      <CallOut size="sm">
        <p>
          Cet écran repère les réseaux dont les gestionnaires ne répondent plus aux demandes validées. L'activité des gestionnaires est
          connue depuis {historyStartLabel} : un réseau sans action depuis cette date est signalé comme tel. Les comptes ayant accès à un
          réseau et les relances se gèrent dans les <Link href="/admin/reseaux/stats">statistiques par réseau</Link>.
        </p>
      </CallOut>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <QuickFilterPresets
          presets={quickFilterPresets}
          data={networks}
          loading={isLoading}
          columnFilters={columnFilters}
          onFiltersChange={setColumnFilters}
        />
      </div>

      <TableSimple
        columns={columns}
        data={networks}
        loading={isLoading}
        initialSortingState={[
          { desc: false, id: 'state' },
          { desc: true, id: 'pending' },
        ]}
        columnFilters={columnFilters}
        controlsLayout="block"
        padding="sm"
        loadingEmptyMessage="Aucun réseau n'a de demande validée"
        urlSyncKey="suivi_reseaux"
        enableGlobalFilter
        enableFiltersDialog
      />
    </SimplePage>
  );
}

type NetworkCellProps = {
  network: NetworkTrackingSummary;
};

/**
 * Network name linking to its tracking detail, with its identifier, type and operator.
 */
function NetworkCell({ network }: NetworkCellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Link
        href={buildNetworkTrackingUrl(network.networkType, network.networkId)}
        className="self-start text-sm font-semibold leading-snug"
      >
        {getNetworkName(network)}
      </Link>
      <span className="text-xs text-(--text-mention-grey)">
        {[network.sncuId, networkTypeLabels[network.networkType], network.gestionnaire].filter(Boolean).join(' · ')}
      </span>
    </div>
  );
}

/**
 * Number of pending demands of a network (linking to them) and how long the oldest has been waiting.
 */
function PendingCell({ network }: NetworkCellProps) {
  return (
    <div className="flex flex-col gap-1">
      <Link
        href={buildAdminDemandsUrl(buildDemandFilters(network.networkId, network.networkType, undefined, true))}
        className={cx('self-start text-xl font-bold', network.pending > 0 ? 'text-error' : 'text-gray-900')}
      >
        {network.pending}
      </Link>
      {network.oldestPendingSince && <span className="text-xs">depuis {formatElapsedSince(network.oldestPendingSince)}</span>}
    </div>
  );
}

/**
 * Response rate of a network over the tracking window, with the median delay before the first manager action.
 */
function ResponseCell({ network }: NetworkCellProps) {
  if (network.recentReceived === 0) {
    return <span className="text-(--text-mention-grey)">Aucune demande reçue</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      <span>
        <span className="font-bold">{formatResponseRate(network.recentResponded, network.recentReceived)}</span>{' '}
        <span className="text-xs">
          ({network.recentResponded} sur {network.recentReceived})
        </span>
      </span>
      {network.medianResponseDays !== null && (
        <span className="text-xs">délai médian : {formatDurationDays(network.medianResponseDays)}</span>
      )}
    </div>
  );
}
