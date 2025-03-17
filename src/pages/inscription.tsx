import RegisterForm from '@/components/connexion/RegisterForm';
import CenterLayout from '@/components/shared/page/CenterLayout';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import Highlight from '@/components/ui/Highlight';
import Link from '@/components/ui/Link';

function InscriptionPage() {
  return (
    <SimplePage title="Création d'un compte connecté" description="Connectez-vous à votre compte France Chaleur Urbaine.">
      <CenterLayout maxWidth="600px">
        <Heading as="h1" size="h2" color="blue-france">
          Création de compte sur France Chaleur Urbaine
        </Heading>
        <Highlight variant="blue" size="sm">
          <span className="block">Connectez-vous pour bénéficier de fonctionnalités avancées :</span>
          <br />- <strong>Comparez</strong> simplement les coûts et <strong>émissions de CO2</strong> de 16 modes de chauffage,
          <br />- Accédez au <strong>mode avancé du comparateur</strong> afin de paramétrer vos simulations,
          <br />- <strong>Testez en masse</strong> la proximité à un réseau de chaleur,
          <br />- Envoyez des <strong>demandes d'informations groupées</strong>
        </Highlight>
        <p className="fr-text--sm">
          <strong>Vous êtes maître d'ouvrage ou gestionnaire d'un réseau de chaleur ?</strong> Retrouvez l'ensemble des demandes déposées à
          proximité de votre réseau. Pour paramétrer vos accès, merci de <Link href="/contact">nous contacter</Link>.
        </p>

        <RegisterForm />
      </CenterLayout>
    </SimplePage>
  );
}

export default InscriptionPage;
