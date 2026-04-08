import { Layout, Link, Note, Section, Text } from '@/modules/email/react-email/components';

type ManagerEmailProps = {
  content: string;
  signature: string;
};

// Pas de logos pour cet email car c'est les gestionnaires qui ont la main
export const ManagerEmail = ({ content, signature }: ManagerEmailProps) => (
  <Layout variant="empty">
    <Section>
      <Text dangerouslySetInnerHTML={{ __html: content }} />
      <Text>{signature}</Text>
    </Section>
    <Section>
      <Note>
        Cet email a été envoyé via la plateforme France Chaleur Urbaine. Pour toute question, utilisez le{' '}
        <Link href="/contact" campaign="demands.custom-email" content="contact">
          formulaire de contact
        </Link>
        .
      </Note>
    </Section>
  </Layout>
);

export default ManagerEmail;
