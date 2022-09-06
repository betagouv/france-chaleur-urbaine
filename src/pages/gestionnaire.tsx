import Manager from '@components/Manager/Manager';
import MainContainer from '@components/shared/layout';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';

export default function Gestionnaire(): JSX.Element {
  return (
    <>
      <Head>
        <title>France Chaleur Urbaine - Espace gestionnaire</title>
      </Head>
      <MainContainer currentMenu="/gestionnaire">
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
