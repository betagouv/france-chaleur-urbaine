import Alert from '@codegouvfr/react-dsfr/Alert';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useEffect, useRef } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import { trackPostHogEvent } from '@/modules/analytics/client';
import trpc from '@/modules/trpc/client';

import { demandeChaleurRenouvelableStatuses } from '../constants';
import { CcrtDemandEmailDialog } from './CcrtDemandEmailDialog';
import { CcrtDemandsTable } from './CcrtDemandsTable';
import { CcrtDemandTabs, ccrtDemandTabs } from './CcrtDemandTabs';
import { CcrtDemandToolbar } from './CcrtDemandToolbar';
import { getCcrtDemandTab, matchesCcrtDemandSearch } from './ccrt-workspace';
import { useCcrtDemandActions } from './hooks/useCcrtDemandActions';

const QUERY_PREFIX = 'demandes_chaleur_renouvelable_ccrt';
const queryParsers = {
  demandId: parseAsString,
  order: parseAsStringLiteral(['asc', 'desc']).withDefault('desc'),
  search: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  tab: parseAsStringLiteral(ccrtDemandTabs.map((tab) => tab.value)),
};
const queryOptions = {
  urlKeys: {
    demandId: `${QUERY_PREFIX}_demand`,
    order: `${QUERY_PREFIX}_order`,
    search: `${QUERY_PREFIX}_search`,
    status: `${QUERY_PREFIX}_status`,
    tab: `${QUERY_PREFIX}_tab`,
  },
};

/**
 * CCRT dashboard with grouped demands and expandable building information.
 */
export default function DemandesChaleurRenouvelableCcrtPage() {
  const [filters, setFilters] = useQueryStates(queryParsers, queryOptions);
  const query = trpc.batEnr.ccrt.listDemandesChaleurRenouvelable.useQuery();
  const demands = query.data?.items ?? [];
  // Notification links already use the search key, so search defaults to the full list.
  const activeTab = filters.tab ?? (filters.search ? 'all' : 'to_process');
  const actions = useCcrtDemandActions(query.data?.trackingContext.structure_ccrt ?? null);
  const trackedTab = useRef<string | null>(null);
  const demandsInTab = demands.filter((demand) => activeTab === 'all' || getCcrtDemandTab(demand) === activeTab);
  const visibleDemands = demandsInTab
    .filter((demand) => (!filters.status || demand.status === filters.status) && matchesCcrtDemandSearch(demand, filters.search))
    .toSorted((first, second) =>
      filters.order === 'desc' ? second.created_at.localeCompare(first.created_at) : first.created_at.localeCompare(second.created_at)
    );

  // Track the group being consulted only when its authorized data is available.
  useEffect(() => {
    if (!query.data || trackedTab.current === activeTab) {
      return;
    }
    trackPostHogEvent('ccrt_demandes:list_viewed', {
      departement: query.data.trackingContext.departements.join(',') || null,
      onglet: activeTab,
      structure_ccrt: query.data.trackingContext.structure_ccrt,
    });
    trackedTab.current = activeTab;
  }, [activeTab, query.data]);

  return (
    <SimplePage
      title="Demandes d’accompagnement"
      description="Immeubles en chauffage collectif de votre territoire"
      mode="authenticated"
      className="min-h-screen bg-(--background-alt-grey)"
      includeFooter={false}
    >
      <div className="fr-container max-w-[1288px] py-12">
        <h1 className="mb-2 text-3xl">Demandes d’accompagnement</h1>
        <p className="mb-6">Immeubles en chauffage collectif de votre territoire</p>
        <CcrtDemandTabs
          activeTab={activeTab}
          isLoading={query.isLoading}
          counts={{
            all: demands.length,
            closed: demands.filter((demand) => getCcrtDemandTab(demand) === 'closed').length,
            in_progress: demands.filter((demand) => getCcrtDemandTab(demand) === 'in_progress').length,
            to_process: demands.filter((demand) => getCcrtDemandTab(demand) === 'to_process').length,
          }}
          onTabChange={(tab) => void setFilters({ demandId: null, status: '', tab })}
        />
        {query.isError ? (
          <div>
            <Alert severity="error" title="Impossible de charger les demandes" description="Veuillez réessayer." />
            <Button className="mt-4" onClick={() => void query.refetch()}>
              Réessayer
            </Button>
          </div>
        ) : (
          <div className="bg-(--background-default-grey)">
            <CcrtDemandToolbar
              search={filters.search}
              status={filters.status}
              demands={visibleDemands}
              statusOptions={demandeChaleurRenouvelableStatuses
                .filter((status) => activeTab === 'all' || getCcrtDemandTab({ status: status.label }) === activeTab)
                .map((status) => ({ label: status.label, value: status.label }))}
              onSearchChange={(search) => void setFilters({ search, tab: activeTab })}
              onStatusChange={(status) => void setFilters({ status })}
            />
            <CcrtDemandsTable
              demands={visibleDemands}
              expandedDemandId={filters.demandId}
              isLoading={query.isLoading}
              hasDemands={demands.length > 0}
              order={filters.order}
              actions={actions}
              onSort={() => void setFilters({ order: filters.order === 'desc' ? 'asc' : 'desc' })}
              onToggle={(demand) => {
                if (filters.demandId !== demand.id) {
                  actions.trackOpening(demand);
                }
                void setFilters({ demandId: filters.demandId === demand.id ? null : demand.id });
              }}
            />
          </div>
        )}
      </div>
      {actions.emailDemand && (
        <CcrtDemandEmailDialog demand={actions.emailDemand} showHistory={actions.showEmailHistory} onClose={actions.closeEmail} />
      )}
    </SimplePage>
  );
}
