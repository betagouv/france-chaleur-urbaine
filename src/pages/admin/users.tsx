import { Badge as DsfrBadge } from '@codegouvfr/react-dsfr/Badge';
import type { SortingState } from '@tanstack/react-table';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

import UserForm from '@/components/Admin/UserForm';
import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import SimplePage from '@/components/shared/page/SimplePage';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Dialog from '@/components/ui/Dialog';
import HamburgerMenu, { type HamburgerMenuItem } from '@/components/ui/HamburgerMenu';
import Heading from '@/components/ui/Heading';
import Loader from '@/components/ui/Loader';
import Text from '@/components/ui/Text';
import Tooltip from '@/components/ui/Tooltip';
import { useFetch } from '@/hooks/useApi';
import useCrud from '@/hooks/useCrud';
import { useDialogState } from '@/hooks/useDialogState';
import { cells } from '@/modules/data-table/cells';
import { DataTable } from '@/modules/data-table/DataTable';
import type { FilterDef, FilterValuesOf } from '@/modules/data-table/filters/filter-types';
import type { DataTableColumn } from '@/modules/data-table/types';
import { useDataTable } from '@/modules/data-table/useDataTable';
import { notify, toastErrors } from '@/modules/notification';
import type { Permission, PermissionType, PermissionWithLabel } from '@/modules/permissions/types';
import trpc from '@/modules/trpc/client';
import BulkTagDialog from '@/modules/users/client/admin/BulkTagDialog';
import UserTagBadge from '@/modules/users/client/admin/UserTagBadge';
import { structureTypesLabels } from '@/modules/users/constants';
import type { User } from '@/modules/users/server/service';
import type { UsersResponse } from '@/pages/api/admin/users/[[...slug]]';
import { withAuthentication } from '@/server/authentication';
import type { UserRole } from '@/types/enum/UserRole';
import { saveImpostureReturnPath } from '@/utils/imposture';
import { postFetchJSON } from '@/utils/network';

import type { AdminUsersStats } from '../api/admin/users-stats';

// Stable empty reference while users load, so the table's memoized derivations don't recompute every render.
const emptyUsers: User[] = [];

const permissionTypePluralLabels: Record<PermissionType, string> = {
  commune: 'Communes',
  departement: 'Départements',
  epci: 'EPCI',
  ept: 'EPT',
  organization: 'Organisations',
  region: 'Régions',
  reseau_de_chaleur: 'Réseaux existants',
  reseau_en_construction: 'Réseaux en construction',
};

function formatPermissionSummary(permissions: PermissionWithLabel[]): string {
  const parts: string[] = [];

  const networks = permissions.filter((p) => p.type === 'reseau_de_chaleur' || p.type === 'reseau_en_construction');
  if (networks.length > 0) {
    parts.push(`${networks.length} réseau${networks.length > 1 ? 'x' : ''}`);
  }

  const territories = permissions.filter((p) => p.type !== 'reseau_de_chaleur' && p.type !== 'reseau_en_construction');
  if (territories.length > 0) {
    const byType = new Map<string, PermissionWithLabel[]>();
    for (const p of territories) {
      const list = byType.get(p.type) ?? [];
      list.push(p);
      byType.set(p.type, list);
    }

    const shortLabels: Record<string, [string, string]> = {
      commune: ['commune', 'communes'],
      departement: ['dép.', 'dép.'],
      epci: ['EPCI', 'EPCI'],
      ept: ['EPT', 'EPT'],
      region: ['région', 'régions'],
    };

    for (const [type, perms] of byType) {
      if (perms.length === 1) {
        parts.push(perms[0].label);
      } else {
        const [, plural] = shortLabels[type] ?? [type, type];
        parts.push(`${perms.length} ${plural}`);
      }
    }
  }

  return parts.join(', ');
}

function PermissionTooltipContent({ permissions }: { permissions: PermissionWithLabel[] }) {
  const groups: [PermissionType, PermissionWithLabel[]][] = [];
  for (const p of permissions) {
    const existing = groups.find(([type]) => type === p.type);
    if (existing) {
      existing[1].push(p);
    } else {
      groups.push([p.type, [p]]);
    }
  }

  return (
    <div className="space-y-1.5">
      {groups.map(([type, perms]) => (
        <div key={type}>
          <div className="font-semibold">{permissionTypePluralLabels[type]}</div>
          <ul className="list-none pl-0 m-0">
            {perms.map((p) => (
              <li key={p.resource_id}>{p.label}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const startImpersonation = toastErrors(
  async (impersonateConfig: { role: UserRole; permissions?: Pick<Permission, 'type' | 'resource_id'>[] }) => {
    await postFetchJSON('/api/admin/impersonate', {
      role: impersonateConfig.role,
      ...(impersonateConfig.permissions?.length ? { permissions: impersonateConfig.permissions } : {}),
    });
    saveImpostureReturnPath();
    location.href = '/pro/tableau-de-bord';
  }
);

const initialSorting: SortingState = [{ desc: true, id: 'created_at' }];

const filters = [
  { getValue: (row: User) => row.role, id: 'role', label: 'Rôle', type: 'facets' },
  {
    formatOption: (key: string) => structureTypesLabels[key as keyof typeof structureTypesLabels] ?? key,
    getValue: (row: User) => row.structure_type || null,
    id: 'structure_type',
    label: 'Type de structure',
    type: 'facets',
  },
  { display: 'combobox', getValue: (row: User) => row.tags.map((tag) => tag.name), id: 'tags', label: 'Étiquettes', type: 'facets' },
  { getValue: (row: User) => row.receive_new_demands, id: 'receive_new_demands', label: 'Notif nouvelle demande', type: 'facets' },
  { getValue: (row: User) => row.receive_old_demands, id: 'receive_old_demands', label: 'Notif relance', type: 'facets' },
  { getValue: (row: User) => row.last_connection, id: 'last_connection', label: 'Dernière activité', type: 'dateRange' },
  { getValue: (row: User) => row.active, id: 'active', label: 'Activé', type: 'facets' },
  { getValue: (row: User) => row.created_at, id: 'created_at', label: 'Créé le', type: 'dateRange' },
  { getValue: (row: User) => !!row.from_organization_id, id: 'from_organization_id', label: 'Créé via API', type: 'facets' },
] as const satisfies readonly FilterDef<User>[];

const initialFilters: FilterValuesOf<User, typeof filters> = { active: ['true'] };

const getRowId = (row: User) => row.id;

export default function ManageUsers() {
  const [userId, setUserId] = useQueryState('userId');
  const bulkTag = useDialogState();
  const deleteDialog = useDialogState<User>();

  const { data: usersStats } = useFetch<AdminUsersStats>('/api/admin/users-stats');

  const {
    items: users,
    isLoading,
    refetch: refetchUsers,
    create: createUser,
    update: updateUser,
    delete: deleteUser,
    isUpdatingId: updatingUserId,
    isCreating: creatingUser,
    isDeletingId: deletingUserId,
  } = useCrud<UsersResponse, User[]>('/api/admin/users');

  const setPermissions = trpc.permissions.admin.setForUser.useMutation({
    onSuccess: () => {
      void refetchUsers();
    },
  });

  const setUserTags = trpc.users.adminTags.setForUser.useMutation({
    onSuccess: () => {
      void refetchUsers();
    },
  });

  const handleUpdateUser = useCallback(
    (userId: string) =>
      toastErrors(async (userUpdate: UsersResponse['updateInput']) => {
        await updateUser(userId, userUpdate);
        if (userId) {
          void setUserId(null);
        }
        notify('success', 'Utilisateur mis à jour');
      }),
    [updateUser, setUserId]
  );

  const handleCreateUser = toastErrors(async (userCreate: UsersResponse['createInput'], permissions?: Permission[], tagIds?: string[]) => {
    const result = await createUser(userCreate);
    const newUserId = result?.item?.id;
    if (newUserId && permissions && permissions.length > 0) {
      await setPermissions.mutateAsync({ permissions, userId: newUserId });
    }
    if (newUserId && tagIds && tagIds.length > 0) {
      await setUserTags.mutateAsync({ tagIds, userId: newUserId });
    }
    void setUserId(null);
    notify('success', 'Utilisateur créé');
  });

  const columns = useMemo<DataTableColumn<User>[]>(
    () => [
      {
        accessorKey: 'email',
        cell: ({ row, value }) => (
          <div className="leading-tight">
            <div className="truncate" title={value}>
              {value}
              {!!row.from_organization_id && <Badge type="api_user" className="ml-1 inline-block!" />}
              {!row.active && (
                <DsfrBadge noIcon severity="warning" small className="ml-1">
                  Désactivé
                </DsfrBadge>
              )}
            </div>
            {(row.first_name || row.last_name) && (
              <div className="text-sm text-faded font-bold truncate">{[row.first_name, row.last_name].filter(Boolean).join(' ')}</div>
            )}
          </div>
        ),
        header: 'Email',
        width: '22%',
      },
      {
        accessorKey: 'role',
        align: 'center',
        cell: ({ row, value }) => {
          const content = (
            <div className="flex flex-col items-center gap-1">
              <UserRoleBadge role={value} />
              {row.permissions.length > 0 && (
                <span className="text-xs text-faded truncate max-w-full">{formatPermissionSummary(row.permissions)}</span>
              )}
            </div>
          );

          return row.permissions.length > 0 ? (
            <Tooltip title={<PermissionTooltipContent permissions={row.permissions} />}>
              <div className="cursor-help">{content}</div>
            </Tooltip>
          ) : (
            content
          );
        },
        header: 'Rôle',
        width: '12%',
      },
      {
        accessorFn: (row) => row.structure_type || null,
        cell: ({ value }) => (value ? structureTypesLabels[value as keyof typeof structureTypesLabels] : null),
        header: 'Type de structure',
        id: 'structure_type',
        width: '12%',
      },
      {
        accessorFn: (row) => row.tags.map((tag) => tag.name),
        cell: ({ row }) =>
          row.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 justify-center">
              {row.tags.map((tag) => (
                <UserTagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          ) : null,
        export: { value: (row) => row.tags.map((tag) => tag.name).join(', ') },
        header: 'Étiquettes',
        id: 'tags',
        sortValue: (row) => row.tags.map((tag) => tag.name).join(', '),
        width: '13%',
      },
      { accessorKey: 'receive_new_demands', align: 'center', cell: cells.boolean(), header: 'Notif nouvelle demande' },
      { accessorKey: 'receive_old_demands', align: 'center', cell: cells.boolean(), header: 'Notif relance' },
      { accessorKey: 'last_connection', cell: cells.dateTime(), header: 'Dernière activité' },
      { accessorKey: 'created_at', cell: cells.date(), header: 'Créé le' },
      {
        align: 'right',
        cell: ({ row }) => {
          const menuItems: HamburgerMenuItem[] = [
            {
              icon: 'ri-edit-line',
              id: 'edit',
              label: "Modifier l'utilisateur",
              onClick: () => setUserId(row.id),
            },
            {
              href: `/admin/events?authorIds=${row.id}`,
              icon: 'ri-history-line',
              id: 'history',
              label: "Voir l'historique des événements",
            },
            {
              icon: 'ri-spy-line',
              id: 'impersonate',
              label: 'Adopter le profil',
              onClick: () =>
                startImpersonation({
                  permissions: row.permissions?.map(({ resource_id, type }) => ({ resource_id, type })),
                  role: row.role,
                }),
            },
            {
              icon: row.active ? 'ri-delete-back-2-line' : 'ri-refresh-line',
              id: '',
              label: row.active ? "Désactiver l'utilisateur" : "Réactiver l'utilisateur",
              onClick: () => {
                void handleUpdateUser(row.id)({ active: !row.active });
              },
              variant: row.active ? 'destructive' : undefined,
            },
            {
              disabled: deletingUserId === row.id,
              icon: 'ri-delete-bin-line',
              id: 'delete',
              label: "Supprimer l'utilisateur",
              onClick: () => deleteDialog.open(row),
              variant: 'destructive',
            },
          ];

          return <HamburgerMenu items={menuItems} />;
        },
        export: false,
        header: 'Actions',
        id: 'actions',
        width: 50,
      },
    ],
    [setUserId, handleUpdateUser, deleteDialog.open, deletingUserId]
  );

  const table = useDataTable({
    columns,
    data: users ?? emptyUsers,
    filters,
    getRowId,
    initialFilters,
    initialSorting,
    urlKey: 'users',
  });

  const editingUser = useMemo(() => users?.find((u) => u.id === (userId as string)), [users, userId]);

  return (
    <SimplePage title="Gestion des utilisateurs" mode="authenticated">
      <Dialog
        open={!!userId}
        onOpenChange={(open) => {
          if (!open) {
            void setUserId(null);
            // Tag edits happen live (outside the form submit) without touching the users list
            // query — refresh it once here so the table reflects any tag changes made in the dialog.
            void refetchUsers();
          }
        }}
        title={editingUser ? 'Modifier un utilisateur' : 'Créer un utilisateur'}
      >
        {isLoading ? (
          <Loader size="lg" variant="section" />
        ) : editingUser ? (
          <UserForm loading={!!updatingUserId} onSubmit={handleUpdateUser(userId as string)} user={editingUser} />
        ) : userId === 'new' ? (
          <UserForm loading={creatingUser} onSubmit={handleCreateUser} />
        ) : (
          <span>Utilisateur non trouvé</span>
        )}
      </Dialog>
      <BulkTagDialog control={bulkTag} onSuccess={() => void refetchUsers()} />
      <ConfirmDialog
        control={deleteDialog}
        title="Supprimer l'utilisateur"
        confirmLabel="Supprimer"
        danger
        onConfirm={async (user) => {
          await deleteUser(user.id);
          notify('success', 'Utilisateur supprimé avec succès');
        }}
      >
        Voulez-vous vraiment supprimer <strong>{deleteDialog.data?.email}</strong> et toutes ses données associées ? Cette action est
        irréversible et supprimera :
        <ul className="mt-2 mb-0">
          <li>les tests d'éligibilité et leurs adresses</li>
          <li>les configurations du comparateur</li>
          <li>les jobs associés</li>
          <li>les templates d'email créés</li>
          <li>les événements créés</li>
        </ul>
      </ConfirmDialog>
      <Box py="4w" className="fr-container">
        <Heading as="h1" color="blue-france">
          Gestion des utilisateurs
        </Heading>

        <Heading as="h2" color="blue-france">
          Statistiques d'activité
        </Heading>
        {usersStats && (
          <>
            <Text>Utilisateurs (excepté administrateurs) actifs au cours :</Text>
            <Box>- des 3 dernières heures : {usersStats.last3h}</Box>
            <Box>- des 24 dernières heures : {usersStats.last24h}</Box>
            <Box>- des 7 derniers jours : {usersStats.last7d}</Box>
          </>
        )}

        <header className="flex justify-between items-baseline">
          <Heading as="h2" color="blue-france" mt="4w">
            Liste des comptes{' '}
            <small className="text-faded text-base">
              {table.rows.length} / {users?.length}
            </small>
          </Heading>
          <div className="flex gap-2">
            <Button size="small" priority="tertiary" iconId="ri-price-tag-3-line" onClick={() => bulkTag.open()}>
              <span>Étiqueter en masse</span>
            </Button>
            <Button size="small" priority="secondary" iconId="ri-add-line" title="Ajouter un utilisateur" onClick={() => setUserId('new')}>
              <span>Ajouter un utilisateur</span>
            </Button>
          </div>
        </header>
        <DataTable
          table={table}
          loading={isLoading}
          rowHeight="md"
          exportConfig={{
            fileName: 'utilisateurs.xlsx',
            sheetName: 'utilisateurs',
          }}
        />
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
