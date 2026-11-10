import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import { ParticulierPhaseOutPanel } from '@/modules/users/client/admin/ParticulierPhaseOutPanel';
import { withAuthentication } from '@/server/authentication';

/**
 * Temporary page: announcement of the particulier accounts deletion. To remove with the role (phase 2).
 */
export default function SuppressionComptesParticuliersPage() {
  return (
    <SimplePage title="Suppression des comptes particuliers" mode="authenticated" layout="center">
      <Heading as="h1" color="blue-france">
        Suppression des comptes particuliers
      </Heading>
      <Text className="mb-6">
        Le compte particulier est remplacé par le suivi des demandes par email. Cette page envoie l'annonce de suppression aux comptes
        existants ; la suppression elle-même se fait à la date annoncée, en ligne de commande.
      </Text>
      <ParticulierPhaseOutPanel />
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
