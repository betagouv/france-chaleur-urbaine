import { clientConfig } from '@/client-config';

import { Layout, type LayoutModifiableProps, Link, Note, Text } from '../../components';

export const OldDemandsEmail = ({ ...props }: LayoutModifiableProps) => {
  return (
    <Layout {...props}>
      <Text>Bonjour,</Text>
      <Text>
        Vous avez une ou plusieurs demandes de raccordement en attente sur votre « 
        <Link href={`${clientConfig.websiteOrigin}/pro/demandes`}>Espace Gestionnaire</Link> ».
      </Text>
      <Text>
        Pour rappel, le statut par défaut est « En attente de prise en charge ».{' '}
        <b>Nous vous invitons à renseigner le statut des demandes dès lors qu’elles sont prises en charge.</b> Cette information a
        uniquement pour but de nous permettre d’évaluer l’impact de notre service à l’échelle nationale.
      </Text>
      <Note>Lors de la première connexion, il est nécessaire de cliquer sur "Mot de passe oublié" pour créer votre mot de passe.</Note>
      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export default OldDemandsEmail;
