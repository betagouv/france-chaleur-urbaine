import { type SortingState } from '@tanstack/react-table';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

import UserForm from '@/components/Admin/UserForm';
import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import ChipAutoComplete from '@/components/ui/ChipAutoComplete';
import Heading from '@/components/ui/Heading';
import ModalSimple from '@/components/ui/ModalSimple';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import Text from '@/components/ui/Text';
import { useFetch, usePutId } from '@/hooks/useApi';
import { withAuthentication } from '@/server/authentication';
import { useServices } from '@/services';
import { notify, toastErrors } from '@/services/notification';
import { defaultTagChipOption, useFCUTags } from '@/services/tags';
import { type UserRole } from '@/types/enum/UserRole';
import { postFetchJSON } from '@/utils/network';
import { compareFrenchStrings } from '@/utils/strings';
import { type AdminUserFormData } from '@/validation/user';

import { type AdminManageUserItem } from '../api/admin/users';
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

export default function ManageUsers() {
  const { exportService } = useServices();
  const [userId, setUserId] = useQueryState('userId');

  const { data: usersStats } = useFetch<AdminUsersStats>('/api/admin/users-stats');
  const { data: users, isLoading } = useFetch<AdminManageUserItem[]>('/api/admin/users');
  const { mutateAsync: mutateUser, isLoading: isMutatingUser } = usePutId(({ id }) => `/api/admin/users/${id}`, {
    invalidate: ['/api/admin/users'],
  });
  const { tagsOptions } = useFCUTags();

  const updateUser = useCallback(
    toastErrors(async (userId: string, userUpdate: Partial<AdminUserFormData>) => {
      await mutateUser(userId, userUpdate);
      if (userId) {
        setUserId(null);
      }
      notify('success', 'Utilisateur mis à jour');
    }),
    [userId, setUserId]
  );

  const columns: ColumnDef<AdminManageUserItem>[] = useMemo(
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
        cell: (info) =>
          info.row.original.role === 'gestionnaire' && (
            <ChipAutoComplete
              options={tagsOptions}
              defaultOption={defaultTagChipOption}
              value={info.row.original.gestionnaires ?? []}
              onChange={(newGestionnaires) => {
                updateUser(info.row.original.id, {
                  gestionnaires: newGestionnaires,
                });
              }}
              multiple
            />
          ),
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
              iconId="ri-spy-line"
              variant="info"
              title="Permet d'adopter temporairement le même profil (rôle et tags gestionnaires) que cet utilisateur sans usurper son identité."
              onClick={() => startImpersonation(row.original)}
            />
          </>
        ),
        width: '80px',
      },
    ],
    [tagsOptions]
  );

  const editingUser = useMemo(() => users?.find((u) => u.id === userId), [users, userId]);

  return (
    <SimplePage title="Gestion des utilisateurs" mode="authenticated">
      <ModalSimple open={!!userId} onOpenChange={() => setUserId(null)} title="Modifier un utilisateur" loading={isLoading}>
        {isLoading ? null : (
          <>
            {editingUser ? (
              <UserForm loading={isMutatingUser} onSubmit={(data) => updateUser(userId as string, data)} user={editingUser} />
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

        <Heading as="h2" color="blue-france" mt="4w">
          Liste des comptes
        </Heading>
        <TableSimple
          columns={columns}
          data={users || []}
          initialSortingState={initialSortingState}
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
