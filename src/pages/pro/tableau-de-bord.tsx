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
        {(hasRole('gestionnaire') || hasRole('collectivite') || hasRole('alec') || hasRole('ccrt')) && <DashboardGestionnaire />}
        {(hasRole('particulier') || hasRole('professionnel')) && <DashboardProfessionnel />}
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(undefined, ({ session }) => {
  // redirection des gestionnaire en attendant qu'ils aient un tableau de bord
  if (
    session.user.role === 'gestionnaire' ||
    session.user.role === 'collectivite' ||
    session.user.role === 'alec' ||
    session.user.role === 'ccrt'
  ) {
    return {
      redirect: {
        destination: '/pro/demandes',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
});
