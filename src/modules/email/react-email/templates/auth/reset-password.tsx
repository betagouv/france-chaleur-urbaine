import { clientConfig } from '@/client-config';

import { Button, Layout, Link, Section, Text } from '../../components';

export const ResetPasswordEmail = ({ token }: { token: string }) => {
  const url = `${clientConfig.websiteUrl}/reset-password/${token}`;

  return (
    <Layout>
      <Text>Bonjour,</Text>
      <Text>Pour réinitialiser votre mot de passe, veuillez cliquer sur le bouton suivant :</Text>
      <Section style={{ padding: '8px 0' }}>
        <Button href={url} campaign="auth.reset-password">
          Réinitialiser
        </Button>
      </Section>
      <Text>
        Si vous n'utilisez pas ce lien d'ici 3 heures, il expirera.
        <Link href="/reset-password">Cliquez ici pour obtenir un nouveau lien de réinitialisation de mot de passe.</Link>
      </Text>
      <Text>
        Et si cela ne fonctionne toujours pas, ou en cas d'autres questions ou problèmes avec votre compte, vous pouvez utiliser le{' '}
        <Link href="/contact" campaign="auth.reset-password" content="contact">
          formulaire de contact
        </Link>
        .
      </Text>
      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export default ResetPasswordEmail;
