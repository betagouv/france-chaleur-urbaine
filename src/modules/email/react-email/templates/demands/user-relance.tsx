import { clientConfig } from '@/client-config';

import { Button, Layout, type LayoutModifiableProps, Link, Note, Section, Text } from '../../components';

type RelanceEmailProps = {
  firstName: string;
  date: string;
  adresse: string;
  relanceId: string;
};

export const RelanceEmail = ({ firstName, date, adresse, relanceId, ...props }: RelanceEmailProps & LayoutModifiableProps) => {
  const url = `${clientConfig.websiteUrl}/satisfaction?id=${relanceId}&satisfaction=`;

  return (
    <Layout {...props}>
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
        <Button href={`${url}true`} style={{ marginRight: '8px' }}>
          👍 Oui
        </Button>
        <Button href={`${url}false`}>👎 Non</Button>
      </Section>
      <Text>
        <Link href={clientConfig.calendarLink}>Je prends rendez-vous</Link> avec France Chaleur Urbaine
      </Text>
      <Text>N'hésitez pas si vous avez la moindre question, nous nous tenons à votre disposition.</Text>
      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
      <Note>
        Suivez notre actualité sur <Link href={clientConfig.linkedInUrl}>Linkedin</Link>
      </Note>
    </Layout>
  );
};

export default RelanceEmail;
