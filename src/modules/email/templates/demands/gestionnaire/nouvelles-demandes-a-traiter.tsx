import { Callout, Layout, Link, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

type NouvellesDemandesATraiterProps = {
  nbDemands: number;
  /** préférence `notifications.new_demands` : chaque jour ouvré, ou récapitulatif du lundi */
  frequency: 'daily' | 'weekly';
};

const NouvellesDemandesATraiter = ({ nbDemands, frequency }: NouvellesDemandesATraiterProps) => {
  const weekly = frequency === 'weekly';
  const campaign = `demands.gestionnaire.nouvelles-demandes-a-traiter-${frequency}`;
  return (
    <Layout>
      <Text>Bonjour,</Text>
      {nbDemands > 1 ? (
        <>
          <Text>
            {weekly ? 'Cette semaine, de nouvelles demandes' : 'De nouvelles demandes'} ont été déposées sur France Chaleur Urbaine à
            proximité de votre réseau de chaleur.
          </Text>
          <Text>
            Pour retrouver les demandes, rendez-vous dans votre{' '}
            <Link href="/pro/demandes" campaign={campaign}>
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
          <Text>
            {weekly ? 'Cette semaine, une nouvelle demande' : 'Une nouvelle demande'} a été déposée sur France Chaleur Urbaine à proximité
            de votre réseau de chaleur.
          </Text>
          <Text>
            Pour retrouver la demande, rendez-vous dans votre{' '}
            <Link href="/pro/demandes" campaign={campaign}>
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

export const dailyScenarios = defineEmailScenarios<typeof NouvellesDemandesATraiter>({
  plusieurs_demandes: {
    label: 'Plusieurs nouvelles demandes',
    props: { frequency: 'daily', nbDemands: 5 },
  },
  une_demande: {
    label: 'Une seule nouvelle demande',
    props: { frequency: 'daily', nbDemands: 1 },
  },
});

export const weeklyScenarios = defineEmailScenarios<typeof NouvellesDemandesATraiter>({
  plusieurs_demandes: {
    label: 'Plusieurs nouvelles demandes dans la semaine',
    props: { frequency: 'weekly', nbDemands: 5 },
  },
  une_demande: {
    label: 'Une seule nouvelle demande dans la semaine',
    props: { frequency: 'weekly', nbDemands: 1 },
  },
});

export default NouvellesDemandesATraiter;
