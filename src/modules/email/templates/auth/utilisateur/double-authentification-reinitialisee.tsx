import { Layout, Link, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const DoubleAuthentificationReinitialisee = () => (
  <Layout>
    <Text>Bonjour,</Text>
    <Text>
      Un administrateur vient de réinitialiser la double authentification de votre compte France Chaleur Urbaine. À votre prochaine
      connexion, il vous sera demandé d'enregistrer à nouveau une application d'authentification.
    </Text>
    <Text>
      Si vous n'avez rien demandé, connectez-vous dès que possible pour enregistrer votre application, et signalez-le via le{' '}
      <Link href="/contact" campaign="auth.utilisateur.double-authentification-reinitialisee" content="contact">
        formulaire de contact
      </Link>
      .
    </Text>
    <Text>Bien cordialement,</Text>
    <Text>L'équipe France Chaleur Urbaine</Text>
  </Layout>
);

export const scenarios = defineEmailScenarios<typeof DoubleAuthentificationReinitialisee>({
  defaut: {
    label: 'Réinitialisation par un admin',
    props: {},
  },
});

export default DoubleAuthentificationReinitialisee;
