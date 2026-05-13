import { Layout, Link, Note, Section, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

type MessageGestionnaireProps = {
  content: string;
  signature: string;
};

// Pas de logos pour cet email car c'est les gestionnaires qui ont la main
const MessageGestionnaire = ({ content, signature }: MessageGestionnaireProps) => (
  <Layout variant="empty">
    <Section>
      <Text dangerouslySetInnerHTML={{ __html: content }} />
      <Text>{signature}</Text>
    </Section>
    <Section>
      <Note>
        Cet email a été envoyé via la plateforme France Chaleur Urbaine. Pour toute question, utilisez le{' '}
        <Link href="/contact" campaign="demands.demandeur.message-gestionnaire" content="contact">
          formulaire de contact
        </Link>
        .
      </Note>
    </Section>
  </Layout>
);

export const scenarios = defineEmailScenarios<typeof MessageGestionnaire>({
  defaut: {
    label: 'Message libre du gestionnaire',
    props: {
      content:
        '<p>Bonjour,</p><p>Nous avons bien pris en compte votre demande de raccordement. Notre équipe technique va prochainement revenir vers vous pour planifier une visite sur site.</p>',
      signature: 'Service Raccordement — Réseau de Saint-Denis',
    },
  },
});

export default MessageGestionnaire;
