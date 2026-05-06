import { Button, Callout, Layout, Link, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const OuvertureEspaceGestionnaire = () => {
  return (
    <Layout>
      <Text>Bonjour,</Text>
      <Text>
        Nous vous informons que{' '}
        <strong>vous pouvez dès aujourd'hui accéder à votre « Espace gestionnaire » sur France Chaleur Urbaine</strong>.
      </Text>
      <Text>
        L'Espace gestionnaire permet aux collectivités et exploitants d'accéder à l'ensemble des demandes reçues via France Chaleur Urbaine
        sur leur territoire / leurs réseaux.
      </Text>
      <Button href="/connexion" campaign="auth.gestionnaire.ouverture-espace" content="connexion">
        Se connecter à l'espace gestionnaire
      </Button>
      <Callout style={{ marginTop: '16px' }}>
        Lors de la première connexion, il est nécessaire de cliquer sur « Mot de passe oublié » pour définir votre mot de passe.
      </Callout>
      <Text style={{ marginTop: '24px' }}>
        Si vous êtes destinataire de ce message, c'est qu'au moins une demande de raccordement a été reçue à proximité de votre réseau dans
        les derniers mois.
      </Text>
      <Text>
        <strong>
          Nous invitons les gestionnaires des réseaux à renseigner le statut des demandes dès lors qu'elles sont prises en charge.
        </strong>{' '}
        Cette information a uniquement pour but de nous permettre d'évaluer l'impact de notre service à l'échelle nationale.
      </Text>
      <Text>
        Pour rappel,{' '}
        <Link href="/collectivites-et-exploitants" campaign="auth.gestionnaire.ouverture-espace" content="fcu-website">
          France Chaleur Urbaine
        </Link>{' '}
        est un <strong>service porté par l'ADEME qui vise à accélérer la dynamique de raccordement aux réseaux de chaleur</strong>. France
        Chaleur Urbaine permet :
      </Text>
      <Text style={{ marginLeft: '16px' }}>
        — aux <strong>copropriétaires et gestionnaires de bâtiments tertiaires</strong> de vérifier si un réseau de chaleur passe près de
        leur adresse et d'être mis en relation avec le gestionnaire du réseau le plus proche ;
      </Text>
      <Text style={{ marginLeft: '16px' }}>
        — aux <strong>collectivités et exploitants des réseaux de chaleur</strong> de disposer d'outils simples pour multiplier les
        raccordements à leurs réseaux.
      </Text>
      <Text>Nous vous remercions pour votre collaboration et restons à votre disposition pour toute information complémentaire.</Text>
      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export const scenarios = defineEmailScenarios<typeof OuvertureEspaceGestionnaire>({
  defaut: {
    label: 'Ouverture espace gestionnaire',
    props: {},
  },
});

export default OuvertureEspaceGestionnaire;
