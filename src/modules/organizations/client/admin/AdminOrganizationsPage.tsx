import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { useMemo } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import Tooltip from '@/components/ui/Tooltip';
import { useDialogState } from '@/hooks/useDialogState';
import { DataTable } from '@/modules/data-table/DataTable';
import type { DataTableColumn } from '@/modules/data-table/types';
import { useDataTable } from '@/modules/data-table/useDataTable';
import { notify } from '@/modules/notification';
import type { OrganizationRef } from '@/modules/organizations/types';
import trpc, { type RouterOutput } from '@/modules/trpc/client';

import OrganizationCredentialsDialog from './OrganizationCredentialsDialog';
import OrganizationFormDialog from './OrganizationFormDialog';
import OrganizationNetworksDialog from './OrganizationNetworksDialog';

type Org = RouterOutput['organizations']['admin']['list'][number];

const emptyOrganizations: Org[] = [];
const getRowId = (row: Org) => row.id;

/**
 * Admin des organisations gestionnaires : liste + actions par ligne (éditer, réseaux, tokens, supprimer).
 * Chaque dialog est un composant autonome ; le rattachement d'un utilisateur passe par la permission
 * « Organisation » (fiche utilisateur), pas par cet écran.
 */
const AdminOrganizationsPage = () => {
  const utils = trpc.useUtils();
  const { data: organizations, isLoading } = trpc.organizations.admin.list.useQuery();

  const formDialog = useDialogState<OrganizationRef | undefined>();
  const networksDialog = useDialogState<OrganizationRef>();
  const credentialsDialog = useDialogState<OrganizationRef>();
  const deleteDialog = useDialogState<OrganizationRef>();

  const deleteOrg = trpc.organizations.admin.delete.useMutation();

  const columns = useMemo<DataTableColumn<Org>[]>(
    () => [
      { accessorKey: 'name', header: 'Nom' },
      { accessorKey: 'networks_count', align: 'right', header: 'Réseaux', width: 110 },
      { accessorKey: 'credentials_count', align: 'right', header: 'Tokens', width: 100 },
      {
        accessorKey: 'drifting_networks_count',
        align: 'center',
        cell: ({ value }) =>
          value > 0 ? (
            <Badge severity="warning" small noIcon>
              {value}
            </Badge>
          ) : null,
        header: (
          <span className="inline-flex items-center gap-1">
            Écart
            <Tooltip title="Réseaux à rattacher, ou rattachés hors motif déclaré" />
          </span>
        ),
        headerLabel: 'Écart',
        width: 90,
      },
      {
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button type="button" size="small" priority="tertiary" onClick={() => formDialog.open(row)}>
              Éditer
            </Button>
            <Button type="button" size="small" priority="tertiary" onClick={() => networksDialog.open(row)}>
              Réseaux
            </Button>
            <Button type="button" size="small" priority="tertiary" onClick={() => credentialsDialog.open(row)}>
              Tokens
            </Button>
            <Button type="button" size="small" priority="tertiary" href={`/admin/events?organizationId=${row.id}`}>
              Historique
            </Button>
            <Button type="button" size="small" priority="tertiary" onClick={() => deleteDialog.open(row)}>
              Suppr.
            </Button>
          </div>
        ),
        export: false,
        header: 'Actions',
        id: 'actions',
        width: 480,
      },
    ],
    [formDialog.open, networksDialog.open, credentialsDialog.open, deleteDialog.open]
  );

  const table = useDataTable({ columns, data: organizations ?? emptyOrganizations, getRowId, urlKey: 'organizations' });

  return (
    <SimplePage title="Gestion des organisations" mode="authenticated">
      <OrganizationFormDialog control={formDialog} />
      <OrganizationNetworksDialog control={networksDialog} />
      <OrganizationCredentialsDialog control={credentialsDialog} />
      <ConfirmDialog
        control={deleteDialog}
        title="Supprimer l'organisation"
        confirmLabel="Supprimer"
        danger
        onConfirm={async (org) => {
          await deleteOrg.mutateAsync({ id: org.id });
          await utils.organizations.admin.list.invalidate();
          notify('success', 'Organisation supprimée');
        }}
      >
        Êtes-vous sûr de vouloir supprimer <strong>{deleteDialog.data?.name}</strong> ? Les réseaux et utilisateurs rattachés seront
        dé-rattachés et les tokens API supprimés.
      </ConfirmDialog>

      <Box py="4w" className="fr-container">
        <header className="flex items-baseline justify-between">
          <Heading as="h1" color="blue-france">
            Gestion des organisations
          </Heading>
          <Button size="small" priority="secondary" iconId="ri-add-line" onClick={() => formDialog.open(undefined)}>
            Ajouter une organisation
          </Button>
        </header>
        <Text mb="2w">
          Gestionnaires de réseaux et leurs accès API. Rattachez les réseaux d'une organisation via l'action «&nbsp;Réseaux&nbsp;».
        </Text>
        <DataTable table={table} loading={isLoading} rowHeight="sm" />
      </Box>
    </SimplePage>
  );
};

export default AdminOrganizationsPage;
