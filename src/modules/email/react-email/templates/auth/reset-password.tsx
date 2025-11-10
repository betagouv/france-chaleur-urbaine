import { clientConfig } from '@/client-config';

import { Button, Layout, type LayoutModifiableProps, Section, Text, Url } from '../../components';

export const ResetPasswordEmail = ({ token, ...props }: { token: string } & LayoutModifiableProps) => {
  const url = `${clientConfig.websiteOrigin}/reset-password/${token}`;

  return (
    <Layout {...props}>
      <Text>Bonjour ! 👋</Text>
      <Text>Pour réinitialiser votre mot de passe, veuillez cliquer sur le bouton suivant (valable pendant 3 heures) :</Text>
      <Section style={{ padding: '8px 0' }}>
        <Button href={url}>Réinitialiser</Button>
      </Section>
      <Text>
        Si le bouton ne fonctionne pas, veuillez copier directement le lien ci-dessous et le coller dans la barre d'adresse de votre
        navigateur :
      </Text>
      <Url>{url}</Url>
      <Text>
        Et si cela ne fonctionne toujours pas, ou en cas d'autres questions ou problèmes avec votre compte, n'hésitez pas à répondre à ce
        mail, notre équipe de support se fera un plaisir de vous aider !
      </Text>
      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export default ResetPasswordEmail;
