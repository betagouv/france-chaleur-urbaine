import { Callout, Layout, Link, Text } from '../../components';

type NewDemandsEmailProps = {
  nbDemands: number;
};

export const NewDemandsEmail = ({ nbDemands }: NewDemandsEmailProps) => {
  return (
    <Layout>
      <Text>Bonjour,</Text>
      {nbDemands > 1 ? (
        <>
          <Text>De nouvelles demandes ont été déposées sur France Chaleur Urbaine à proximité de votre réseau de chaleur.</Text>
          <Text>
            Pour retrouver les demandes, rendez-vous dans votre{' '}
            <Link href="/pro/demandes" campaign="demands.gestionnaire-new">
              espace gestionnaire
            </Link>
            .
          </Text>
          <Text>
            Une fois les demandes prises en charge, nous vous invitons à actualiser le statut de celles-ci (en fonction de leur évolution).
          </Text>
        </>
      ) : (
        <>
          <Text>Une nouvelle demande a été déposée sur France Chaleur Urbaine à proximité de votre réseau de chaleur.</Text>
          <Text>
            Pour retrouver la demande, rendez-vous dans votre{' '}
            <Link href="/pro/demandes" campaign="demands.gestionnaire-new">
              espace gestionnaire
            </Link>
            .
          </Text>
          <Text>
            Une fois la demande prise en charge, nous vous invitons à actualiser le statut de celle-ci (en fonction de son évolution).
          </Text>
        </>
      )}
      <Text>
        À noter : certaines demandes peuvent être éloignées du réseau de chaleur. France Chaleur Urbaine transmet l'ensemble des demandes
        reçues aux gestionnaires des réseaux dans l'éventualité de projets d'extension.
      </Text>
      <Callout>
        Lors de la première connexion, il est nécessaire de cliquer sur « Mot de passe oublié » pour créer votre mot de passe.
      </Callout>
      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export default NewDemandsEmail;
