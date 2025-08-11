import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import { useFetch } from '@/hooks/useApi';
import { withAuthentication } from '@/server/authentication';
import { type AdminEvent } from '@/server/services/events';
import { type UserRole } from '@/types/enum/UserRole';

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
              <div>{event.author.email}</div>
              <UserRoleBadge role={event.author.role as UserRole} />
            </div>
          ) : null;
        },
      },
      { accessorKey: 'type', header: 'Type' },
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
    []
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
        </div>

        <TableSimple columns={columns} data={events ?? []} loading={isLoading} enableGlobalFilter padding="sm" />
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
