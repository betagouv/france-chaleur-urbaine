import { Button } from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useEffect, useMemo, useState } from 'react';
import { useServices } from 'src/services';
import { type UserResponse } from 'src/types/UserResponse';
import { TableContainer } from './Users.styles';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import { Oval } from 'react-loader-spinner';
import Table, { type TableColumnDef } from '@components/ui/Table';

const columns: TableColumnDef<UserResponse>[] = [
  {
    key: 'email',
    label: 'Email',
  },
  {
    key: 'last_connection',
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

        <Input
          label="Email"
          nativeInputProps={{
            placeholder: 'Email',
            value: filter,
            onChange: (e) => setFilter(e.target.value),
          }}
        />
      </Box>

      <Table
        columns={columns}
        data={filteredUsers}
        // rowKey="email"
        // pagination
        // paginationPosition="center"
        // page={page}
        // setPage={setPage}
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
