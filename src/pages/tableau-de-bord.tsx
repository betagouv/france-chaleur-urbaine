import { type GetServerSideProps } from 'next';
import { type User } from 'next-auth';
import { getSession } from 'next-auth/react';

import DashboardAdmin from '@/components/dashboard/DashboardAdmin';
import DashboardGestionnaire from '@/components/dashboard/DashboardGestionnaire';
import DashboardProfessionnel from '@/components/dashboard/DashboardProfessionnel';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import { USER_ROLE } from '@/types/enum/UserRole';

type DashboardPageProps = {
  user: User;
};

export default function DashboardPage({ user }: DashboardPageProps) {
  return (
    <SimplePage title="Tableau de bord" mode="authenticated">
      <Box as="main" className="fr-container" my="4w">
        {user.role === USER_ROLE.ADMIN && <DashboardAdmin />}
        {user.role === USER_ROLE.PROFESSIONNEL && <DashboardProfessionnel />}
        {user.role === USER_ROLE.GESTIONNAIRE && <DashboardGestionnaire />}
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps<DashboardPageProps> = async (context) => {
  const userSession = await getSession(context);

  if (!userSession) {
    return {
      redirect: {
        destination: `/connexion?notify=error:${encodeURIComponent('Vous devez être connecté pour accéder à cette page')}`,
        permanent: false,
      },
    };
  }

  return { props: { user: userSession.user } };
};
