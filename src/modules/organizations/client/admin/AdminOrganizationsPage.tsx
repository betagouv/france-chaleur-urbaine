import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { useMemo } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import { useDialogState } from '@/hooks/useDialogState';
import { notify } from '@/modules/notification';
import type { OrganizationRef } from '@/modules/organizations/types';
import trpc from '@/modules/trpc/client';

import OrganizationCredentialsDialog from './OrganizationCredentialsDialog';
import OrganizationFormDialog from './OrganizationFormDialog';
import OrganizationNetworksDialog from './OrganizationNetworksDialog';

/**
 * Admin des organisations gestionnaires : liste + actions par ligne (éditer, réseaux, tokens, supprimer).
 * Chaque dialog est un composant autonome ; le rattachement d'un utilisateur passe par la permission
 * « Organisation » (fiche utilisateur), pas par cet écran.
 */
const AdminOrganizationsPage = () => {
  const utils = trpc.useUtils();
  const { data: organizations, isLoading } = trpc.organizations.admin.list.useQuery();
  type Org = NonNullable<typeof organizations>[number];

  const formDialog = useDialogState<OrganizationRef | undefined>();
  const networksDialog = useDialogState<OrganizationRef>();
  const credentialsDialog = useDialogState<OrganizationRef>();
  const deleteDialog = useDialogState<OrganizationRef>();

  const deleteOrg = trpc.organizations.admin.delete.useMutation();

  const columns: ColumnDef<Org>[] = useMemo(
    () => [
      { accessorKey: 'name', cell: (info) => info.getValue<string>(), flex: 1, header: 'Nom' },
      { accessorKey: 'networks_count', header: 'Réseaux', width: '110px' },
      { accessorKey: 'credentials_count', header: 'Tokens', width: '100px' },
      {
        cell: ({ row }) =>
          row.original.drifting_networks_count > 0 ? (
            <Badge severity="warning" small noIcon>
              {row.original.drifting_networks_count}
            </Badge>
          ) : null,
        header: 'Dérive',
        id: 'drift',
        width: '90px',
      },
      {
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button type="button" size="small" priority="tertiary" onClick={() => formDialog.open(row.original)}>
              Éditer
            </Button>
            <Button type="button" size="small" priority="tertiary" onClick={() => networksDialog.open(row.original)}>
              Réseaux
            </Button>
            <Button type="button" size="small" priority="tertiary" onClick={() => credentialsDialog.open(row.original)}>
              Tokens
            </Button>
            <Button type="button" size="small" priority="tertiary" onClick={() => deleteDialog.open(row.original)}>
              Suppr.
            </Button>
          </div>
        ),
        header: 'Actions',
        id: 'actions',
        width: '400px',
      },
    ],
    [formDialog.open, networksDialog.open, credentialsDialog.open, deleteDialog.open]
  );

  return (
    <SimplePage title="Organisations" mode="authenticated">
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
            Organisations
          </Heading>
          <Button size="small" priority="secondary" iconId="ri-add-line" onClick={() => formDialog.open(undefined)}>
            Ajouter une organisation
          </Button>
        </header>
        <Text mb="2w">
          Gestionnaires de réseaux et leurs accès API. Rattachez les réseaux d'une organisation via l'action «&nbsp;Réseaux&nbsp;».
        </Text>
        <TableSimple columns={columns} data={organizations || []} loading={isLoading} padding="sm" urlSyncKey="organizations" />
      </Box>
    </SimplePage>
  );
};

export default AdminOrganizationsPage;
