import { Table } from '@dataesr/react-dsfr';
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

  useEffect(() => {
    adminService.getUsers().then(setUsers);
  }, [adminService]);
  if (users.length === 0) {
    return null;
  }

  return (
    <TableContainer>
      <Table
        caption="Connexion"
        columns={columns}
        data={users}
        rowKey="email"
        pagination
        paginationPosition="center"
      />
    </TableContainer>
  );
};

export default Users;
