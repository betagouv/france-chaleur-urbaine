import CenterLayout from '@/components/shared/page/CenterLayout';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';

export default function BravoPage() {
  return (
    <SimplePage title="Inscription" description="Inscription presque terminée">
      <CenterLayout textAlign="center">
        <img src="/img/inscription-bravo.svg" alt="" className="mx-auto" />
        <Heading as="h1" size="h2" color="blue-france" mt="4w">
          Félicitations, vous venez de créer votre compte !
        </Heading>

        <Text>Vous allez recevoir un courriel de confirmation à l'adresse renseignée.</Text>
        <Text>(n'oubliez pas de vérifier vos indésirables)</Text>
      </CenterLayout>
    </SimplePage>
  );
}
