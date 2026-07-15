import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import dynamic from 'next/dynamic';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

import UserForm from '@/components/Admin/UserForm';
import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import SimplePage from '@/components/shared/page/SimplePage';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import HamburgerMenu, { type HamburgerMenuItem } from '@/components/ui/HamburgerMenu';
import Heading from '@/components/ui/Heading';
import Loader from '@/components/ui/Loader';
import Text from '@/components/ui/Text';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import { useFetch } from '@/hooks/useApi';
import useCrud from '@/hooks/useCrud';
import { useDialogState } from '@/hooks/useDialogState';
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
import { compareFrenchStrings } from '@/utils/strings';

import type { AdminUsersStats } from '../api/admin/users-stats';

const ButtonExport = dynamic(() => import('@/components/ui/ButtonExport'), { ssr: false });

const permissionTypePluralLabels: Record<PermissionType, string> = {
  commune: 'Communes',
  departement: 'Départements',
  epci: 'EPCI',
  ept: 'EPT',
  national: 'National',
  organization: 'Organisations',
  region: 'Régions',
  reseau_de_chaleur: 'Réseaux existants',
  reseau_en_construction: 'Réseaux en construction',
};

function formatPermissionSummary(permissions: PermissionWithLabel[]): string {
  if (permissions.some((p) => p.type === 'national')) return 'National';

  const parts: string[] = [];

  const networks = permissions.filter((p) => p.type === 'reseau_de_chaleur' || p.type === 'reseau_en_construction');
  if (networks.length > 0) {
    parts.push(`${networks.length} réseau${networks.length > 1 ? 'x' : ''}`);
  }

  const territories = permissions.filter(
    (p) => p.type !== 'reseau_de_chaleur' && p.type !== 'reseau_en_construction' && p.type !== 'national'
  );
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
          {type !== 'national' && (
            <ul className="list-none pl-0 m-0">
              {perms.map((p) => (
                <li key={p.resource_id}>{p.label}</li>
              ))}
            </ul>
          )}
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

const initialSortingState: SortingState = [
  {
    desc: true,
    id: 'created_at',
  },
];

const initialColumnFilters: ColumnFiltersState = [
  {
    id: 'active',
    value: { false: false, true: true },
  },
];

export default function ManageUsers() {
  const [userId, setUserId] = useQueryState('userId');
  const [nbUsersFilter, setNbUsersFilter] = useState<number>(0);
  const bulkTag = useDialogState();

  const { data: usersStats } = useFetch<AdminUsersStats>('/api/admin/users-stats');

  const { data: tagCatalog } = trpc.users.adminTags.list.useQuery();
  // key = name (not id) so the column filter and the table's global search both match the visible tag name.
  const tagOptions = useMemo(() => (tagCatalog ?? []).map((tag) => ({ key: tag.name, label: tag.name })), [tagCatalog]);

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

  const handleUpdateUser = (userId: string) =>
    toastErrors(async (userUpdate: UsersResponse['updateInput']) => {
      await updateUser(userId, userUpdate);
      if (userId) {
        void setUserId(null);
      }
      notify('success', 'Utilisateur mis à jour');
    });

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

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: 'email',
        cell: (info) => (
          <div>
            <div>
              {info.getValue<string>()}
              {!!info.row.original.from_organization_id && <Badge type="api_user" className="mt-1" />}
            </div>
            {(info.row.original.first_name || info.row.original.last_name) && (
              <div className="text-sm text-faded font-bold">
                {[info.row.original.first_name, info.row.original.last_name].filter(Boolean).join(' ')}
              </div>
            )}
          </div>
        ),
        className: 'break-words break-all',
        flex: 2.5,
        header: 'Email',
        sortingFn: (rowA, rowB) => compareFrenchStrings(rowA.original.email, rowB.original.email),
      },
      {
        accessorKey: 'role',
        align: 'center',
        cell: (info) => {
          const role = info.getValue<UserRole>();
          const perms = info.row.original.permissions;

          const content = (
            <div className="flex flex-col items-center gap-1">
              <UserRoleBadge role={role} />
              {perms.length > 0 && <span className="text-xs text-faded">{formatPermissionSummary(perms)}</span>}
            </div>
          );

          return perms.length > 0 ? (
            <Tooltip title={<PermissionTooltipContent permissions={perms} />}>
              <div className="cursor-help">{content}</div>
            </Tooltip>
          ) : (
            content
          );
        },
        filterType: 'Facets',
        flex: 1.6,
        header: 'Role',
      },
      {
        accessorFn: (row) => row.structure_type || null,
        cell: (info) => info.getValue() && structureTypesLabels[info.getValue<keyof typeof structureTypesLabels>()],
        filterProps: {
          Component: ({ value }) => <>{structureTypesLabels[value as keyof typeof structureTypesLabels] ?? value}</>,
        },
        filterType: 'Facets',
        flex: 1.4,
        header: 'Type de structure',
        id: 'structure_type',
      },
      {
        accessorFn: (row) => row.tags.map((tag) => tag.name),
        cell: (info) =>
          info.row.original.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 justify-center">
              {info.row.original.tags.map((tag) => (
                <UserTagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          ) : null,
        exportFn: (row) => row.tags.map((tag) => tag.name).join(', '),
        filterProps: { options: tagOptions, placeholder: 'Filtrer par étiquette' },
        filterType: 'ComboBox',
        flex: 1.5,
        header: 'Étiquettes',
        id: 'tags',
        sortingFn: (rowA, rowB) =>
          compareFrenchStrings(rowA.original.tags.map((tag) => tag.name).join(', '), rowB.original.tags.map((tag) => tag.name).join(', ')),
      },
      {
        accessorKey: 'receive_new_demands',
        align: 'center',
        cellType: 'Boolean',
        filterType: 'Facets',
        header: 'Notif nouvelle demande',
      },
      {
        accessorKey: 'receive_old_demands',
        align: 'center',
        cellType: 'Boolean',
        filterType: 'Facets',
        header: 'Notif relance',
      },
      {
        accessorKey: 'last_connection',
        cellType: 'DateTime',
        filterType: 'Range',
        header: 'Dernière activité',
      },
      {
        accessorKey: 'active',
        align: 'center',
        cellType: 'Boolean',
        filterType: 'Facets',
        header: 'Activé',
      },
      {
        accessorKey: 'created_at',
        cellType: 'Date',
        filterType: 'Range',
        header: 'Créé le',
      },
      {
        accessorFn: (row) => !!row.from_organization_id,
        cellType: 'Boolean',
        filtersDialogLabel: 'Créé via API',
        filterType: 'Facets',
        header: 'Créé via API',
        id: 'from_organization_id',
        visible: false,
      },
      {
        align: 'right',
        cell: ({ row }) => {
          const menuItems: HamburgerMenuItem[] = [
            {
              icon: 'ri-edit-line',
              id: 'edit',
              label: "Modifier l'utilisateur",
              onClick: () => setUserId(row.original.id),
            },
            {
              href: `/admin/events?authorIds=${row.original.id}`,
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
                  permissions: row.original.permissions?.map(({ resource_id, type }) => ({ resource_id, type })),
                  role: row.original.role,
                }),
            },
            {
              icon: row.original.active ? 'ri-delete-back-2-line' : 'ri-refresh-line',
              id: '',
              label: row.original.active ? "Désactiver l'utilisateur" : "Réactiver l'utilisateur",
              onClick: () => {
                void handleUpdateUser(row.original.id)({ active: !row.original.active });
              },
              variant: row.original.active ? 'destructive' : undefined,
            },
            {
              disabled: deletingUserId === row.original.id,
              icon: 'ri-delete-bin-line',
              id: 'delete',
              label: "Supprimer l'utilisateur",
              onClick: () => {
                if (
                  window.confirm(
                    `Voulez-vous vraiment supprimer cet utilisateur et toutes ses données associées ? Cette action est irréversible et supprimera :
- Les tests d'éligibilité et leurs adresses
- Les configurations du comparateur
- Les jobs associés
- Les templates d'email créés
- Les événements créés`
                  )
                ) {
                  void toastErrors(async () => {
                    await deleteUser(row.original.id);
                    notify('success', 'Utilisateur supprimé avec succès');
                  })();
                }
              },
              variant: 'destructive',
            },
          ];

          return <HamburgerMenu items={menuItems} />;
        },
        header: 'Actions',
        id: 'actions',
        width: '50px',
      },
    ],
    [tagOptions]
  );

  const editingUser = useMemo(() => users?.find((u) => u.id === (userId as string)), [users, userId]);

  const onFilterChange = useCallback(
    (filteredRows: typeof users) => {
      setNbUsersFilter(filteredRows.length);
    },
    [setNbUsersFilter]
  );

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
              {nbUsersFilter} / {users?.length}
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
        <TableSimple
          columns={columns}
          data={users || []}
          initialSortingState={initialSortingState}
          columnFilters={initialColumnFilters}
          onFilterChange={onFilterChange}
          enableGlobalFilter
          enableFiltersDialog
          export={{
            fileName: 'utilisateurs.xlsx',
            sheetName: 'utilisateurs',
          }}
          controlsLayout="block"
          padding="sm"
          loading={isLoading}
          urlSyncKey="users"
        />
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
