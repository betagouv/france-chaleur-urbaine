import { clientConfig } from '@/client-config';

import { Button, Layout, type LayoutModifiableProps, Text } from '../../components';

const ActivationEmail = ({ activationToken, ...props }: { activationToken: string } & LayoutModifiableProps) => {
  return (
    <Layout {...props}>
      <Text>Bonjour,</Text>
      <Text>
        Vous venez de créer votre espace personnel sur France Chaleur Urbaine. Veuillez cliquer sur le lien ci-dessous pour confirmer votre
        email.
      </Text>

      <Button href={`${clientConfig.websiteOrigin}/connexion?activationToken=${activationToken}`}>Confirmer mon email</Button>

      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export default ActivationEmail;
