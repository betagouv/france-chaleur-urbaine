import UserImpersonation from '@components/Admin/UserImpersonation';
import Users from '@components/Admin/Users';
import SimplePage from '@components/shared/page/SimplePage';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { USER_ROLE } from 'src/types/enum/UserRole';

export default function AdminPage(): JSX.Element {
  return (
    <SimplePage title="France Chaleur Urbaine - Admin" mode="authenticated">
      <UserImpersonation />
      <Users />
      {/* <BulkEligibility /> */}
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userSession = await getSession(context);

  if (!userSession) {
    return {
      redirect: {
        destination: '/connexion',
        permanent: false,
      },
    };
  }

  if (userSession.user.role !== USER_ROLE.ADMIN) {
    return {
      redirect: {
        destination: '/gestionnaire',
        permanent: false,
      },
    };
  }

  return { props: {} };
};
