import { type GetServerSideProps } from 'next';

import DashboardAdmin from '@/components/dashboard/DashboardAdmin';
import DashboardGestionnaire from '@/components/dashboard/DashboardGestionnaire';
import DashboardProfessionnel from '@/components/dashboard/DashboardProfessionnel';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import { type AuthSSRPageProps, withAuthentication } from '@/server/helpers/ssr/withAuthentication';

export default function DashboardPage({ user }: AuthSSRPageProps) {
  return (
    <SimplePage title="Tableau de bord" mode="authenticated">
      <Box as="main" className="fr-container" my="4w">
        <Heading as="h1" color="blue-france">
          Tableau de bord
        </Heading>
        {user.roles.includes('admin') && <DashboardAdmin />}
        {user.roles.includes('gestionnaire') && <DashboardGestionnaire />}
        {user.roles.includes('professionnel') && <DashboardProfessionnel />}
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps = withAuthentication();
