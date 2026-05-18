import { Button, Layout, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const ConfirmationInscription = ({ activationToken }: { activationToken: string }) => {
  return (
    <Layout>
      <Text>Bonjour,</Text>
      <Text>
        Vous venez de créer votre espace personnel sur France Chaleur Urbaine. Veuillez cliquer sur le lien ci-dessous pour confirmer votre
        email.
      </Text>

      <Button href={`/connexion?activationToken=${activationToken}`} campaign="auth.utilisateur.confirmation-inscription">
        Confirmer mon email
      </Button>

      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export const scenarios = defineEmailScenarios<typeof ConfirmationInscription>({
  defaut: {
    label: "Confirmation d'inscription",
    props: { activationToken: 'sample-activation-token' },
  },
});

export default ConfirmationInscription;
