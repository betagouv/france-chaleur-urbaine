import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb';
import type { ColumnFiltersState } from '@tanstack/react-table';
import { parseAsJson, useQueryState } from 'nuqs';
import { useState } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import CallOut from '@/components/ui/CallOut';
import Heading from '@/components/ui/Heading';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import TableSimple, { type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import { networkTrackingStateLabels } from '@/modules/demands/constants';
import trpc from '@/modules/trpc/client';

import { networkTrackingColumns } from './columns';
import { ADMIN_DASHBOARD_URL, historyStartLabel } from './format';
import type { NetworkTrackingSummary } from './types';

// biome-ignore assist/source/useSortedKeys: display order, from the whole list to the cases to act on
const quickFilterPresets = {
  all: {
    filters: [],
    getStat: (networks) => networks.length,
    label: 'réseaux',
  },
  silent: {
    filters: [{ id: 'state', value: { [networkTrackingStateLabels.silent]: true } }],
    getStat: (networks) => networks.filter((network) => network.state === 'silent').length,
    label: 'muets',
  },
  late: {
    filters: [{ id: 'state', value: { [networkTrackingStateLabels.late]: true } }],
    getStat: (networks) => networks.filter((network) => network.state === 'late').length,
    label: 'en retard',
  },
  pendingWithoutUsers: {
    filters: [
      { id: 'pending', value: [1, Number.MAX_VALUE] }, // open-ended upper bound: at least one pending demand
      { id: 'users', value: 'empty' },
    ],
    getStat: (networks) => networks.filter((network) => network.pending > 0 && network.users.length === 0).length,
    label: 'à traiter sans utilisateur',
  },
} satisfies Record<string, QuickFilterPreset<NetworkTrackingSummary>>;

/**
 * Admin screen listing every network, sorted to surface the ones whose managers no longer answer their demands.
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
    <SimplePage title="Suivi des réseaux" mode="authenticated" layout="fluid" className="p-4">
      <Breadcrumb
        className="mt-0! mb-2!"
        currentPageLabel="Suivi des réseaux"
        segments={[{ label: 'Administration', linkProps: { href: ADMIN_DASHBOARD_URL } }]}
      />
      <Heading as="h1" color="blue-france">
        Suivi des réseaux
      </Heading>

      <CallOut size="sm">
        <p>
          Cet écran repère les réseaux dont les gestionnaires ne répondent plus aux demandes validées. L'activité des gestionnaires est
          connue depuis {historyStartLabel} : un réseau sans action depuis cette date est signalé comme tel. Les boutons « Trier » et «
          Filtres » donnent accès à chaque indicateur, y compris ceux regroupés dans une même colonne.
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
        columns={networkTrackingColumns}
        data={networks}
        loading={isLoading}
        initialSortingState={[
          { desc: false, id: 'state' },
          { desc: true, id: 'pending' },
        ]}
        columnFilters={columnFilters}
        controlsLayout="block"
        height="85vh"
        padding="sm"
        loadingEmptyMessage="Aucun réseau"
        urlSyncKey="suivi_reseaux"
        export={{ fileName: 'suivi_reseaux.xlsx', sheetName: 'suivi_reseaux' }}
        enableGlobalFilter
        enableFiltersDialog
        enableSortDialog
      />
    </SimplePage>
  );
}
