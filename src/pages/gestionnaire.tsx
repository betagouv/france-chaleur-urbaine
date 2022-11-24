import Manager from '@components/Manager/Manager';
import MainContainer from '@components/shared/layout';
import { GetServerSideProps } from 'next';
import { getSession, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useEffect } from 'react';

export default function Gestionnaire(): JSX.Element {
  const { data: session } = useSession();
  useEffect(() => {
    if (session && !session.user.gestionnaires) {
      signOut();
    }
  }, [session]);

  return (
    <>
      <Head>
        <title>France Chaleur Urbaine - Espace gestionnaire</title>
      </Head>
      <MainContainer currentMenu="/gestionnaire" fullscreen>
        <Manager />
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

  return { props: {} };
};
