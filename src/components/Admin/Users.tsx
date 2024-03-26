import { Button, Table, TextInput } from '@codegouvfr/react-dsfr';
import { useEffect, useMemo, useState } from 'react';
import { useServices } from 'src/services';
import { UserResponse } from 'src/types/UserResponse';
import { TableContainer } from './Users.styles';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import { Oval } from 'react-loader-spinner';

const columns = [
  {
    name: 'email',
    label: 'Email',
  },
  {
    name: 'last_connection',
    label: 'Dernière connexion',
    render: ({ last_connection }: UserResponse) => (
      <>
        {last_connection ? new Date(last_connection).toLocaleDateString() : ''}
      </>
    ),
  },
];

const Users = () => {
  const { adminService } = useServices();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    adminService.getUsers().then(setUsers);
  }, [adminService]);

  const filteredUsers = useMemo(() => {
    setPage(1);
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

        <TextInput
          placeholder="Email"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </Box>

      <Table
        columns={columns}
        data={filteredUsers}
        rowKey="email"
        pagination
        paginationPosition="center"
        page={page}
        setPage={setPage}
      />
      {filteredUsers.length === 0 && <p>Pas de résultat</p>}
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
    </TableContainer>
  );
};

export default Users;
