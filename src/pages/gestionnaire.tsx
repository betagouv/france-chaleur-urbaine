import Manager from '@components/Manager/Manager';
import SimplePage from '@components/shared/page/SimplePage';
import { GetServerSideProps } from 'next';
import { getSession, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function Gestionnaire(): JSX.Element {
  const { data: session } = useSession();
  useEffect(() => {
    if (session && !session.user.gestionnaires) {
      signOut();
    }
  }, [session]);

  return (
    <SimplePage
      title="France Chaleur Urbaine - Espace gestionnaire"
      mode="authenticated"
    >
      <Manager />
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

  return { props: {} };
};
