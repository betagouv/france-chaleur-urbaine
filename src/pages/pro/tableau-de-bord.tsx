import DashboardAdmin from '@/components/dashboard/DashboardAdmin';
import DashboardGestionnaire from '@/components/dashboard/DashboardGestionnaire';
import DashboardProfessionnel from '@/components/dashboard/DashboardProfessionnel';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import { useAuthentication } from '@/modules/auth/client/hooks';
import { withAuthentication } from '@/server/authentication';

export default function DashboardPage() {
  const { hasRole } = useAuthentication();

  return (
    <SimplePage title="Tableau de bord" mode="authenticated">
      <Box as="main" className="fr-container" my="4w">
        <Heading as="h1" color="blue-france">
          Tableau de bord
        </Heading>
        {hasRole('admin') && <DashboardAdmin />}
        {(hasRole('gestionnaire') || hasRole('demo')) && <DashboardGestionnaire />}
        {(hasRole('particulier') || hasRole('professionnel')) && <DashboardProfessionnel />}
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(undefined, ({ session }) => {
  // redirection des gestionnaire en attendant qu'ils aient un tableau de bord
  if (session.user.role === 'gestionnaire') {
    return {
      redirect: {
        destination: '/gestionnaire/demandes',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
});
