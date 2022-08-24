import DemandDetails from '@components/DemandDetails';
import MainContainer from '@components/shared/layout';
import Slice from '@components/Slice';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Gestionnaire(): JSX.Element {
  const router = useRouter();
  const { demandId } = router.query;

  return (
    <>
      <Head>
        <title>France Chaleur Urbaine - Espace gestionnaire</title>
      </Head>
      <MainContainer currentMenu="/demandes">
        <Slice padding={8}>
          <DemandDetails demandId={demandId as string} />
        </Slice>
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
