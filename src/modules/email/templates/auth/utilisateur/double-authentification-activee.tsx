import { Layout, Link, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const DoubleAuthentificationActivee = () => (
  <Layout>
    <Text>Bonjour,</Text>
    <Text>
      Une application d'authentification vient d'être enregistrée comme second facteur de votre compte administrateur France Chaleur
      Urbaine.
    </Text>
    <Text>
      Si vous n'êtes pas à l'origine de cet enregistrement, votre mot de passe est compromis : changez-le immédiatement depuis{' '}
      <Link href="/reset-password" campaign="auth.utilisateur.double-authentification-activee">
        « Mot de passe oublié »
      </Link>{' '}
      et prévenez un autre administrateur pour qu'il réinitialise la double authentification du compte.
    </Text>
    <Text>Bien cordialement,</Text>
    <Text>L'équipe France Chaleur Urbaine</Text>
  </Layout>
);

export const scenarios = defineEmailScenarios<typeof DoubleAuthentificationActivee>({
  defaut: {
    label: 'Application enregistrée',
    props: {},
  },
});

export default DoubleAuthentificationActivee;
