import { Button, Callout, Layout, Link, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

function OuvertureEspaceCcrt() {
  return (
    <Layout>
      <Text>Bonjour,</Text>
      <Text>
        Nous vous informons que{' '}
        <strong>vous pouvez dès aujourd'hui accéder à votre « Espace gestionnaire » sur France Chaleur Urbaine</strong>.
      </Text>
      <Text>
        L'Espace gestionnaire vous permet d'accéder à l'ensemble des demandes d’accompagnement vers un nouveau système de chauffage reçues
        via France Chaleur Urbaine sur votre territoire.
      </Text>
      <Button href="/connexion" campaign="auth.ccrt.ouverture-espace" content="connexion">
        Se connecter à l'espace gestionnaire
      </Button>
      <Callout style={{ marginTop: '16px' }}>
        Lors de la première connexion, il est nécessaire de cliquer sur « Mot de passe oublié » pour définir votre mot de passe.
      </Callout>
      <Text style={{ marginTop: '24px' }}>
        Nous vous invitons à renseigner le statut des demandes dès lors qu'elles sont prises en charge.
      </Text>
      <Text>Nous vous remercions pour votre collaboration et restons à votre disposition pour toute information complémentaire.</Text>
      <Text>Bien cordialement,</Text>
      <Text>
        L'équipe France Chaleur Urbaine
        <br />
        <Link href="mailto:france.chaleur.urbaine@ademe.fr">france.chaleur.urbaine@ademe.fr</Link>
      </Text>
    </Layout>
  );
}

export const scenarios = defineEmailScenarios<typeof OuvertureEspaceCcrt>({
  defaut: {
    label: 'Ouverture espace gestionnaire CCRT',
    props: {},
  },
});

export default OuvertureEspaceCcrt;
