import { clientConfig } from '@/client-config';
import { Button, Layout, Link, Note, Section, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

type EnqueteSatisfactionProps = {
  firstName: string;
  date: string;
  adresse: string;
  relanceId: string;
};

const EnqueteSatisfaction = ({ firstName, date, adresse, relanceId }: EnqueteSatisfactionProps) => {
  return (
    <Layout>
      <Text>Bonjour {firstName},</Text>
      <Text>
        Le {date}, vous avez utilisé France Chaleur Urbaine pour être mis en relation avec le gestionnaire du réseau de chaleur le plus
        proche de votre adresse (<b>{adresse}</b>), et obtenir une proposition tarifaire. Merci encore pour votre confiance.
      </Text>
      <Text>
        Nous souhaiterions <b>nous assurer que notre service a bien répondu à vos attentes</b> et que votre projet de raccordement a pu
        avancer.
      </Text>
      <Text>Avez-vous été contacté(e) par le gestionnaire du réseau de chaleur ?</Text>
      <Section style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <Button
          href={`/satisfaction?id=${relanceId}&satisfaction=true`}
          campaign="demands.demandeur.enquete-satisfaction"
          content="satisfaction-oui"
          style={{ marginRight: '8px' }}
        >
          👍 Oui, j'ai été contacté(e)
        </Button>
        <Button
          href={`/satisfaction?id=${relanceId}&satisfaction=false`}
          campaign="demands.demandeur.enquete-satisfaction"
          content="satisfaction-non"
        >
          👎 Non, pas encore
        </Button>
      </Section>
      <Text>
        <Link href={clientConfig.calendarLink}>Je prends rendez-vous</Link> avec France Chaleur Urbaine
      </Text>
      <Text>Nous restons à votre disposition pour toute information complémentaire.</Text>
      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
      <Note>
        Suivez notre actualité sur <Link href={clientConfig.linkedInUrl}>Linkedin</Link>
      </Note>
    </Layout>
  );
};

export const scenarios = defineEmailScenarios<typeof EnqueteSatisfaction>({
  defaut: {
    label: 'Relance satisfaction utilisateur',
    props: {
      adresse: '15 Rue Victor Renelle 93240 Stains',
      date: '01/08/2024',
      firstName: 'Alain',
      relanceId: 'sample-relance-id',
    },
  },
});

export default EnqueteSatisfaction;
