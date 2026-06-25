import { Callout, Layout, Link, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const RappelDemandesEnAttente = () => {
  return (
    <Layout>
      <Text>Bonjour,</Text>
      <Text>
        Vous avez une ou plusieurs demandes de raccordement en attente sur votre « 
        <Link href="/pro/demandes" campaign="demands.gestionnaire.rappel-demandes-en-attente">
          Espace Gestionnaire
        </Link>{' '}
        ».
      </Text>
      <Text>
        Pour rappel, le statut par défaut est À traiter.{' '}
        <b>Nous vous invitons à renseigner le statut des demandes dès lors qu’elles sont prises en charge.</b> Cette information a
        uniquement pour but de nous permettre d’évaluer l’impact de notre service à l’échelle nationale.
      </Text>
      <Callout>
        Lors de la première connexion, il est nécessaire de cliquer sur « Mot de passe oublié » pour créer votre mot de passe.
      </Callout>
      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export const scenarios = defineEmailScenarios<typeof RappelDemandesEnAttente>({
  defaut: {
    label: 'Relance demandes en attente',
    props: {},
  },
});

export default RappelDemandesEnAttente;
