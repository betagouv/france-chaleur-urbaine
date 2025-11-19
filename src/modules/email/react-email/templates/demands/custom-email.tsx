import { Layout, type LayoutModifiableProps, Note, Section, Text } from '@/modules/email/react-email/components';

type ManagerEmailProps = {
  content: string;
  signature: string;
};

// Pas de logos pour cet email car c'est les gestionnaires qui ont la main
export const ManagerEmail = ({ content, signature, ...props }: ManagerEmailProps & LayoutModifiableProps) => (
  <Layout variant="empty" {...props}>
    <Section>
      <Text dangerouslySetInnerHTML={{ __html: content }} />
      <Text>{signature}</Text>
    </Section>
    <Section>
      <Note>Cet email a été envoyé via la plateforme France Chaleur Urbaine</Note>
    </Section>
  </Layout>
);

export default ManagerEmail;
