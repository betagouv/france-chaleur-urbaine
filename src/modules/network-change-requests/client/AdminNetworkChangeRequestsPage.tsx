import type { ColumnFiltersState } from '@tanstack/react-table';
import { parseAsJson, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Link from '@/components/ui/Link';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import trpc from '@/modules/trpc/client';

import { networkChangeRequestContactTypeLabels, networkChangeRequestKindLabels, networkChangeRequestStatusLabels } from '../constants';
import { isConversionPending } from './buildChangeRows';
import NetworkChangeRequestDetail, { type NetworkChangeRequestItem } from './NetworkChangeRequestDetail';

const quickFilterPresets = {
  all: {
    filters: [],
    getStat: (requests) => requests.length,
    label: 'demandes au total',
  },
  pending: {
    filters: [{ id: 'status', value: { [networkChangeRequestStatusLabels.pending]: true } }],
    getStat: (requests) => requests.filter((request) => request.status === 'pending').length,
    label: 'à traiter',
  },
} satisfies Record<string, QuickFilterPreset<NetworkChangeRequestItem>>;

/** List and processing of the network change requests submitted by collectivités and operators. */
export default function AdminNetworkChangeRequestsPage() {
  // the dashboard deep-links with filters in the URL: start from them so the matching preset shows as active
  const [urlColumnFilters] = useQueryState(
    'modifications_reseau_filters',
    parseAsJson<ColumnFiltersState>((value) => value as ColumnFiltersState)
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(urlColumnFilters ?? []);
  // `id` in the URL: deep link (dashboard, events) and the state of the detail dialog
  const [selectedId, setSelectedId] = useQueryState('id');
  const { data: requests = [], isLoading } = trpc.networkChangeRequests.admin.list.useQuery(undefined, {
    // conversions run in the background: poll while one is pending so the detail unlocks without a reload
    refetchInterval: (query) => (query.state.data?.some(isConversionPending) ? 5000 : false),
  });
  const selectedRequest = requests.find((request) => request.id === selectedId);

  const columns: ColumnDef<NetworkChangeRequestItem>[] = useMemo(
    () => [
      {
        accessorFn: (row) => row.created_at,
        cellType: 'DateTime',
        enableGlobalFilter: false,
        filterType: 'Range',
        header: 'Date',
        id: 'created_at',
        width: '110px',
      },
      {
        accessorFn: (row) => networkChangeRequestKindLabels[row.kind],
        filterType: 'Facets',
        header: 'Demande',
        id: 'kind',
        width: '240px',
      },
      {
        accessorKey: 'network_label',
        cell: ({ row }) => <span className="font-medium">{row.original.network_label}</span>,
        header: 'Réseau',
        width: '240px',
      },
      {
        accessorFn: (row) =>
          row.origin === 'import'
            ? (row.contact_type_other ?? 'Import')
            : `${row.contact_first_name ?? ''} ${row.contact_last_name ?? ''} ${row.contact_email ?? ''} ${row.contact_structure ?? ''}`,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold">
              {row.original.origin === 'import'
                ? (row.original.contact_type_other ?? 'Import de données')
                : `${row.original.contact_first_name ?? ''} ${row.original.contact_last_name ?? ''}`}
            </span>
            {row.original.origin === 'form' && (
              <span className="text-sm text-gray-600">
                {networkChangeRequestContactTypeLabels[row.original.contact_type]}
                {row.original.contact_structure ? ` · ${row.original.contact_structure}` : ''}
              </span>
            )}
          </div>
        ),
        enableSorting: false,
        header: 'Contact',
        id: 'Contact',
        width: '240px',
      },
      {
        accessorFn: (row) => row.files.length,
        align: 'center',
        cellType: 'Number',
        enableGlobalFilter: false,
        header: 'Fichiers',
        id: 'Fichiers',
        width: '90px',
      },
      {
        accessorFn: (row) => networkChangeRequestStatusLabels[row.status],
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Statut',
        id: 'status',
        width: '110px',
      },
      {
        cell: ({ row }) => (
          <Button size="small" priority="secondary" onClick={() => void setSelectedId(row.original.id)}>
            Voir
          </Button>
        ),
        enableSorting: false,
        header: '',
        id: 'Actions',
        width: '90px',
      },
    ],
    [setSelectedId]
  );

  return (
    <SimplePage
      title="Demandes de modification de réseau"
      description="Traitement des demandes déposées par les collectivités et exploitants"
      mode="authenticated"
      layout="center"
    >
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <QuickFilterPresets
          presets={quickFilterPresets}
          data={requests}
          loading={isLoading}
          columnFilters={columnFilters}
          onFiltersChange={setColumnFilters}
        />
        <Link href="/admin/enquete-fedene" variant="tertiary" className="ml-auto fr-btn--sm fr-btn--icon-left fr-icon-file-text-line">
          Enquête FEDENE : import et écarts
        </Link>
      </div>
      <TableSimple
        columns={columns}
        data={requests}
        loading={isLoading}
        initialSortingState={[{ desc: true, id: 'created_at' }]}
        columnFilters={columnFilters}
        fluid
        controlsLayout="block"
        padding="sm"
        loadingEmptyMessage="Aucune demande de modification de réseau"
        urlSyncKey="modifications_reseau"
        enableGlobalFilter
        onRowClick={(rowId) => void setSelectedId(rowId)}
        rowIdKey="id"
      />
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) {
            void setSelectedId(null);
          }
        }}
        title={selectedRequest ? `${networkChangeRequestKindLabels[selectedRequest.kind]} · ${selectedRequest.network_label}` : ''}
        size="xl"
      >
        {selectedRequest && <NetworkChangeRequestDetail key={selectedRequest.id} request={selectedRequest} />}
      </Dialog>
    </SimplePage>
  );
}
