import { Table, TextInput } from '@dataesr/react-dsfr';
import { useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { UserResponse } from 'src/types/UserResponse';
import { TableContainer } from './Users.styles';

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
  const [filteredUsers, setFilteredUsers] = useState<UserResponse[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    adminService.getUsers().then(setUsers);
  }, [adminService]);

  useEffect(() => {
    if (filter) {
      setFilteredUsers(
        users.filter((user) => user.email.includes(filter.toLowerCase()))
      );
    } else {
      setFilteredUsers(users);
    }
  }, [users, filter]);

  return (
    <TableContainer small>
      <Table
        caption="Connexion"
        columns={columns}
        data={filteredUsers}
        rowKey="email"
        pagination
        paginationPosition="center"
      />
      {filteredUsers.length === 0 && <p>Pas de résultat</p>}
      <TextInput
        placeholder="Email"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
    </TableContainer>
  );
};

export default Users;
