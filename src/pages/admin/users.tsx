import { type SortingState } from '@tanstack/react-table';
import { useState } from 'react';

import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import Tag from '@/components/Manager/Tag';
import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Heading from '@/components/ui/Heading';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import Text from '@/components/ui/Text';
import { useFetch } from '@/hooks/useApi';
import { withAuthentication } from '@/server/authentication';
import { useServices } from '@/services';
import { toastErrors } from '@/services/notification';
import { type UserRole } from '@/types/enum/UserRole';
import { postFetchJSON } from '@/utils/network';
import { compareFrenchStrings } from '@/utils/strings';

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
  const [selectedUser, setSelectedUser] = useState<AdminManageUserItem | null>(null);

  const { data: usersStats } = useFetch<AdminUsersStats>('/api/admin/users-stats');
  const { data: users, isLoading } = useFetch<AdminManageUserItem[]>('/api/admin/users');

  const buildTableColumns = (setSelectedUser: (user: AdminManageUserItem) => void): ColumnDef<AdminManageUserItem>[] => [
    {
      accessorKey: 'email',
      header: 'Email',
      sortingFn: (rowA, rowB) => compareFrenchStrings(rowA.original.email, rowB.original.email),
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
      accessorKey: 'gestionnaires',
      id: 'gestionnaires',
      header: 'Tags gestionnaire',
      flex: 3,
      cell: (info) => (
        <div className="flex flex-wrap gap-1">
          {info.getValue<string[]>().map((tag) => (
            <Tag key={tag} text={tag} />
          ))}
        </div>
      ),
      sortingFn: (rowA, rowB) => compareFrenchStrings(rowA.original.gestionnaires?.[0], rowB.original.gestionnaires?.[0]),
    },
    {
      accessorKey: 'optin_at',
      header: 'Newsletter',
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
        <div className="flex gap-2">
          <Button
            size="small"
            priority="tertiary"
            iconId="ri-edit-line"
            title="Modifier les informations de l'utilisateur"
            onClick={() => setSelectedUser(row.original)}
          />
          <Button
            size="small"
            priority="tertiary"
            iconId="ri-spy-line"
            title="Permet d'adopter temporairement le même profil (rôle et tags gestionnaires) que cet utilisateur sans usurper son identité."
            onClick={() => startImpersonation(row.original)}
          />
        </div>
      ),
      width: '120px',
    },
  ];

  return (
    <SimplePage title="Gestion des utilisateurs" mode="authenticated">
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
          columns={buildTableColumns(setSelectedUser)}
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

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)} title="Modifier l'utilisateur" size="md">
        {selectedUser && (
          // FIXME formulaire complet
          <div className="flex flex-col gap-4">
            <div>TODO formulaire complet à faire</div>
            <div>
              <Text className="font-bold">Email</Text>
              <Text>{selectedUser.email}</Text>
            </div>
            <div>
              <Text className="font-bold">Rôle</Text>
              <UserRoleBadge role={selectedUser.role} />
            </div>
            <div>
              <Text className="font-bold">Tags gestionnaire</Text>
              <div className="flex flex-wrap gap-1">{selectedUser.gestionnaires?.map((tag) => <Tag key={tag} text={tag} />)}</div>
            </div>
            <div>
              <Text className="font-bold">Statut</Text>
              <Text>{selectedUser.active ? 'Actif' : 'Inactif'}</Text>
            </div>
            <div>
              <Text className="font-bold">Newsletter</Text>
              <Text>{selectedUser.optin_at ? 'Inscrit' : 'Non inscrit'}</Text>
            </div>
            <div>
              <Text className="font-bold">Dernière connexion</Text>
              <Text>{selectedUser.last_connection ? new Date(selectedUser.last_connection).toLocaleString() : 'Jamais'}</Text>
            </div>
            <div>
              <Text className="font-bold">Créé le</Text>
              <Text>{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'Non défini'}</Text>
            </div>
          </div>
        )}
      </Dialog>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
