import { clientConfig } from '@/client-config';
import { Button, Layout, Link, Section, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const ReinitialisationMotDePasse = ({ token }: { token: string }) => {
  const url = `${clientConfig.websiteUrl}/reset-password/${token}`;

  return (
    <Layout>
      <Text>Bonjour,</Text>
      <Text>Pour réinitialiser votre mot de passe, veuillez cliquer sur le bouton suivant :</Text>
      <Section style={{ padding: '8px 0' }}>
        <Button href={url} campaign="auth.utilisateur.reinitialisation-mot-de-passe">
          Réinitialiser
        </Button>
      </Section>
      <Text>
        Si vous n'utilisez pas ce lien d'ici 3 heures, il expirera.{' '}
        <Link href="/reset-password">Cliquez ici pour obtenir un nouveau lien de réinitialisation de mot de passe.</Link>
      </Text>
      <Text>
        Et si cela ne fonctionne toujours pas, ou en cas d'autres questions ou problèmes avec votre compte, vous pouvez utiliser le{' '}
        <Link href="/contact" campaign="auth.utilisateur.reinitialisation-mot-de-passe" content="contact">
          formulaire de contact
        </Link>
        .
      </Text>
      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export const scenarios = defineEmailScenarios<typeof ReinitialisationMotDePasse>({
  defaut: {
    label: 'Réinitialisation du mot de passe',
    props: { token: 'sample-reset-token' },
  },
});

export default ReinitialisationMotDePasse;
