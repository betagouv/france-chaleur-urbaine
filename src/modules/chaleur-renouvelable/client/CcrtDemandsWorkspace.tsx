import Alert from '@codegouvfr/react-dsfr/Alert';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';

import SimplePage from '@/components/shared/page/SimplePage';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import useIsMobile from '@/hooks/useIsMobile';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import { demandeChaleurRenouvelableStatusOptions } from '../constants';
import { CcrtDemandEmailDialog } from './CcrtDemandEmailDialog';
import { CcrtDemandsMobile } from './CcrtDemandsMobile';
import { CcrtDemandsTable } from './CcrtDemandsTable';
import { CcrtDemandTabs, ccrtDemandTabs } from './CcrtDemandTabs';
import { CcrtDemandToolbar } from './CcrtDemandToolbar';
import { invalidateCcrtDemand } from './ccrt-demand-cache';
import { getCcrtDemandTab, matchesCcrtDemandSearch } from './ccrt-workspace';
import { useCcrtDemandActions } from './hooks/useCcrtDemandActions';
import { useCcrtWorkspaceTracking } from './hooks/useCcrtWorkspaceTracking';

const QUERY_PREFIX = 'demandes_chaleur_renouvelable_ccrt';
const queryParsers = {
  demandId: parseAsString,
  order: parseAsStringLiteral(['asc', 'desc']).withDefault('desc'),
  search: parseAsString.withDefault(''),
  sort: parseAsStringLiteral(['date', 'status']).withDefault('date'),
  status: parseAsString.withDefault(''),
  tab: parseAsStringLiteral(ccrtDemandTabs.map((tab) => tab.value)),
};
type CcrtDemandsWorkspaceProps = {
  isAdmin?: boolean;
};

/**
 * CCRT dashboard with grouped demands and expandable building information.
 */
export function CcrtDemandsWorkspace({ isAdmin = false }: CcrtDemandsWorkspaceProps) {
  const isMobile = useIsMobile(991);
  const queryPrefix = isAdmin ? 'demandes_chaleur_renouvelable' : QUERY_PREFIX;
  const [filters, setFilters] = useQueryStates(queryParsers, {
    urlKeys: {
      demandId: `${queryPrefix}_demand`,
      order: `${queryPrefix}_order`,
      search: `${queryPrefix}_search`,
      sort: `${queryPrefix}_sort`,
      status: `${queryPrefix}_status`,
      tab: `${queryPrefix}_tab`,
    },
  });
  const ccrtQuery = trpc.batEnr.ccrt.listDemandesChaleurRenouvelable.useQuery(undefined, { enabled: !isAdmin });
  const adminQuery = trpc.batEnr.admin.listDemandesChaleurRenouvelable.useQuery(undefined, { enabled: isAdmin });
  const query = isAdmin ? adminQuery : ccrtQuery;
  const trackingContext = isAdmin ? undefined : ccrtQuery.data?.trackingContext;
  const utils = trpc.useUtils();
  const validation = trpc.batEnr.admin.validateDemandeChaleurRenouvelable.useMutation();
  const validateDemand = toastErrors(async (demandId: string) => {
    await validation.mutateAsync({ demandId });
    await invalidateCcrtDemand(utils, demandId);
  });
  const demands = query.data?.items ?? [];
  // Notification links already use the search key, so search defaults to the full list.
  const activeTab = filters.tab ?? (isAdmin || filters.search ? 'all' : 'to_process');
  const actions = useCcrtDemandActions(trackingContext?.structure_ccrt ?? null);
  const tracking = useCcrtWorkspaceTracking(trackingContext, activeTab, filters.search);
  const demandsInTab = demands.filter((demand) => activeTab === 'all' || getCcrtDemandTab(demand) === activeTab);
  const visibleDemands = demandsInTab
    .filter((demand) => (!filters.status || demand.status === filters.status) && matchesCcrtDemandSearch(demand, filters.search))
    .toSorted((first, second) => {
      const comparison =
        filters.sort === 'status' ? first.status.localeCompare(second.status, 'fr') : first.created_at.localeCompare(second.created_at);
      return (filters.order === 'desc' ? -comparison : comparison) || second.created_at.localeCompare(first.created_at);
    });

  const description = isAdmin ? 'Toutes les demandes, y compris celles à valider' : 'Immeubles en chauffage collectif de votre territoire';
  const isMobileDetails = isMobile && visibleDemands.some((demand) => demand.id === filters.demandId);
  const toggleDemand = (demand: (typeof demands)[number]) => {
    if (filters.demandId !== demand.id) {
      actions.trackOpening(demand);
    }
    void setFilters({ demandId: filters.demandId === demand.id ? null : demand.id });
  };
  const toolbar = (
    <CcrtDemandToolbar
      search={filters.search}
      status={filters.status}
      demands={visibleDemands}
      statusOptions={demandeChaleurRenouvelableStatusOptions.filter(
        (status) => activeTab === 'all' || getCcrtDemandTab({ status: status.value }) === activeTab
      )}
      onSearchChange={(search) => void setFilters({ search, tab: activeTab })}
      onSearch={tracking.trackSearch}
      onStatusChange={(status) => {
        tracking.trackFilter('statut', status);
        void setFilters({ status });
      }}
      onExport={tracking.trackExport}
    />
  );

  return (
    <SimplePage
      title="Demandes d’accompagnement"
      description={description}
      mode="authenticated"
      className="min-h-screen bg-(--background-alt-grey)"
      includeFooter={false}
    >
      <div className="fr-container max-w-[1288px] py-9 lg:py-12">
        {!isMobileDetails && (
          <>
            <h1 className="mb-4 text-[28px] leading-9 lg:mb-2 lg:text-3xl">
              <span className="lg:hidden">Demandes</span>
              <span className="hidden lg:inline">Demandes d’accompagnement</span>
            </h1>
            <p className="mb-6 hidden lg:block">{description}</p>
            <CcrtDemandTabs
              activeTab={activeTab}
              isLoading={query.isLoading}
              counts={{
                all: demands.length,
                closed: demands.filter((demand) => getCcrtDemandTab(demand) === 'closed').length,
                completed: demands.filter((demand) => getCcrtDemandTab(demand) === 'completed').length,
                in_progress: demands.filter((demand) => getCcrtDemandTab(demand) === 'in_progress').length,
                to_process: demands.filter((demand) => getCcrtDemandTab(demand) === 'to_process').length,
              }}
              onTabChange={(tab) => {
                tracking.trackTab(tab);
                void setFilters({ demandId: null, status: '', tab });
              }}
            />
          </>
        )}
        {query.isError ? (
          <div>
            <Alert severity="error" title="Impossible de charger les demandes" description="Veuillez réessayer." />
            <Button className="mt-4" onClick={() => void query.refetch()}>
              Réessayer
            </Button>
          </div>
        ) : isMobile ? (
          <>
            {!isMobileDetails && (
              <Accordion label="Rechercher et filtrer" simple lazy className="mb-4">
                {toolbar}
              </Accordion>
            )}
            <CcrtDemandsMobile
              demands={visibleDemands}
              expandedDemandId={filters.demandId}
              isLoading={query.isLoading}
              hasDemands={demands.length > 0}
              actions={actions}
              onToggle={toggleDemand}
              onClose={() => void setFilters({ demandId: null })}
              onValidate={isAdmin ? validateDemand : undefined}
            />
          </>
        ) : (
          <div className="hidden bg-(--background-default-grey) lg:block">
            {toolbar}
            <CcrtDemandsTable
              demands={visibleDemands}
              expandedDemandId={filters.demandId}
              isLoading={query.isLoading}
              hasDemands={demands.length > 0}
              order={filters.order}
              sort={filters.sort}
              actions={actions}
              onValidate={isAdmin ? validateDemand : undefined}
              onSort={(sort) => {
                const order = filters.sort === sort ? (filters.order === 'desc' ? 'asc' : 'desc') : sort === 'date' ? 'desc' : 'asc';
                tracking.trackFilter(sort === 'date' ? 'date' : 'statut', order);
                void setFilters({ order, sort });
              }}
              onToggle={toggleDemand}
            />
          </div>
        )}
      </div>
      {actions.emailDemand && (
        <CcrtDemandEmailDialog
          demand={actions.emailDemand}
          showHistory={actions.showEmailHistory}
          initialEmailId={actions.selectedEmailId}
          onClose={actions.closeEmail}
          onPhoneContact={() => actions.emailDemand && actions.trackContact(actions.emailDemand, 'phone', actions.emailPlacement)}
        />
      )}
    </SimplePage>
  );
}
