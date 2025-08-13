import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import Tag from '@/components/ui/Tag';
import { useFetch } from '@/hooks/useApi';
import { withAuthentication } from '@/server/authentication';
import { type EventType } from '@/server/db/kysely';
import { type AdminEvent } from '@/server/services/events';
import { type UserRole } from '@/types/enum/UserRole';

const eventTypeLabels = {
  user_login: 'Connexion',
  user_activated: 'Compte activé',
  user_created: 'Création de compte',
  user_updated: 'Mise à jour de compte',
  user_deleted: 'Suppression de compte',
  demand_created: 'Création de demande',
  demand_assigned: 'Assignation de demande',
  demand_updated: 'Mise à jour de demande',
  demand_deleted: 'Suppression de demande',
  pro_eligibility_test_created: "Création de test d'éligibilité",
  pro_eligibility_test_renamed: "Renommage de test d'éligibilité",
  pro_eligibility_test_updated: "Mise à jour de test d'éligibilité",
  pro_eligibility_test_deleted: "Suppression de test d'éligibilité",
} as const satisfies Record<EventType, string>;

export default function AdminEventsPage() {
  const [filters, setFilters] = useQueryStates({
    type: parseAsString,
    authorId: parseAsString,
    contextType: parseAsString,
    contextId: parseAsString,
  });

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.authorId) params.set('authorId', filters.authorId);
    if (filters.contextType) params.set('contextType', filters.contextType);
    if (filters.contextId) params.set('contextId', filters.contextId);
    return `/api/admin/events${params.toString() ? `?${params.toString()}` : ''}`;
  }, [filters]);

  const { data: events, isLoading } = useFetch<AdminEvent[]>(apiUrl);

  const columns = useMemo<ColumnDef<AdminEvent>[]>(
    () => [
      { accessorKey: 'created_at', header: 'Date', cellType: 'DateTime' },
      {
        accessorFn: (row) => `${row.author?.email}${row.author?.role}`,
        header: 'Auteur',
        cell: ({ row }) => {
          const event = row.original;
          return event.author ? (
            <div className="flex flex-col gap-2">
              <Button
                size="small"
                priority="tertiary no outline"
                className="!px-1"
                onClick={() => setFilters({ ...filters, authorId: event.author_id })}
              >
                {event.author.email}
              </Button>
              <UserRoleBadge role={event.author.role as UserRole} />
            </div>
          ) : null;
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const event = row.original;
          return event.context_type === 'demand' ? (
            <Button
              size="small"
              priority="tertiary no outline"
              className="!px-1"
              onClick={() => setFilters({ ...filters, contextType: 'demand', contextId: event.context_id })}
            >
              {eventTypeLabels[event.type]}
            </Button>
          ) : (
            eventTypeLabels[event.type]
          );
        },
      },
      {
        accessorKey: 'data',
        header: 'Données',
        cell: (info) => {
          const value = info.getValue() as unknown;
          if (value && typeof value === 'object')
            return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>;
          return String(value ?? '');
        },
        enableSorting: false,
      },
    ],
    [filters]
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
                onChange: (e) => setFilters({ ...filters, type: e.target.value || null }),
              }}
              options={[
                { label: 'Tous', value: '' },
                { label: 'user_login', value: 'user_login' },
                { label: 'user_created', value: 'user_created' },
                { label: 'demand_created', value: 'demand_created' },
                { label: 'demand_assigned', value: 'demand_assigned' },
              ]}
            />
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
                      onClick: () => setFilters({ ...filters, authorId: null }),
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
                      onClick: () => setFilters({ ...filters, contextType: null, contextId: null }),
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

        <TableSimple columns={columns} data={events ?? []} loading={isLoading} enableGlobalFilter padding="sm" />
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
