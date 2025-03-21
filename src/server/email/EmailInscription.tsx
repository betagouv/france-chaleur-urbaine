import { Text } from '@react-email/components';

import { DSFRButton, type EmailProps, EmailTemplate } from './helpers';

type EmailInscriptionProps = EmailProps<{
  activationToken: string;
}>;

const EmailInscription = (props: EmailInscriptionProps) => {
  return (
    <EmailTemplate preview="France Chaleur Urbaine - confirmez votre email">
      <Text>Bonjour,</Text>
      <Text>
        Vous venez de créer votre espace personnel sur France Chaleur Urbaine. Veuillez cliquer sur le lien ci-dessous pour confirmer votre
        email.
      </Text>

      <DSFRButton href={`${props.websiteUrl}/connexion?activationToken=${props.activationToken}`}>Confirmer mon email</DSFRButton>

      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </EmailTemplate>
  );
};

export default EmailInscription;
