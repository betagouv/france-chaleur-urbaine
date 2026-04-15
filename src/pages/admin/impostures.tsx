import AnonymizeToggle from '@/components/Admin/AnonymizeToggle';
import UserImpersonation from '@/components/Admin/UserImpersonation';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import Icon from '@/components/ui/Icon';
import { withAuthentication } from '@/server/authentication';

export default function Impostures() {
  return (
    <SimplePage title="Impostures" mode="authenticated">
      <div className="fr-container fr-py-4w">
        <Heading as="h1" color="blue-france">
          <Icon name="ri-spy-line" size="lg" className="fr-mr-1w" />
          Impostures
        </Heading>

        <UserImpersonation />

        <hr className="fr-mt-4w fr-mb-4w" />

        <Heading as="h2" color="blue-france">
          Anonymisation
        </Heading>
        <p className="fr-mb-2w">
          Activez l'anonymisation pour masquer les données personnelles (nom, email, téléphone) dans l'espace gestionnaire. Utile pour les
          démonstrations.
        </p>
        <AnonymizeToggle />
      </div>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
