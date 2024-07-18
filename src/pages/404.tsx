import Link from 'next/link';
import SimplePage from '@components/shared/page/SimplePage';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
// import { Container } from '@codegouvfr/react-dsfr/Con';

export default function Custom404() {
  return (
    <SimplePage title="Page non trouvée : France Chaleur Urbaine">
      <div className="fr-container fr-py-4w fr-mb-16w">
        <Heading size="h3">Page non trouvée</Heading>
        <Text mb="3w">
          La page que vous recherchez n’existe pas ou a été déplacée.
        </Text>
        <Link
          href="/"
          className="fr-link fr-icon-arrow-left-line fr-link--icon-left"
        >
          Retour à l'accueil
        </Link>
      </div>
    </SimplePage>
  );
}
