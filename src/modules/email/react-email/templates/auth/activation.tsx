import { Button, Layout, Text } from '../../components';

const ActivationEmail = ({ activationToken }: { activationToken: string }) => {
  return (
    <Layout>
      <Text>Bonjour,</Text>
      <Text>
        Vous venez de créer votre espace personnel sur France Chaleur Urbaine. Veuillez cliquer sur le lien ci-dessous pour confirmer votre
        email.
      </Text>

      <Button href={`/connexion?activationToken=${activationToken}`} campaign="auth.activation">
        Confirmer mon email
      </Button>

      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export default ActivationEmail;
