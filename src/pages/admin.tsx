import BulkEligibility from '@components/Admin/BulkEligibility';
import Users from '@components/Admin/Users';
import MainContainer from '@components/shared/layout';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { USER_ROLE } from 'src/types/enum/UserRole';

export default function Admin(): JSX.Element {
  return (
    <>
      <Head>
        <title>France Chaleur Urbaine - Admin</title>
      </Head>
      <MainContainer currentMenu="/admin" fullscreen>
        <Users />
        <BulkEligibility />
      </MainContainer>
    </>
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
