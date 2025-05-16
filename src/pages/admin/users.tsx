import { type SortingState } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import UserRoleBadge from '@/components/Admin/UserRoleBadge';
import useForm from '@/components/form/react-form/useForm';
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
import { type UserRole, userRoles } from '@/types/enum/UserRole';
import { USER_ROLE } from '@/types/enum/UserRole';
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

export const zUpdateUserSchema = z.object({
  email: z.string().email('Email invalide'),
  role: z.enum(userRoles),
  gestionnaires: z.array(z.string()),
  active: z.boolean(),
});

export default function ManageUsers() {
  const { exportService } = useServices();
  const [selectedUser, setSelectedUser] = useState<AdminManageUserItem | null>(null);
  const [gestionnaireTags, setGestionnaireTags] = useState<string[]>([]);

  const { data: usersStats } = useFetch<AdminUsersStats>('/api/admin/users-stats');
  const { data: users, isLoading, refetch: refetchUsers } = useFetch<AdminManageUserItem[]>('/api/admin/users');
  const { data: tags } = useFetch<string[]>('/api/admin/tags-gestionnaires');

  useEffect(() => {
    if (tags) {
      setGestionnaireTags(tags);
    }
  }, [tags]);

  const form = useForm({
    defaultValues: selectedUser
      ? ({
          email: selectedUser.email,
          role: selectedUser.role,
          gestionnaires: selectedUser.gestionnaires ?? [],
          active: !!selectedUser.active,
        } satisfies z.infer<typeof zUpdateUserSchema>)
      : undefined,
    validators: {
      onChange: zUpdateUserSchema,
    },
    onSubmit: toastErrors(async ({ value }) => {
      if (!selectedUser) return;
      await postFetchJSON(`/api/admin/users/${selectedUser.id}`, value);
      setSelectedUser(null);
      refetchUsers();
    }),
  });

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
          <form.Form className="flex flex-col gap-4">
            <form.EmailInput name="email" label="Email" />
            <form.Select
              name="role"
              label="Rôle"
              options={[
                { label: 'Administrateur', value: USER_ROLE.ADMIN },
                { label: 'Gestionnaire', value: USER_ROLE.GESTIONNAIRE },
                { label: 'Particulier', value: USER_ROLE.PARTICULIER },
                { label: 'Professionnel', value: USER_ROLE.PROFESSIONNEL },
                { label: 'Démo', value: USER_ROLE.DEMO },
              ]}
            />
            <form.Checkboxes
              name="gestionnaires"
              label="Tags gestionnaire"
              options={gestionnaireTags.map((tag) => ({
                label: tag,
                value: tag,
              }))}
            />
            <form.Checkbox name="active" label="Compte actif" />
            <div className="flex justify-end gap-2">
              <Button priority="secondary" onClick={() => setSelectedUser(null)}>
                Annuler
              </Button>
              <form.Submit>Enregistrer</form.Submit>
            </div>
          </form.Form>
        )}
      </Dialog>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
