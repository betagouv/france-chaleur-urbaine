import { type ColumnFiltersState, type SortingState } from '@tanstack/react-table';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

import UserForm from '@/components/Admin/UserForm';
import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import FCUTagAutocomplete from '@/components/form/FCUTagAutocomplete';
import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import ModalSimple from '@/components/ui/ModalSimple';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import Text from '@/components/ui/Text';
import { useFetch } from '@/hooks/useApi';
import useCrud from '@/hooks/useCrud';
import { type UsersResponse } from '@/pages/api/admin/users/[[...slug]]';
import { withAuthentication } from '@/server/authentication';
import { useServices } from '@/services';
import { notify, toastErrors } from '@/services/notification';
import { type UserRole } from '@/types/enum/UserRole';
import { postFetchJSON } from '@/utils/network';
import { compareFrenchStrings } from '@/utils/strings';

import { type AdminUsersStats } from '../api/admin/users-stats';

const startImpersonation = toastErrors(async (impersonateConfig: { role: UserRole; gestionnaires?: string[] | null }) => {
  await postFetchJSON('/api/admin/impersonate', {
    role: impersonateConfig.role,
    ...(impersonateConfig.role === 'gestionnaire' && { gestionnaires: impersonateConfig.gestionnaires }),
  });
  // trigger a full reload
  location.href = '/pro/tableau-de-bord';
});

const initialSortingState: SortingState = [
  {
    id: 'created_at',
    desc: true,
  },
];

const initialColumnFilters: ColumnFiltersState = [
  {
    id: 'active',
    value: { true: true, false: false },
  },
];

export default function ManageUsers() {
  const { exportService } = useServices();
  const [userId, setUserId] = useQueryState('userId');
  const [nbUsersFilter, setNbUsersFilter] = useState<number>(0);

  const { data: usersStats } = useFetch<AdminUsersStats>('/api/admin/users-stats');

  const {
    items: users,
    isLoading,
    create: createUser,
    update: updateUser,
    isUpdatingId: updatingUserId,
    isCreating: creatingUser,
  } = useCrud<UsersResponse>('/api/admin/users');

  const handleUpdateUser = (userId: string) =>
    toastErrors(async (userUpdate: UsersResponse['updateInput']) => {
      await updateUser(userId, userUpdate);
      if (userId) {
        setUserId(null);
      }
      notify('success', 'Utilisateur mis à jour');
    });

  const handleCreateUser = toastErrors(async (userCreate: UsersResponse['createInput']) => {
    await createUser(userCreate);
    setUserId(null);
    notify('success', 'Utilisateur créé');
  });

  const columns: ColumnDef<UsersResponse['listItem']>[] = useMemo(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        sortingFn: (rowA, rowB) => compareFrenchStrings(rowA.original.email, rowB.original.email),
        cell: (info) => (
          <div>
            <div>
              {info.getValue<string>()}
              {!!info.row.original.from_api && <Badge type="api_user" className="mt-1" />}
            </div>
            {(info.row.original.first_name || info.row.original.last_name) && (
              <div className="text-sm text-faded font-bold">
                {[info.row.original.first_name, info.row.original.last_name].filter(Boolean).join(' ')}
              </div>
            )}
          </div>
        ),
        flex: 2.5,
        className: 'break-words break-all',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        align: 'center',
        flex: 1.5,
        cell: (info) => <UserRoleBadge role={info.getValue<UserRole>()} />,
        filterType: 'Facets',
      },
      {
        accessorFn: (row) => row.gestionnaires?.map((u) => u.toLowerCase()).join(' ') ?? '',
        id: 'gestionnaires',
        header: 'Tags gestionnaire',
        flex: 3,
        cell: (info) => {
          return (
            info.row.original.role === 'gestionnaire' && (
              <FCUTagAutocomplete
                undismissibles={info.row.original.gestionnaires_from_api ?? []}
                value={info.row.original.gestionnaires ?? []}
                onChange={(newGestionnaires: string[] /* TODO should be handled by typescript */) => {
                  handleUpdateUser(info.row.original.id)({ gestionnaires: newGestionnaires });
                }}
                multiple
              />
            )
          );
        },
        sortingFn: (rowA, rowB) => compareFrenchStrings(rowA.original.gestionnaires?.[0], rowB.original.gestionnaires?.[0]),
      },
      {
        accessorKey: 'receive_new_demands',
        header: 'Notif nouvelle demande',
        cellType: 'Boolean',
        align: 'center',
        filterType: 'Facets',
      },
      {
        accessorKey: 'receive_old_demands',
        header: 'Notif relance',
        cellType: 'Boolean',
        align: 'center',
        filterType: 'Facets',
      },
      {
        accessorKey: 'last_connection',
        header: 'Dernière activité',
        cellType: 'DateTime',
      },
      {
        accessorKey: 'active',
        header: 'Actif',
        cellType: 'Boolean',
        align: 'center',
        filterType: 'Facets',
      },
      {
        accessorKey: 'created_at',
        header: 'Créé le',
        cellType: 'Date',
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: ({ row }) => (
          <>
            <Button
              size="small"
              priority="tertiary"
              iconId="ri-edit-line"
              title="Modifier l'utilisateur"
              onClick={() => setUserId(row.original.id)}
            />
            <Button
              size="small"
              priority="tertiary"
              iconId="ri-history-line"
              title="Voir l'historique des événements"
              href={`/admin/events?authorId=${row.original.id}`}
            />
            <Button
              size="small"
              priority="tertiary"
              iconId="ri-spy-line"
              variant="info"
              title="Permet d'adopter temporairement le même profil (rôle et tags gestionnaires) que cet utilisateur sans usurper son identité."
              onClick={() => startImpersonation(row.original)}
            />
            <Button
              size="small"
              variant="destructive"
              priority="tertiary"
              iconId={row.original.active ? 'ri-delete-back-2-line' : 'ri-delete-bin-line'}
              title={row.original.active ? "Désactiver l'utilisateur" : "Supprimer l'utilisateur"}
              onClick={() => {
                if (row.original.active) {
                  handleUpdateUser(row.original.id)({ active: false });
                  return;
                }
                if (window.confirm('Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.')) {
                  alert("Cette fonctionnalité n'est pas encore implémentée, demandez à l'équipe technique");
                }
              }}
            />
          </>
        ),
        width: '110px',
      },
    ],
    []
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
      <ModalSimple
        open={!!userId}
        onOpenChange={() => setUserId(null)}
        title={editingUser ? 'Modifier un utilisateur' : 'Créer un utilisateur'}
        loading={isLoading}
      >
        {isLoading ? null : (
          <>
            {editingUser ? (
              <UserForm loading={!!updatingUserId} onSubmit={handleUpdateUser(userId as string)} user={editingUser} />
            ) : userId === 'new' ? (
              <UserForm loading={creatingUser} onSubmit={handleCreateUser} />
            ) : (
              <span>Utilisateur non trouvé</span>
            )}
          </>
        )}
      </ModalSimple>
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

        <header className="flex justify-between items-center">
          <div>
            <Heading as="h2" color="blue-france" mt="4w">
              Liste des comptes{' '}
              <small className="text-faded text-base">
                {nbUsersFilter} / {users?.length}
              </small>
            </Heading>
          </div>
          <Button size="small" priority="secondary" iconId="ri-add-line" title="Ajouter un utilisateur" onClick={() => setUserId('new')}>
            <span>Ajouter un utilisateur</span>
          </Button>
        </header>
        <TableSimple
          columns={columns}
          data={users || []}
          initialSortingState={initialSortingState}
          columnFilters={initialColumnFilters}
          onFilterChange={onFilterChange}
          enableGlobalFilter
          controlsLayout="block"
          padding="sm"
          loading={isLoading}
        />
        <AsyncButton size="small" onClick={async () => exportService.exportXLSX('obsoleteUsers')}>
          Exporter la liste des comptes obsolètes (connexion de plus de 6 mois ou nulle)
        </AsyncButton>
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
