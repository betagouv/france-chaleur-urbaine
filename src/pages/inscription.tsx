import RegisterForm from '@/components/connexion/RegisterForm';
import CenterLayout from '@/components/shared/page/CenterLayout';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';

function InscriptionPage() {
  return (
    <SimplePage title="Création d'un compte connecté" description="Connectez-vous à votre compte France Chaleur Urbaine.">
      <CenterLayout maxWidth="600px">
        <Heading as="h1" size="h2" color="blue-france">
          Créez votre compte pour accéder à des fonctionnalités avancées
        </Heading>
        <RegisterForm />
      </CenterLayout>
    </SimplePage>
  );
}

export default InscriptionPage;
