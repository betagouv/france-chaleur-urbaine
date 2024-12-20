import { useQuery } from '@tanstack/react-query';
import { type SortingState, type ColumnDef } from '@tanstack/react-table';
import { type GetServerSideProps } from 'next';

import AccountCreationForm from '@/components/Admin/AccountCreationForm';
import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import SimpleTable, { tableBooleanFormatter, tableCellFormatter } from '@/components/ui/SimpleTable';
import Text from '@/components/ui/Text';
import { withAuthentication } from '@/server/helpers/ssr/withAuthentication';
import { useServices } from '@/services';
import { type UserRole } from '@/types/enum/UserRole';
import { fetchJSON } from '@/utils/network';
import { frenchCollator } from '@/utils/strings';

import { type AdminManageUserItem } from '../api/admin/users';
import { type AdminUsersStats } from '../api/admin/users-stats';

const columns: ColumnDef<AdminManageUserItem>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    sortingFn: (rowA, rowB) => frenchCollator.compare(rowA.original.email, rowB.original.email),
    size: 250,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: (info) => <UserRoleBadge role={info.getValue<UserRole>()} />,
  },
  {
    accessorKey: 'gestionnaires',
    id: 'gestionnaires',
    header: 'Tags gestionnaire',
    cell: (info) => info.getValue<string[]>().join(', '),
    sortingFn: (rowA, rowB) => frenchCollator.compare(rowA.original.gestionnaires?.[0] ?? '', rowB.original.gestionnaires?.[0] ?? ''),
    size: 300,
  },
  {
    accessorKey: 'from_api',
    header: "Reçu de l'API",
    cell: tableBooleanFormatter,
    size: 60,
  },
  {
    accessorKey: 'last_connection',
    header: 'Dernière activité',
    cell: tableCellFormatter,
    size: 110,
  },
  {
    accessorKey: 'active',
    header: 'Actif',
    cell: tableBooleanFormatter,
    size: 60,
  },
  {
    accessorKey: 'created_at',
    header: 'Créé le',
    cell: tableCellFormatter,
    size: 110,
  },
  {
    accessorKey: '_id',
    header: '',
    cell: (info) => (
      <Button
        size="small"
        priority="tertiary"
        iconId="fr-icon-delete-bin-line"
        title="Supprimer l'utilisateur"
        onClick={() => alert(`${info.row.original.id}`)}
      />
    ),
    size: 64,
  },
];

const initialSortingState: SortingState = [
  {
    id: 'created_at',
    desc: true,
  },
];

export default function ManageUsers() {
  const { exportService } = useServices();

  const { data: usersStats } = useQuery({
    queryKey: ['admin/users-stats'],
    queryFn: () => fetchJSON<AdminUsersStats>('/api/admin/users-stats'),
  });
  const { data: users } = useQuery({
    queryKey: ['admin/users'],
    queryFn: () => fetchJSON<AdminManageUserItem[]>('/api/admin/users'),
  });

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
        {users && <SimpleTable columns={columns} data={users} initialSortingState={initialSortingState} />}
        <AsyncButton size="small" onClick={async () => exportService.exportXLSX('obsoleteUsers')}>
          Exporter la liste des comptes obsolètes (connexion de plus de 6 mois ou nulle)
        </AsyncButton>

        <Heading as="h2" color="blue-france" mt="4w">
          Créer un compte
        </Heading>
        <AccountCreationForm />
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps = withAuthentication('admin');
