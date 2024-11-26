import { GetServerSideProps } from 'next';
import { signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

import Manager from '@components/Manager/Manager';
import SimplePage from '@components/shared/page/SimplePage';
import { withAuthentication } from '@helpers/ssr/withAuthentication';

export default function Gestionnaire(): JSX.Element {
  const { data: session } = useSession();
  useEffect(() => {
    if (session && !session.user.gestionnaires) {
      signOut();
    }
  }, [session]);

  return (
    <SimplePage title="France Chaleur Urbaine - Espace gestionnaire" mode="authenticated">
      <Manager />
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps = withAuthentication();
