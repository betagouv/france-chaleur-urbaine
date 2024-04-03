import ContactForm from '@components/ContactForm';
import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';

function contact() {
  return (
    <SimplePage title="Contact : France Chaleur Urbaine">
      <Box py="4w" className="fr-container">
        <Heading as="h1" color="blue-france">
          Nous contacter
        </Heading>

        <p>
          Vous avez une question suite à votre demande sur France Chaleur
          Urbaine ? Vous souhaitez nous faire part de suggestions pour améliorer
          notre service ? Vous êtes intéressé par un partenariat avec France
          Chaleur Urbaine ? Pour ces questions ou toute autre, n’hésitez pas à
          nous contacter via le formulaire ci-dessous : nous reviendrons
          rapidement vers vous.
        </p>

        <ContactForm />
      </Box>
    </SimplePage>
  );
}

export default contact;
