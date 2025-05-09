import { useEffect, useMemo, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import AsyncButton from '@/components/ui/AsyncButton';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import { type ColumnDef, Table } from '@/components/ui/Table';
import { type AdminManageUserItem } from '@/pages/api/admin/users';
import { useServices } from '@/services';

import { TableContainer } from './Users.styles';

const columns: ColumnDef<AdminManageUserItem>[] = [
  {
    field: 'email',
    renderHeader: () => 'Email',
    flex: 2,
  },
  {
    field: 'last_connection',
    flex: 1,
    renderHeader: () => 'Dernière connexion',
    renderCell: ({ row: { last_connection } }) => (
      <>
        {last_connection
          ? new Date(last_connection).toLocaleDateString('fr-FR', {
              dateStyle: 'long',
            })
          : ''}
      </>
    ),
  },
];

const Users = () => {
  const { adminService, exportService } = useServices();

  const [users, setUsers] = useState<AdminManageUserItem[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    adminService.getUsers().then(setUsers);
  }, [adminService]);

  const filteredUsers = useMemo(() => {
    return filter ? users.filter((user) => user.email.includes(filter.toLowerCase())) : users;
  }, [users, filter]);

  return (
    <TableContainer small>
      <Box display="flex">
        <Heading as="h3" mx="2w">
          Connexions
        </Heading>

        <Input
          label=""
          nativeInputProps={{
            placeholder: 'Email',
            value: filter,
            onChange: (e) => setFilter(e.target.value),
          }}
        />
      </Box>
      <Table columns={columns} rows={filteredUsers} getRowId={(row) => row.email} autoHeight autosizeOnMount disableRowSelectionOnClick />
      {filteredUsers.length === 0 && <p>Pas de résultat</p>}

      <Box mt="3w">
        <AsyncButton onClick={async () => exportService.exportXLSX('obsoleteUsers')}>
          Exporter la liste des comptes obsolètes (connexion de plus de 6 mois ou nulle)
        </AsyncButton>
      </Box>
    </TableContainer>
  );
};

export default Users;
