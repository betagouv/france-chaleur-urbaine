import { GetServerSideProps } from 'next';
import { getSession, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

import Manager from '@components/Manager/Manager';
import SimplePage from '@components/shared/page/SimplePage';

export default function Gestionnaire(): JSX.Element {
  const { data: session } = useSession();
  useEffect(() => {
    if (session && !session.user.gestionnaires) {
      signOut();
    }
  }, [session]);

  return (
    <SimplePage
      title="Espace gestionnaire"
      description="Votre tableau de bord pour la gestion des demandes des réseaux de chaleur"
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
