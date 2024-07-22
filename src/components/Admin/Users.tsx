import { Button } from '@codegouvfr/react-dsfr/Button';
import Input from '@components/form/Input';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import { Table, type ColumnDef } from '@components/ui/Table';
import { useEffect, useMemo, useState } from 'react';
import { Oval } from 'react-loader-spinner';
import { useServices } from 'src/services';
import { type UserResponse } from 'src/types/UserResponse';
import { TableContainer } from './Users.styles';

const columns: ColumnDef<UserResponse>[] = [
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
  const { adminService } = useServices();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [filter, setFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    adminService.getUsers().then(setUsers);
  }, [adminService]);

  const filteredUsers = useMemo(() => {
    return filter
      ? users.filter((user) => user.email.includes(filter.toLowerCase()))
      : users;
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
      <Table
        columns={columns}
        rows={filteredUsers}
        getRowId={(row) => row.email}
        autoHeight
        autosizeOnMount
        disableRowSelectionOnClick
      />
      {filteredUsers.length === 0 && <p>Pas de résultat</p>}

      <Box mt="3w">
        {exporting ? (
          <Oval height={40} width={40} />
        ) : (
          <Button
            onClick={() => {
              setExporting(true);
              adminService.exportObsoleteUsers().finally(() => {
                setExporting(false);
              });
            }}
          >
            Exporter la liste des comptes obsolètes (connexion de plus de 6 mois
            ou nulle)
          </Button>
        )}
      </Box>
    </TableContainer>
  );
};

export default Users;
