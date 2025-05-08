import { type SortingState } from '@tanstack/react-table';

import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import Tag from '@/components/Manager/Tag';
import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
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

const columns: ColumnDef<AdminManageUserItem>[] = [
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
      <Button
        size="small"
        priority="tertiary"
        iconId="ri-spy-line"
        title="Permet d'adopter temporairement le même profil (rôle et tags gestionnaires) que cet utilisateur sans usurper son identité."
        onClick={() => startImpersonation(row.original)}
      />
    ),
    width: '70px',
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

  const { data: usersStats } = useFetch<AdminUsersStats>('/api/admin/users-stats');
  const { data: users, isLoading } = useFetch<AdminManageUserItem[]>('/api/admin/users');

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
