import { DEMAND_TRACKING_PAGE_PATH } from '@/modules/demand-tracking/constants';
import { Layout, Link, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const EMAIL_CAMPAIGN = 'auth.utilisateur.suppression-compte-particulier';

type SuppressionCompteParticulierProps = {
  /** Deletion date already formatted for display, e.g. « 15 décembre 2026 ». */
  deletionDate: string;
};

const SuppressionCompteParticulier = ({ deletionDate }: SuppressionCompteParticulierProps) => (
  <Layout preview={`Votre compte particulier sera supprimé le ${deletionDate}`}>
    <Text>Bonjour,</Text>
    <Text>
      Vous avez créé un compte particulier sur France Chaleur Urbaine. Pour simplifier le service, les comptes particuliers seront supprimés
      le <strong>{deletionDate}</strong>.
    </Text>
    <Text>
      <strong>Vos demandes ne sont pas supprimées.</strong> Elles restent enregistrées et continuent d'être suivies par le gestionnaire du
      réseau de chaleur ou par le conseiller de votre territoire.
    </Text>
    <Text>
      <strong>Pour connaître leur avancement,</strong> il suffit désormais d'indiquer votre adresse email sur la page{' '}
      <Link href={DEMAND_TRACKING_PAGE_PATH} campaign={EMAIL_CAMPAIGN} content="suivre-ma-demande">
        Suivre ma demande
      </Link>
      . Vous recevrez un récapitulatif par email, sans mot de passe.
    </Text>
    <Text>
      Vous êtes un professionnel (syndic, bureau d'études, collectivité…) et souhaitez accéder aux fonctionnalités avancées (test d'adresses
      en masse, cartographie avancée…) ?{' '}
      <Link href="/inscription" campaign={EMAIL_CAMPAIGN} content="inscription">
        Créez un compte professionnel
      </Link>
      .
    </Text>
    <Text>Les données de connexion de votre compte (identifiant et mot de passe) seront supprimées à cette date.</Text>
    <Text>Bien cordialement,</Text>
    <Text>L'équipe France Chaleur Urbaine</Text>
  </Layout>
);

export const scenarios = defineEmailScenarios<typeof SuppressionCompteParticulier>({
  defaut: {
    label: 'Annonce de suppression',
    props: { deletionDate: '15 décembre 2026' },
  },
});

export default SuppressionCompteParticulier;
