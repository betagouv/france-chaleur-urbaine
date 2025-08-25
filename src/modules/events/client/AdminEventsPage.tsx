import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch';
import { parseAsString, useQueryStates } from 'nuqs';
import { type ReactNode, useCallback, useMemo } from 'react';

import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Tag from '@/components/ui/Tag';
import VirtualList, { type VirtualListRowProps } from '@/components/ui/VirtualList';
import { useFetch } from '@/hooks/useApi';
import useQueryFlag from '@/hooks/useQueryFlag';
import { type EventType, eventTypes } from '@/modules/events/constants';
import { type AdminEvent } from '@/modules/events/server/service';
import { withAuthentication } from '@/server/authentication';
import { type UserRole } from '@/types/enum/UserRole';

type Filters = {
  type?: string | null;
  authorId?: string | null;
  contextType?: string | null;
  contextId?: string | null;
};

const FilterButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <Button size="small" priority="tertiary no outline" className="!px-1" onClick={onClick}>
    {children}
  </Button>
);

const eventLabelRenderers: Record<EventType, (event: AdminEvent, updateFilters: (filters: Partial<Filters>) => void) => ReactNode> = {
  user_login: () => "s'est connecté",
  user_activated: () => 'a activé son compte',
  user_created: () => 'a créé un compte',
  user_updated: () => 'a mis à jour un compte',
  user_deleted: () => 'a supprimé un compte',
  demand_created: (event, updateFilters) => (
    <>
      <span>Une </span>
      <FilterButton onClick={() => updateFilters({ contextType: 'demand', contextId: event.context_id })}>demande</FilterButton>
      <span> a été créée</span>
    </>
  ),
  demand_assigned: (event, updateFilters) => (
    <>
      <span>a assigné une </span>
      <FilterButton onClick={() => updateFilters({ contextType: 'demand', contextId: event.context_id })}>demande</FilterButton>
    </>
  ),
  demand_updated: (event, updateFilters) => (
    <>
      <span>a mis à jour une </span>
      <FilterButton onClick={() => updateFilters({ contextType: 'demand', contextId: event.context_id })}>demande</FilterButton>
    </>
  ),
  demand_deleted: (event, updateFilters) => (
    <>
      <span>a supprimé une </span>
      <FilterButton onClick={() => updateFilters({ contextType: 'demand', contextId: event.context_id })}>demande</FilterButton>
    </>
  ),
  pro_eligibility_test_created: (event, updateFilters) => (
    <>
      <span>a créé un </span>
      <FilterButton onClick={() => updateFilters({ contextType: 'pro_eligibility_test', contextId: event.context_id })}>
        test d'éligibilité
      </FilterButton>
    </>
  ),
  pro_eligibility_test_renamed: (event, updateFilters) => (
    <>
      <span>a renommé un </span>
      <FilterButton onClick={() => updateFilters({ contextType: 'pro_eligibility_test', contextId: event.context_id })}>
        test d'éligibilité
      </FilterButton>
    </>
  ),
  pro_eligibility_test_updated: (event, updateFilters) => (
    <>
      <span>a mis à jour un </span>
      <FilterButton onClick={() => updateFilters({ contextType: 'pro_eligibility_test', contextId: event.context_id })}>
        test d'éligibilité
      </FilterButton>
    </>
  ),
  pro_eligibility_test_deleted: (event, updateFilters) => (
    <>
      <span>a supprimé un </span>
      <FilterButton onClick={() => updateFilters({ contextType: 'pro_eligibility_test', contextId: event.context_id })}>
        test d'éligibilité
      </FilterButton>
    </>
  ),
};

export default function AdminEventsPage() {
  const [filters, setFilters] = useQueryStates({
    type: parseAsString,
    authorId: parseAsString,
    contextType: parseAsString,
    contextId: parseAsString,
  } satisfies Record<keyof Filters, any>);

  const [showDetails, toggleShowDetails] = useQueryFlag('details');

  const updateFilters = useCallback(
    (partial: Partial<Filters>) => {
      setFilters((filters) => ({ ...filters, ...partial }));
    },
    [setFilters]
  );

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.authorId) params.set('authorId', filters.authorId);
    if (filters.contextType) params.set('contextType', filters.contextType);
    if (filters.contextId) params.set('contextId', filters.contextId);
    return `/api/admin/events${params.toString() ? `?${params.toString()}` : ''}`;
  }, [filters]);

  const { data: events } = useFetch<AdminEvent[]>(apiUrl);

  const BoundEventRow = useCallback(
    ({ item }: VirtualListRowProps<AdminEvent>) => <EventRow item={item} updateFilters={updateFilters} showDetails={showDetails} />,
    [updateFilters, showDetails]
  );

  return (
    <SimplePage title="Activité du site" mode="authenticated">
      <Box py="4w" className="fr-container">
        <Heading as="h1" color="blue-france">
          Activité du site
        </Heading>

        <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w items-end">
          <div className="fr-col-12 fr-col-md-3">
            <Select
              label="Filtrer par type (beta)"
              nativeSelectProps={{
                value: filters.type ?? '',
                onChange: (e) => updateFilters({ type: e.target.value || null }),
              }}
              options={[{ label: 'Tous', value: '' }, ...eventTypes.map((type) => ({ label: type, value: type }))]}
            />
          </div>
          <div className="fr-col-12 fr-col-md-3 ml-auto">
            <ToggleSwitch label="Afficher les détails" checked={showDetails} onChange={() => toggleShowDetails()} />
          </div>

          {filters.authorId || (filters.contextType && filters.contextId) ? (
            <div className="fr-col-12 fr-col-md-9">
              <div className="flex items-center gap-2 flex-wrap">
                {filters.authorId && (
                  <Tag
                    dismissible
                    size="sm"
                    variant="info"
                    nativeButtonProps={{
                      onClick: () => updateFilters({ authorId: null }),
                      title: "Supprimer le filtre d'auteur",
                    }}
                  >
                    Auteur:{filters.authorId}
                  </Tag>
                )}
                {filters.contextType && filters.contextId && (
                  <Tag
                    dismissible
                    size="sm"
                    variant="info"
                    nativeButtonProps={{
                      onClick: () => updateFilters({ contextType: null, contextId: null }),
                      title: 'Supprimer le filtre de contexte',
                    }}
                  >
                    {`${filters.contextType}:${filters.contextId}`}
                  </Tag>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <VirtualList items={events ?? []} estimateSize={48} renderRow={BoundEventRow} getItemKey={(item) => item.id} />
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);

type EventRowProps = VirtualListRowProps<AdminEvent> & {
  updateFilters: (filters: Partial<Filters>) => void;
  showDetails: boolean;
};

const EventRow = ({ item: event, updateFilters, showDetails }: EventRowProps) => {
  return (
    <div className="flex items-center border-b border-b-gray-200 px-2 py-1">
      <div className="shrink-0 w-30 text-xs text-gray-500 mr-4">{new Date(event.created_at).toLocaleString('fr-FR')}</div>
      {event.author ? (
        <>
          <UserRoleBadge role={event.author.role as UserRole} />
          <FilterButton onClick={() => updateFilters({ authorId: event.author_id })}>{event.author.email}</FilterButton>
        </>
      ) : null}
      <div className="text-sm">{eventLabelRenderers[event.type](event, updateFilters)}</div>
      {showDetails && event.data && typeof event.data === 'object' && Object.keys(event.data).length > 0 && (
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(event.data, null, 2).slice(2, -2)}</pre>
      )}
    </div>
  );
};
